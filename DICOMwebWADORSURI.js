import URL from "url-parse";
import _ from "lodash";
import fetch from 'node-fetch';

import AllowProtocol from "./Config/AllowProtocol.json" assert {type: "json"};
import QueryMode from "./Config/QueryMode.json" assert {type: "json"};
import WADOParameter from "./Config/WADOParameter.json" assert {type: "json"};
import WADORSStructure from "./Config/WADORSStructure.json" assert {type: "json"};
import WADOURIStructure from "./Config/WADOURIStructure.json" assert {type: "json"};

const METADATA_PROPERTY_VALUE = "MetadataURL";
const METADATA_KEY_VALUE = "Metadata";
const DESCRIPTION_PROPERTY_VALUE = "Description";
const DICOM_OBJECT_VALUE_KEYWORD = "Value";
const DESCRIPTION_ELEMENT_SERVERURL = "{s}";
const DESCRIPTION_ELEMENT_STUDY = "{study}";
const DICOM_FILE_STRUCTURE_LEVEL_DECREASE_ARRAY = ["Patient", "Study", "Series", "Instance", "Frame"];
const WADO_METADATA_START_LEVEL_NAME = "Study";
const UID_NAME = "UID";

class DICOMwebWADORSURI {
    constructor() {
        //Config
        this.wadoParameter = WADOParameter;
        this.wadoStructure = {
            rs: WADORSStructure,
            uri: WADOURIStructure
        };
        
        //Token
        this.isUseToken = false;
        this.tokenObject = undefined;

        //url-parse package
        this.hostname = undefined;
        this.pathname = undefined;
        this.port = undefined;
        this.protocol = undefined;
        this.serverURL = undefined;
        this.studyInstanceUID = undefined

        //Query Mode
        this.queryMode = undefined;
        this.queryStructure = undefined;
        
        //Response
        this.response = undefined;

        //Stage
        this.stage = {
            Study: false,
            Series: false,
            Instance: false,
            Frame: false
        };
    }

    async init() {
        //確定有 queryMode 與 url-parse package 的這些數據
        //初始化 serverURL
        this.serverURL = await this._getServerURL();

        //初始化 queryStructure
        this.queryStructure = await this._getQueryStructureByQueryMode(this.queryMode);

        //初始化 response 的 studyLevel 的 UID & 符合 queryMode 的所有查詢種類的 URL & 查詢 metadata
        this.response = await this._getInitStudyLevelElement();
    }

    async querySeriesByStudy() {
        const LAST_LEVEL_NAME = "Study";
        const LEVEL_NAME = "Series";

        //檢查 this.stage.study 是否為 true，代表 study 已經有資料。
        if (!(await this._isStageComplete(LAST_LEVEL_NAME))) {
            throw `${LAST_LEVEL_NAME} 尚未完成初始化。`;
        }


        //取得 study level 的 metadata 之後，建立 SeriesInstanceUIDList。
        let tempStudyLevelMetadata = _.cloneDeep(_.get(this.response, METADATA_KEY_VALUE));
        let SeriesInstanceUIDList = [];
        let uidMetadataCode = _.head(_.values(_.get(this.wadoParameter, LAST_LEVEL_NAME)));
        _.forEach(tempStudyLevelMetadata, (singleSeriesMetadataObject) => {
            let uidOjbect = _.get(singleSeriesMetadataObject, uidMetadataCode)
            let uidValue = _.head(_.get(uidOjbect, DICOM_OBJECT_VALUE_KEYWORD));
            SeriesInstanceUIDList.push(uidValue);
        });


        //根據 SeriesInstanceUIDList，跑迴圈，每個 UID 都開始建立 Series 的 Object，最終更新至 this.response。
        let tempSeriesObject = [];
        for (let i = 0; i < SeriesInstanceUIDList.length; i++) {
            let uidValue = SeriesInstanceUIDList[i];
            let result = await this._getSeriesObject(LEVEL_NAME, uidValue);
            tempSeriesObject.push(_.cloneDeep(result));
        }
        _.set(this.response, LEVEL_NAME, _.cloneDeep(tempSeriesObject));


        //確認無誤之後，開始更新 this.stage.Series。
        this.stage.Series = true;
    }

    async queryInstanceBySeries() {
        const LAST_LEVEL_NAME = "Series";
        const LEVEL_NAME = "Instance";

        //檢查 this.stage.study 是否為 true，代表 study 已經有資料。
        if (!(await this._isStageComplete(LAST_LEVEL_NAME))) {
            throw `${LAST_LEVEL_NAME} 尚未完成初始化。`;
        }

        //取得 seriesObject，並直接渲染所有 instance。
        let seriesObject = _.has(this.response, LAST_LEVEL_NAME) ? _.get(this.response, LAST_LEVEL_NAME) : undefined;
        
        for (let index = 0; index < seriesObject.length; index++) {
            let singleSeries = seriesObject[index];
            let tempObject = await this._getInstanceBySingleSeries(singleSeries); 
            _.set(singleSeries, LEVEL_NAME, _.cloneDeep(tempObject));
            _.set(seriesObject, index, _.cloneDeep(singleSeries));
        }
        _.set(this.response, LAST_LEVEL_NAME, _.cloneDeep(seriesObject));
    }


    // Private Function ============================================================================================
    // Private Function ============================================================================================
    // Private Function ============================================================================================
    // Private Function ============================================================================================
    // Private Function ============================================================================================

    async _getServerURL() {
        let result = undefined;

        let serverURL = new URL();
        serverURL.set("hostname", this.hostname);
        serverURL.set("pathname", this.pathname);
        serverURL.set("port", this.port);
        serverURL.set("protocol", AllowProtocol[this.protocol]);
        result = serverURL.toString();

        return result;
    }

    async _getQueryStructureByQueryMode(queryMode) {
        let result = undefined;

        if (await this._isQueryModeAllow(queryMode)) {
            if (queryMode === "uri") {
                result = this.wadoStructure.uri;
            } else {
                result = this.wadoStructure.rs;
            }
        }

        return result;
    }

    async _getInitStudyLevelElement() {
        let result = undefined;
        const LEVEL_NAME = "Study";
        

        //取得符合 queryMode 的所有查詢種類的 URL ===============================================================================

        //確認本次 queryMode 這個 Level 的 查詢種類 的 URL Template
        let urlTemplates = {};
        _.forEach(this.queryStructure[LEVEL_NAME], (value, key) => {
            let tempObject = {};
            tempObject[key] = value;
            urlTemplates = _.assign(urlTemplates, tempObject);
        });
        
        //確認本次 URL Template 出現的變數 ValueSet
        const DESCRIPTION_VALUE_SET = await this._getDescriptionKeysValueSet(this.queryStructure);
        const THIS_LEVEL_PARAMETER_VALUE_SET = await this._getThisLevelParameterValueSet(LEVEL_NAME, this.queryStructure, DESCRIPTION_VALUE_SET);

        //這次的 ValueSet 的變數給予數值
        let descriptionParameter = await this._getDefaultDescriptionParameter(THIS_LEVEL_PARAMETER_VALUE_SET);

        //確定塞的數值是在 本次出現的變數裡面
        if (!(_.isEqual(_.keys(descriptionParameter), THIS_LEVEL_PARAMETER_VALUE_SET))) {
            throw "設定的變數集合 不等於 本此出現的變數集合";
        }
        
        //替換本次 URL Template 的 變數
        let urlResult = _.cloneDeep(urlTemplates);
        _.forEach(descriptionParameter, (value, key) => {
            let variable = key;
            let data = value;
            _.forEach(urlResult, (value, key) => {
                urlResult[key] = _.replace(value, variable, data);
            });
        });

        //丟到 result
        result = _.assign(result, urlResult);


        //取得 studyLevel 的 UID ==============================================================================================
        let tempUIDObject = {};
        tempUIDObject[UID_NAME] = this.studyInstanceUID;
        result = _.assign(result, tempUIDObject);


        //取得 Metadata =======================================================================================================
        let metadataURL = await this._getMetadataUrlInThisObject(result);
        result = _.assign(result, await this._getMetadataByURL(metadataURL));


        //更新Stage ===========================================================================================================
        this.stage.Study = true;


        return _.cloneDeep(result);
    }

    async _getInstanceBySingleSeries(singleSeries) {
        let result = undefined;

        const LEVEL_NAME = "Instance";


        //取得當前 查詢模式結構
        let urlTemplates = {};
        _.forEach(this.queryStructure[LEVEL_NAME], (value, key) => {
            let tempObject = {};
            tempObject[key] = value;
            urlTemplates = _.assign(urlTemplates, tempObject);
        });
        result = urlTemplates;
        
        //取得 查詢模式結構所需 uid
        const DESCRIPTION_VALUE_SET = await this._getDescriptionKeysValueSet(this.queryStructure);
        const THIS_LEVEL_PARAMETER_VALUE_SET = await this._getThisLevelParameterValueSet(LEVEL_NAME, this.queryStructure, DESCRIPTION_VALUE_SET);
        let descriptionParameter = await this._getDefaultDescriptionParameter(THIS_LEVEL_PARAMETER_VALUE_SET);
        descriptionParameter = _.set(descriptionParameter, "{series}", _.get(singleSeries, UID_NAME));
        result = await this._getRenderedSingleSeries(singleSeries, urlTemplates, descriptionParameter);
        

        return result;
    }

    async _getRenderedSingleSeries(singleSeries, urlTemplates, descriptionParameter) {
        let result = [];

        let MetadataOfInstances = _.get(singleSeries, METADATA_KEY_VALUE);
        let tempDescriptionParameter = _.cloneDeep(descriptionParameter);

        //造訪每個 Instance
        for (let i = 0; i < MetadataOfInstances.length; i++) {
            let tempObject = {};

            //取得 URL
            let MetadataOfInstance = MetadataOfInstances[i];
            let codeOfInstanceUID = _.get(_.get(this.wadoParameter, "Series"), _.get(_.get(this.queryStructure, DESCRIPTION_PROPERTY_VALUE), "{instance}"));
            let instanceUID = _.first(_.get(_.get(MetadataOfInstance, codeOfInstanceUID), DICOM_OBJECT_VALUE_KEYWORD));
            tempDescriptionParameter = _.set(tempDescriptionParameter, "{instance}", instanceUID);
            let urlResult = _.cloneDeep(urlTemplates);
            
            _.forEach(tempDescriptionParameter, (variable, data) => {
                _.forEach(urlResult, (value, key) => {
                    urlResult[key] = _.replace(value, data, variable);
                })
            })
            tempObject = _.assign(tempObject, urlResult);
            
            //取得 studyLevel 的 UID
            let tempUIDObject = {};
            tempUIDObject[UID_NAME] = instanceUID;
            tempObject = _.assign(tempObject, tempUIDObject);
            
            //取得 Metadata
            let metadataURL = await this._getMetadataUrlInThisObject(tempObject);
            tempObject = _.assign(tempObject, await this._getMetadataByURL(metadataURL));

            //取得底下的 Frame
            let tempFrameObject = await this._getFrameObject(tempObject, tempDescriptionParameter);
            _.set(tempObject, "Frame", _.cloneDeep(tempFrameObject));
            result.push(_.cloneDeep(tempObject));
            
        }
        

        return _.cloneDeep(result);
    }



    async _getFrameObject(singleInstance, descriptionParameter) {
        let result = undefined;

        const LAST_LEVEL_NAME = "Instance";
        const THIS_LEVEL_NAME = "Frame";
        const FRAME_PARAMETER = "{frames}";

        let codeOfNumberOfFrames = _.get(_.get(this.wadoParameter, LAST_LEVEL_NAME), _.get(_.get(this.queryStructure, DESCRIPTION_PROPERTY_VALUE), FRAME_PARAMETER));
        let numberOfFrames = _.get(_.get(_.first(_.get(singleInstance, METADATA_KEY_VALUE)), codeOfNumberOfFrames), DICOM_OBJECT_VALUE_KEYWORD);
        


        if (!(_.isEqual(numberOfFrames, undefined))) {
            let framesObject = {};
            for (let i = 1; i <= numberOfFrames; i++) {
                let tempObject = {};

                let tempDescriptionParameter = _.set(descriptionParameter, FRAME_PARAMETER, i);
                
                //取得當前 查詢模式結構
                let urlTemplates = {};
                _.forEach(this.queryStructure[THIS_LEVEL_NAME], (value, key) => {
                    let tempObject = {};
                    tempObject[key] = value;
                    urlTemplates = _.assign(urlTemplates, tempObject);
                });
                
                //取得URL
                let urlResult = _.cloneDeep(urlTemplates);
                _.forEach(tempDescriptionParameter, (variable, data) => {
                    _.forEach(urlResult, (value, key) => {
                        urlResult[key] = _.replace(value, data, variable);
                    })
                })

                //組成Object
                tempObject = _.set(tempObject, i, urlResult);
                
                framesObject = _.cloneDeep(_.assign(framesObject, tempObject));
                
            }
            result = _.cloneDeep(_.assign(result, framesObject));
        }

        return result;
    }



    async _getSeriesObject(levelName, uidValue) {
        let result = undefined;

        //取得符合 queryMode 的所有查詢種類的 URL ===============================================================================

        //確認本次 queryMode 這個 Level 的 查詢種類 的 URL Template
        let urlTemplates = {};
        _.forEach(this.queryStructure[levelName], (value, key) => {
            let tempObject = {};
            tempObject[key] = value;
            urlTemplates = _.assign(urlTemplates, tempObject);
        });
        
        
        //確認本次 URL Template 出現的變數 ValueSet
        const DESCRIPTION_VALUE_SET = await this._getDescriptionKeysValueSet(this.queryStructure);
        const THIS_LEVEL_PARAMETER_VALUE_SET = await this._getThisLevelParameterValueSet(levelName, this.queryStructure, DESCRIPTION_VALUE_SET);
        
        //這次的 ValueSet 的變數給予數值
        let descriptionParameter = await this._getDefaultDescriptionParameter(THIS_LEVEL_PARAMETER_VALUE_SET);
        descriptionParameter = _.set(descriptionParameter, "{series}", uidValue);

        //確定塞的數值是在 本次出現的變數裡面
        if (!(_.isEqual(_.keys(descriptionParameter), THIS_LEVEL_PARAMETER_VALUE_SET))) {
            throw "設定的變數集合 不等於 本此出現的變數集合";
        }
        
        //替換本次 URL Template 的 變數
        let urlResult = _.cloneDeep(urlTemplates);
        _.forEach(descriptionParameter, (value, key) => {
            let variable = key;
            let data = value;
            _.forEach(urlResult, (value, key) => {
                urlResult[key] = _.replace(value, variable, data);
            });
        });
        result = urlResult;

        //丟到 result
        result = _.assign(result, urlResult);


        //取得 seriesLevel 的 UID ==============================================================================================
        let tempUIDObject = {};
        tempUIDObject[UID_NAME] = uidValue;
        result = _.assign(result, tempUIDObject);


        //取得 Metadata =======================================================================================================
        let metadataURL = await this._getMetadataUrlInThisObject(result);
        result = _.assign(result, await this._getMetadataByURL(metadataURL));


        


        return _.cloneDeep(result);
    }

    async _getDefaultDescriptionParameter(thisLevelParameterValueSet) {
        let result = undefined;

        _.forEach(thisLevelParameterValueSet, (value) => {
            let tempObject = {};
            tempObject[value] = undefined;
            result = _.assign(result, tempObject);
        });

        if (_.has(result, DESCRIPTION_ELEMENT_SERVERURL)) {
            result[DESCRIPTION_ELEMENT_SERVERURL] = this.serverURL;
        } else {
            throw "填入伺服器網址時錯誤。";
        }

        if (_.has(result, DESCRIPTION_ELEMENT_STUDY)) {
            result[DESCRIPTION_ELEMENT_STUDY] = this.studyInstanceUID;
        } else {
            throw "填入 Study Instance UID 時錯誤。";
        }


        return result;
    }

    async _isStageComplete(levelName) {
        return _.get(this.stage, levelName);
    }

    async _getMetadataByURL(url) {
        let result = undefined;
        
        
        let tempMetadataObject = {};
        tempMetadataObject[METADATA_KEY_VALUE] = await this._getRequestResponse(url);
        result = _.assign(result, tempMetadataObject)

        return result;
    }

    async _getMetadataUrlInThisObject(object) {
        let result = undefined;

        
        result = object[METADATA_PROPERTY_VALUE];

        return result;
    }

    async _getRequestResponse(url) {
        let result = undefined;
        let response = undefined;
        
        if (this.isUseToken) {
            response = await fetch(url, {
                headers: this.tokenObject
            });
        } else {
            response = await fetch(url);
        }

        result = await response.json();

        return result;
    }

    async _getThisLevelParameterValueSet(level, queryStructure, descriptionValueSet) {
        let result = [];

        let urlTemplates = [];
        _.forEach(queryStructure[level], (value, key) => {
            urlTemplates.push(value);
        });

        for (let i = 0; i < urlTemplates.length; i++) {
            let urlTemplate = urlTemplates[i];
            for (let j = 0; j < descriptionValueSet.length; j++) {
                let descriptionValue = descriptionValueSet[j];
                if (await this._isKeywordInText(urlTemplate, descriptionValue)) {
                    result.push(descriptionValue);
                }
            }
        }
        
        result = _.uniq(result);

        return result;
    }
    
    async _getDescriptionKeysValueSet(queryStructure) {
        let result = undefined;

        result = _.keys(queryStructure[DESCRIPTION_PROPERTY_VALUE]);

        return result;
    }

    async _isKeywordInText(text, keyword) {
        return text.includes(keyword);
    }

    async _isQueryModeAllow(queryMode) {
        let result = false;

        const QUERYMODE_VALUE_SET = _.keys(QueryMode);
        if (!(_.includes(QUERYMODE_VALUE_SET, queryMode))) {
            throw "queryMode is not allow.";
        } else {
            result = true;
        }

        return result;
    }





























































    
}

export default DICOMwebWADORSURI;