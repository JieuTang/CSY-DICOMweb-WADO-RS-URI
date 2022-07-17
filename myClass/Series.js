import _ from "lodash";
import fetch from 'node-fetch';
import Instance from "./Instance.js"

class Series {
    constructor(parameter, queryMode, uid) {
        this.uid = uid;

        this.parameter = _.assign(parameter, { "{series}": uid });

        this.queryMode = queryMode;

        this.url = {
            "rs": {
                "entire": "{s}/studies/{study}/series/{series}",
                "rendered": "{s}/studies/{study}/series/{series}/rendered",
                "metadata": "{s}/studies/{study}/series/{series}/metadata"
            },
            "uri": {
                "entire": "{s}/wado?requestType=WADO/&studyUID={study}&seriesUID={series}",
                "metadata": "{s}/studies/{study}/series/{series}/metadata"
            }
        };
        
        this.isUseToken = false;
        this.tokenObject = null;

        this.metadata = null;

        this.codeOfSOPInstanceUID = "00080018";

        this.Instances = null;
    }

    async init(isRenderInstances = false) {
        await this._validateQueryMode();
        await this._replaceUrlParameter();
        this.metadata = await this._getMetadata(_.get(_.get(this.url, this.queryMode), "metadata"));
        if (isRenderInstances) this.Instances = await this._getInstances();
    }

    async _getInstances() {
        let result = [];

        for (let i = 0; i < _.toArray(this.metadata).length; i++) {
            let instanceMetadata = _.get(this.metadata, i);

            let tempObject = undefined;

            if (_.has(instanceMetadata, this.codeOfSOPInstanceUID)) {
                tempObject = new Instance(this.parameter, this.queryMode, _.first(_.get(_.get(instanceMetadata, this.codeOfSOPInstanceUID), "Value")));
                await tempObject.init();
            } else {
                tempObject = `這個 Instance 沒有 ${this.codeOfSeriesInstanceUID}`;
            }
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

export default Series