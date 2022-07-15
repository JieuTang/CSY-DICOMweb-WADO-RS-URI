//引入套件
import WADO from "./DICOMwebWADORSURI.js";

//實體化
let wado = new WADO();

(async function () {
    //查詢模式設定：rs、uri
    wado.queryMode = "rs";

    //查詢階層設定：studies、series、instances
    // wado.queryLevel = "studies";

    //有使用到的套件參數設定：url-parse package
    wado.hostname = "hackathon.raccoon.dicom.tw";
    wado.pathname = "/dicom-web";
    wado.protocol = "https";
    wado.port = "443";
    wado.studyInstanceUID = '1.3.46.670589.45.1.1.4993912214784.1.5436.1538560373543';

    //設定 Token:現在尚未啟用
    // let myHeaders = {};
    // myHeaders.token = "jf903j2vunf9843nvyf934qc";
    // await qido.setUseToken(myHeaders);

    //"必須"自己初始化
    await wado.init();
    console.log(wado.response);

    //取得 此 StudyInstanceUID 底下的所有 URL
    //Study : entireStudy、renderedStudy、studyMetadata
    //Series : entireSeries、renderedSeries、seriesMetadata
    //Instances : entireInstance、renderedInstance、instanceMetadata
    //Frames : renderedFrame
    
    // await wado.renderQueryUrl();
    
    // console.log(wado.descriptionParameter);

    // console.log(wado.wadoParameter);
})();



