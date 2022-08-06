import _ from "lodash";
import axios, { AxiosRequestHeaders } from "axios";
import Series from "./Series";
import { StudyParameterType } from "./type/parameterType/StudyParameterType";

class Study {
  uid: string;
  parameter: StudyParameterType;
  queryMode: string;
  url?: object;

  isUseToken?: boolean = false;
  tokenObject?: object;

  metadata?: object;
  codeOfSeriesInstanceUID: string;
  Series?: Series[];

  constructor(serverURL: string, queryMode: string, uid: string) {
    this.uid = uid;

    this.parameter = {
      "{s}": serverURL,
      "{study}": uid,
    };

    this.queryMode = queryMode;

    this.url = {
      rs: {
        entire: "{s}/studies/{study}",
        rendered: "{s}/studies/{study}/rendered",
        metadata: "{s}/studies/{study}/series",
      },
      uri: {
        entire: "{s}/wado?requestType=WADO/&studyUID={study}",
        metadata: "{s}/studies/{study}/series",
      },
    };

    this.codeOfSeriesInstanceUID = "0020000E";
  }

  async querySeries() {
    await this._init();
    this.metadata = await this._getMetadata(
      _.get(_.get(this.url, this.queryMode), "metadata")
    );
    this.Series = await this._getSeries();
  }

  async renderAllSeries() {
    if (_.isUndefined(this.Series)) {
      await this.querySeries();
    }

    for (let i = 0; i < _.toArray(this.Series).length; i++) {
      const singleSeries: Series = _.get(this.Series, i) as Series;
      await this.renderSpecificSeries(singleSeries.uid);
    }
  }

  async renderSpecificSeries(seriesInstanceUID: string) {
    if (_.isUndefined(this.Series)) {
      await this.querySeries();
    }

    const seriesUidValueSet: string[] = [];
    if (!_.isUndefined(this.Series)) {
      _.forEach(this.Series, (singleSeries) => {
        seriesUidValueSet.push((singleSeries as Series).uid);
      });
    }

    if (!_.includes(seriesUidValueSet, seriesInstanceUID)) {
      console.log(
        `此 seriesInstanceUID: ${seriesInstanceUID} 不存在於此 StudyInstanceUID 之中。`
      );
    }

    for (let i = 0; i < _.toArray(this.Series).length; i++) {
      const singleSeries: Series = _.get(this.Series, i) as Series;
      if (_.isEqual(singleSeries.uid, seriesInstanceUID)) {
        const tempObject = await this._getSpecificSeries(seriesInstanceUID);
        _.set(this.Series as object, i, tempObject);
      }
    }
  }

  async _getSpecificSeries(seriesInstanceUID: string) {
    let result;

    for (let i = 0; i < _.toArray(this.Series).length; i++) {
      const singleSeries: Series = _.get(this.Series, i) as Series;
      if (_.isEqual(singleSeries.uid, seriesInstanceUID)) {
        const tempObject = new Series(
          singleSeries.parameter,
          singleSeries.queryMode,
          singleSeries.uid
        );
        const isRenderInstances = true;
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

  async _getSeries(): Promise<Series[]> {
    const result: Series[] = [];

    for (let i = 0; i < _.toArray(this.metadata).length; i++) {
      const singleSeriesMetadata = _.get(this.metadata, i);

      if (_.has(singleSeriesMetadata, this.codeOfSeriesInstanceUID)) {
        const tempObject = new Series(
          this.parameter,
          this.queryMode,
          _.toString(
            _.first(
              _.get(
                _.get(singleSeriesMetadata, this.codeOfSeriesInstanceUID),
                "Value"
              )
            )
          )
        );
        await tempObject.init();
        result.push(_.cloneDeep(JSON.parse(JSON.stringify(tempObject))));
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

export default Study;
