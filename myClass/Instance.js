import _ from "lodash";
import fetch from 'node-fetch';
import Frame from "./Frame.js";

class Instance {
    constructor(parameter, queryMode, uid) {
        this.uid = uid;

        this.parameter = _.assign(parameter, { "{instance}": uid });

        this.queryMode = queryMode;

        this.url = {
            "rs": {
                "entire": "{s}/studies/{study}/series/{series}/instances/{instance}",
                "rendered": "{s}/studies/{study}/series/{series}/instances/{instance}/rendered",
                "metadata": "{s}/studies/{study}/series/{series}/instances/{instance}/metadata"
            },
            "uri": {
                "entire": "{s}/wado?requestType=WADO/&studyUID={study}&seriesUID={series}&objectUID={instance}",
                "metadata": "{s}/studies/{study}/series/{series}/instances/{instance}/metadata"
            }
        };

        this.isUseToken = false;
        this.tokenObject = null;
        
        this.metadata = null;

        this.codeOfNumberOfFrames = "00280008";

        this.Frames = null;
    }

    async init() {
        await this._validateQueryMode();
        await this._replaceUrlParameter();
        this.metadata = _.first(await this._getMetadata(_.get(_.get(this.url, this.queryMode), "metadata")));
        this.Frames = await this._getFrames();
    }

    async _getFrames() {
        let result = [];

        let numberOfFrame = _.first(_.get(_.get(this.metadata, this.codeOfNumberOfFrames), "Value"));

        for (let i = 1; i <= numberOfFrame; i++) {
            let tempObject = undefined;
            tempObject = new Frame(this.parameter, this.queryMode, i);
            await tempObject.init();
            result.push(tempObject);
        }


        
        return result;
    }











































































    async _validateQueryMode() {
        let queryModeValueSet = _.keys(this.url);
        if ( !(_.includes(queryModeValueSet, this.queryMode)) ) {
            throw `查詢模式必須是 ${_.toString(queryModeValueSet)}`;
        }
    }

    async _replaceUrlParameter() {
        _.forEach(_.get(this.url, this.queryMode), (urlTemplate, key) => {
            _.forEach(this.parameter, (valueOfParameter, keyOfParameter) => {
                urlTemplate = _.replace(urlTemplate, keyOfParameter, valueOfParameter);
            });
            _.set(_.get(this.url, this.queryMode), key, urlTemplate);
        });
    }
    
    async _getMetadata(metadataURL) {
        return await this._getJsonResponseFromURL(metadataURL);
    }

    async _getJsonResponseFromURL(url) {
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
}

export default Instance