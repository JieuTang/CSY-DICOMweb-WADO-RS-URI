import _ from "lodash";
import fetch from 'node-fetch';
import Series from "./Series.js";

class Study {
    constructor(serverURL, queryMode, uid) {
        this.uid = uid;
        
        this.parameter = {
            "{s}": serverURL,
            "{study}": uid
        };

        this.queryMode = queryMode;

        this.url = {
            "rs": {
                "entire": "{s}/studies/{study}",
                "rendered": "{s}/studies/{study}/rendered",
                "metadata": "{s}/studies/{study}/series"
            },
            "uri": {
                "entire": "{s}/wado?requestType=WADO/&studyUID={study}",
                "metadata": "{s}/studies/{study}/series"
            }
        };

        this.isUseToken = false;
        this.tokenObject = null;

        this.metadata = null;

        this.codeOfSeriesInstanceUID = "0020000E";

        this.Series = null;
    }

    async querySeries() {
        await this._init();
        this.metadata = await this._getMetadata(_.get(_.get(this.url, this.queryMode), "metadata"));
        this.Series = await this._getSeries();
    }

    async renderAllSeries() {
        if (_.isNull(this.Series)) {
            await this.querySeries();
        }

        for (let i = 0; i < _.toArray(this.Series).length; i++) {
            let singleSeries = _.get(this.Series, i);
            await this.renderSpecificSeries(singleSeries.uid);
        }
    }

    async renderSpecificSeries(seriesInstanceUID) {
        if (_.isNull(this.Series)) {
            await this.querySeries();
        }

        let seriesUidValueSet = [];
        _.forEach(this.Series, (singleSeries) => {
            seriesUidValueSet.push(_.get(singleSeries, "uid"));
        });

        if ( !(_.includes(seriesUidValueSet, seriesInstanceUID)) ) {
            throw `此 seriesInstanceUID: ${seriesInstanceUID} 不存在於此 StudyInstanceUID 之中。`;
        }

        for (let i = 0; i < _.toArray(this.Series).length; i++) {
            let singleSeries = _.get(this.Series, i);
            if (_.isEqual(singleSeries.uid, seriesInstanceUID)) {
                let tempObject = await this._getSpecificSeries(seriesInstanceUID);
                _.set(this.Series, i, tempObject);
            }
        }
    }

    async _getSpecificSeries(seriesInstanceUID) {
        let result = undefined;

        for (let i = 0; i < _.toArray(this.Series).length; i++) {
            let singleSeries = _.get(this.Series, i);
            if (_.isEqual(singleSeries.uid, seriesInstanceUID)) {
                let tempObject = new Series(singleSeries.parameter, singleSeries.queryMode, singleSeries.uid);
                let isRenderInstances = true;
                await tempObject.init(isRenderInstances);
                result = tempObject;
            }
        }

        return result;
    }

    async _init() {
        await this._validateQueryMode();
        await this._replaceUrlParameter();
    }

    async _getSeries() {
        let result = [];

        for (let i = 0; i < _.toArray(this.metadata).length; i++) {
            let singleSeriesMetadata = _.get(this.metadata, i);
            
            let tempObject = undefined;

            if (_.has(singleSeriesMetadata, this.codeOfSeriesInstanceUID)) {
                tempObject = new Series(this.parameter, this.queryMode, _.first(_.get(_.get(singleSeriesMetadata, this.codeOfSeriesInstanceUID), "Value")));
                await tempObject.init();
            } else {
                tempObject = `這個 Series 沒有 ${this.codeOfSeriesInstanceUID}`;
            }

            result.push(_.cloneDeep(JSON.parse(JSON.stringify(tempObject))));  
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

export default Study