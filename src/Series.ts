import _ from "lodash";
import axios, { AxiosRequestHeaders } from "axios";
import Instance from "./Instance";

import { StudyParameterType } from "./type/parameterType/StudyParameterType";
import { SeriesParameterType } from "./type/parameterType/SeriesParameterType";

import { SeriesUrlType } from "./type/urlType/SeriesUrlType";

class Series {
  uid: string = "";
  parameter: SeriesParameterType;
  queryMode: string = "";
  url: SeriesUrlType;

  isUseToken: boolean = false;
  tokenObject?: object;

  metadata?: object[];
  codeOfSOPInstanceUID: string = "";
  Instances?: Instance[];

  constructor(parameter: StudyParameterType, queryMode: string, uid: string) {
    this.uid = uid;

    this.parameter = _.assign(parameter, { "{series}": uid });

    this.queryMode = queryMode;

    this.url = {
      rs: {
        entire: "{s}/studies/{study}/series/{series}",
        rendered: "{s}/studies/{study}/series/{series}/rendered",
        metadata: "{s}/studies/{study}/series/{series}/metadata",
      },
      uri: {
        entire:
          "{s}/wado?requestType=WADO/&studyUID={study}&seriesUID={series}",
        metadata: "{s}/studies/{study}/series/{series}/metadata",
      },
    };

    this.codeOfSOPInstanceUID = "00080018";
  }

  async init(
    isRenderInstances = false,
    isUseToken: boolean,
    tokenObject?: object
  ) {
    this.isUseToken = isUseToken;
    this.tokenObject = tokenObject;

    await this._validateQueryMode();
    await this._replaceUrlParameter();
    this.metadata = await this._getMetadata(
      _.get(_.get(this.url, this.queryMode), "metadata")
    );
    if (isRenderInstances) this.Instances = await this._getInstances();
  }

  async _getInstances(): Promise<Instance[]> {
    const result: Instance[] = [];

    for (let i = 0; i < _.toArray(this.metadata).length; i++) {
      const instanceMetadata = _.get(this.metadata, i);

      if (_.has(instanceMetadata, this.codeOfSOPInstanceUID)) {
        const tempObject = new Instance(
          this.parameter,
          this.queryMode,
          _.toString(
            _.first(
              _.get(_.get(instanceMetadata, this.codeOfSOPInstanceUID), "Value")
            )
          )
        );
        await tempObject.init(this.isUseToken, this.tokenObject);
        result.push(tempObject);
      }
    }
    return result;
  }

  async _validateQueryMode() {
    const queryModeValueSet = _.keys(this.url);
    if (!_.includes(queryModeValueSet, this.queryMode)) {
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
        headers: this.tokenObject as AxiosRequestHeaders,
      })
        .then((res) => {
          response = _.cloneDeep(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      await axios({
        method: "get",
        url: inputUrl,
      })
        .then((res) => {
          response = _.cloneDeep(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
    }

    result = _.cloneDeep(response);

    return result;
  }
}

export default Series;
