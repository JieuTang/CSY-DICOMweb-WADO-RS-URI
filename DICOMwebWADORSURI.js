import URL from "url-parse";
import _ from "lodash";
import fetch from 'node-fetch';
import Study from "./myClass/Study.js";

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
        this.serverURL = undefined;
        this.studyInstanceUID = undefined

        //Query Mode
        this.queryMode = undefined;
        
        //Response
        this.response = undefined;
    }

    async init() {
        this.serverURL = await this._getServerURL();
    }

    async querySeries() {
        let study = new Study(this.serverURL, this.queryMode, this.studyInstanceUID);
        await study.querySeries();
        this.response = study;
    }
    
    async renderAllSeries() {
        let study = new Study(this.serverURL, this.queryMode, this.studyInstanceUID);
        await study.renderAllSeries();
        this.response = study;
    }

    async renderSpecificSeries(seriesInstanceUID) {
        let study = new Study(this.serverURL, this.queryMode, this.studyInstanceUID);
        await study.renderSpecificSeries(seriesInstanceUID);
        this.response = study;
    }

    async _getServerURL() {
        let result = undefined;

        let serverURL = new URL();
        serverURL.set("hostname", this.hostname);
        serverURL.set("pathname", this.pathname);
        serverURL.set("port", this.port);
        serverURL.set("protocol", this.protocol);
        result = serverURL.toString();

        return result;
    }
}

export default DICOMwebWADORSURI;