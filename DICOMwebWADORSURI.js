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
        
        
        //Token
        this.isUseToken = false;
        this.tokenObject = undefined;

        //url-parse package
        this.hostname = undefined;
        this.pathname = undefined;
        this.port = undefined;
        this.protocol = undefined;
        this.queryParameter = undefined

        //Query Mode
        this.queryMode = undefined;

        //Response
        this.response = undefined;
    }

    async init() {
        
    }

}

export default DICOMwebWADORSURI;