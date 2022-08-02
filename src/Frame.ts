import _ from "lodash";

class Frame {

    uid: string = "";
    parameter: object = {};
    queryMode: string = "";
    url: object = {};

    isUseToken: boolean = false;
    tokenObject: object | null = null;


    constructor(parameter: object, queryMode: string, numberOfFrame: string) {
        this.uid = numberOfFrame;

        this.parameter = _.assign(parameter, { "{frames}": numberOfFrame });

        this.queryMode = queryMode;

        this.url = {
            "rs": {
                "rendered": "{s}/studies/{study}/series/{series}/instances/{instance}/frames/{frames}/rendered"
            },
            "uri": {
                "rendered": "{s}/wado?requestType=WADO/&studyUID={study}&seriesUID={series}&objectUID={instance}&frameNumber={frames}&contentType=image/jpeg"
            }
        };

        this.isUseToken = false;
        this.tokenObject = null;
    }

    async init() {
        await this._validateQueryMode();
        await this._replaceUrlParameter();
    }













































    async _validateQueryMode() {
        const queryModeValueSet = _.keys(this.url);
        if (!(_.includes(queryModeValueSet, this.queryMode))) {
            console.log(`查詢模式必須是 ${_.toString(queryModeValueSet)}`);
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
}

export default Frame