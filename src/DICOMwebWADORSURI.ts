import _ from "lodash";
import URL from "url-parse";
import Study from "./Study";
import Series from "./Series";
import Instance from "./Instance";
import Frame from "./Frame";

class DICOMwebWADORSURI {
  // Token
  isUseToken: boolean = false;
  tokenObject?: object;

  // url-parse package
  hostname: string = "";
  pathname: string = "";
  port: string = "";
  protocol: string = "";
  serverURL: string = "";
  studyInstanceUID: string = "";

  // Query Mode
  queryMode: string = "";

  // Response
  response?: Study;

  async init() {
    this.serverURL = await this._getServerURL();
  }

  async querySeries() {
    const study = new Study(
      this.serverURL,
      this.queryMode,
      this.studyInstanceUID
    );
    await study.querySeries();
    this.response = study;
  }

  async renderAllSeries() {
    const study = new Study(
      this.serverURL,
      this.queryMode,
      this.studyInstanceUID
    );
    await study.renderAllSeries();
    this.response = study;
  }

  async renderSpecificSeries(seriesInstanceUID: string) {
    const study = new Study(
      this.serverURL,
      this.queryMode,
      this.studyInstanceUID
    );
    await study.renderSpecificSeries(seriesInstanceUID);
    this.response = study;
  }

  async _getServerURL() {
    let result;

    const serverURL = new URL("");
    serverURL.set("hostname", this.hostname);
    serverURL.set("pathname", this.pathname);
    serverURL.set("port", this.port);
    serverURL.set("protocol", this.protocol);
    result = serverURL.toString();

    return result;
  }
}

export default DICOMwebWADORSURI;

export type { Study, Series, Instance, Frame };
