import URL from "url-parse";
import _ from "lodash";
import fetch from 'node-fetch';

import AllowProtocol from "./Config/AllowProtocol.json" assert {type: "json"};
import QueryMode from "./Config/QueryMode.json" assert {type: "json"};
import WADOParameter from "./Config/WADOParameter.json" assert {type: "json"};
import WADORSStructure from "./Config/WADORSStructure.json" assert {type: "json"};
import WADOURIStructure from "./Config/WADOURIStructure.json" assert {type: "json"};


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
    }

    async init() {
        //確定有 queryMode 與 url-parse package 的這些數據
        //初始化 wadoParameter
        this.wadoParameter = _.cloneDeep(await this._getWADOParameterWithInvertObject(WADOParameter));

        //初始化 serverURL
        this.serverURL = await this._getServerURL();

        //初始化 queryStructure
        this.queryStructure = await this._getQueryStructureByQueryMode(this.queryMode);

        //初始化 response 的 studyLevel 的 UID & 符合 queryMode 的所有查詢種類的 URL
        this.response = await this._getInitStudyLevelElement();

        //查詢 studyLevel 的 Metadata 塞到 response 裡面
    }

    async _getInitStudyLevelElement() {
        let result = undefined;
        const LEVEL = "Study";
        const UID = "UID";

        //取得符合 queryMode 的所有查詢種類的 URL ===============================================================================

        //確認本次 queryMode 這個 Level 的 查詢種類 的 URL Template
        let urlTemplates = {};
        _.forEach(this.queryStructure[LEVEL], (value, key) => {
            let tempObject = {};
            tempObject[key] = value;
            urlTemplates = _.assign(urlTemplates, tempObject);
        });
        
        //確認本次 URL Template 出現的變數 ValueSet
        const DESCRIPTION_VALUE_SET = await this._getDescriptionKeysValueSet(this.queryStructure);
        const THIS_LEVEL_PARAMETER_VALUE_SET = await this._getThisLevelParameterValueSet(LEVEL, this.queryStructure, DESCRIPTION_VALUE_SET);

        //這次的 ValueSet 的變數給予數值
        let descriptionParameter = {"{s}": this.serverURL,
                                    "{study}": this.studyInstanceUID};

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
        tempUIDObject[UID] = this.studyInstanceUID;
        result = _.assign(result, tempUIDObject);


        //取得 Metadata =======================================================================================================
        let tempMetadataObject = {};
        const METADATA_PROPERTY_VALUE = "MetadataURL";
        const METADATA_KEY_VALUE = "Metadata"
        let metadataURL = result[METADATA_PROPERTY_VALUE];
        tempMetadataObject[METADATA_KEY_VALUE] = await this._getRequestResponse(metadataURL)
        result = _.assign(result, tempMetadataObject);


        return _.cloneDeep(result);
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

    async _combineObjectWithInvertObjectIntoOriginalObject(object1) {
        return _.assign(object1, _.invert(object1));
    }

    async _getWADOParameterWithInvertObject(wadoParameter) {        
        let result = wadoParameter
        await this._combineObjectWithInvertObjectIntoOriginalObject(_.get(result, "Patient"));
        await this._combineObjectWithInvertObjectIntoOriginalObject(_.get(result, "Study"));
        await this._combineObjectWithInvertObjectIntoOriginalObject(_.get(result, "Series"));
        await this._combineObjectWithInvertObjectIntoOriginalObject(_.get(result, "Instance"));
        return result;
    }

    async _getDescriptionKeysValueSet(queryStructure) {
        let result = undefined;

        const DESCRIPTION_VALUE_SET = ["Description"];
        result = _.keys(queryStructure[DESCRIPTION_VALUE_SET]);

        return result;
    }

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
































































    async renderQueryUrl() {
        // this.queryStructure = await this._getQueryStructureByQueryMode(this.queryMode);
        await this._initDescriptionParameter(this.queryStructure);
        await this._getSeriesInStudy();
    }

    

    async _getSeriesInStudy() {
        let result = {};
        const LEVEL = "Study";
        const UID = "UID";
        const SERVER_URL = await this._getServerURL();
        
        this._updateDescriptionParameter("{s}", SERVER_URL);
        this._updateDescriptionParameter("{study}", this.studyInstanceUID);

        

        //取得 QueryStructure
        
        result[LEVEL] = _.cloneDeep(_.get(this.queryStructure, LEVEL));
        
        //加入 UID
        let uidObject = {};
        uidObject[UID] = this.studyInstanceUID;
        _.assign(result[LEVEL], uidObject);

        //整理 URL
        await this._setURL(this.queryStructure, LEVEL, SERVER_URL);
        
        

        console.log(result);
        

        //再透過這個 Array 裡面的 SeriesInstanceUID，依照 WADORSStructure，產生 StudyObject。 
        // {
        //     "Study": [
        //         {
        //             "${SeriesInstanceUID_1}" : {
        //                 "URL" : {
        //                     "Entire": "{s}/studies/{study}",
        //                     "Rendered": "{s}/studies/{study}/rendered",
        //                     "Metadata": "{s}/studies/{study}/series" 
        //                 },
        //                 "Metadata": null
        //             }
        //         },
        //         {
        //             "${SeriesInstanceUID_2}" : {
        //                 "URL" : {
        //                     "Entire": "{s}/studies/{study}",
        //                     "Rendered": "{s}/studies/{study}/rendered",
        //                     "Metadata": "{s}/studies/{study}/series" 
        //                 },
        //                 "Metadata": null
        //             }
        //         }
        //     ]
        // }
        return result;
    }

    

    async _setURL(queryStructure, level, serverURL) {
        const LEVEL_VALUE_SET = await this._getQueryStructureLevelValueSet(queryStructure);
        const DESCRIPTION_VALUE_SET = await this._getDescriptionKeysValueSet(queryStructure);
        const THIS_LEVEL_PARAMETER_VALUE_SET = await this._getThisLevelParameterValueSet(level, queryStructure, DESCRIPTION_VALUE_SET);
        const THIS_LEVEL_PROPERTY_VALUE_SET = _.keys(queryStructure[level]);


        queryStructure["Description"]["{s}"] = serverURL;
        queryStructure["Description"]["{study}"] = this.studyInstanceUID;


        queryStructure[level] 


        console.log(`\nLEVEL_VALUE_SET:`);
        console.log(LEVEL_VALUE_SET);
        console.log(`\nDESCRIPTION_VALUE_SET:`);
        console.log(DESCRIPTION_VALUE_SET);
        console.log(`\nTHIS_LEVEL_PARAMETER_VALUE_SET:`);
        console.log(THIS_LEVEL_PARAMETER_VALUE_SET);
        console.log(`\nTHIS_LEVEL_PROPERTY_VALUE_SET:`);
        console.log(THIS_LEVEL_PROPERTY_VALUE_SET);
        console.log(`\nqueryStructure:`);
        console.log(queryStructure);
        console.log("\n\n\n\n");
    }

    async _getQueryStructureLevelValueSet(queryStructure) {
        let result = undefined;

        const NOT_LEVEL_VALUE_SET = ["Description"];
        result = _.keys(_.omit(queryStructure, NOT_LEVEL_VALUE_SET));

        return result;
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

    
    async _isKeywordInText(text, keyword) {
        return text.includes(keyword);
    }

    

    // async _updateDescriptionParameter(key, value) {
    //     const DESCRIPTION_VALUE_SET = await this._getDescriptionKeysValueSet(this.queryStructure);
    //     if (_.includes(DESCRIPTION_VALUE_SET, key)) {
    //         this.descriptionParameter[key] = value;
    //     }
    // }

    // async _initDescriptionParameter(queryStructure) {
    //     const DESCRIPTION_VALUE_SET = await this._getDescriptionKeysValueSet(queryStructure);
        
    //     _.forEach(DESCRIPTION_VALUE_SET, (value) => {
    //         let tempObject = {};
    //         tempObject[value] = undefined;
    //         this.descriptionParameter = _.assign(this.descriptionParameter, tempObject);
    //     });

    // }
}

export default DICOMwebWADORSURI;