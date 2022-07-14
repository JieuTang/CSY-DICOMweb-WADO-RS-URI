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
        this.studyInstanceUID = undefined

        //Query Mode
        this.queryMode = undefined;

        //Response
        this.response = undefined;
    }

    async init() {
        this.wadoParameter = _.cloneDeep(await this._getWADOParameterWithInvertObject(WADOParameter));
    }

    async renderQueryUrl() {
        await this._getSeriesInStudy();
        



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

    async _getSeriesInStudy() {
        let result = {};
        const LEVEL = "Study";
        //先用 WADO-RS 配合參數 StudyInstanceUID 查詢 有幾個 Series，建立出 SeriesInstanceUID 的 Array

        //組出 ServerURL
        let serverURL = new URL();
        serverURL.set("hostname", this.hostname);
        serverURL.set("pathname", this.pathname);
        serverURL.set("port", this.port);
        serverURL.set("protocol", AllowProtocol[this.protocol]);
        console.log(serverURL.toString());

        //取得 QueryModeStructure
        let QueryModeStructure = undefined;
        if (this.queryMode === "uri") {
            QueryModeStructure = this.wadoStructure.uri;
        } else {
            QueryModeStructure = this.wadoStructure.rs;
        }
        
        result[LEVEL] = _.get(QueryModeStructure, LEVEL);
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

    async 
}

export default DICOMwebWADORSURI;