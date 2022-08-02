import _ from "lodash";
import axios, { AxiosRequestHeaders } from "axios";
import Frame from "./Frame";

class Instance {

    uid: string = "";
    parameter: object = {};
    queryMode: string = "";
    url: object = {};

    isUseToken: boolean = false;
    tokenObject: object | null = null;

    metadata: object | null | undefined = null;
    codeOfNumberOfFrames: string = "";
    Frames: Frame[] | null = null;


    constructor(parameter: object, queryMode: string, uid: string) {
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
        const result = [];

        const numberOfFrame = _.toInteger(_.first(_.get(_.get(this.metadata, this.codeOfNumberOfFrames), "Value")));

        for (let i = 1; i <= numberOfFrame; i++) {
            let tempObject;
            tempObject = new Frame(this.parameter, this.queryMode, i.toString());
            await tempObject.init();
            result.push(tempObject);
        }

        return result;
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

    async _getMetadata(metadataURL: string) {
        return await this._getJsonResponseFromURL(metadataURL);
    }

    async _getJsonResponseFromURL(inputUrl: string) {
        let result;
        let response;

        if (this.isUseToken) {
            await axios({
                method: "get",
                url: inputUrl,
                headers: this.tokenObject as AxiosRequestHeaders
            }).then(
                (res) => {
                    response = _.cloneDeep(res.data);
                }
            ).catch(
                (error) => {
                    console.log(error);
                }
            )
        } else {
            await axios({
                method: "get",
                url: inputUrl,
            }).then(
                (res) => {
                    response = _.cloneDeep(res.data);
                }
            ).catch(
                (error) => {
                    console.log(error);
                }
            )
        }

        result = _.cloneDeep(response);

        return result;
    }
}

export default Instance