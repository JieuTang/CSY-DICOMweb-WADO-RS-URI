import QIDO from "./DICOMwebQIDORS.js";

let qido = new QIDO();

(async function () {
    
    await qido.init();
    
    qido.queryMode = "studies";
    qido.hostname = "test.dicom.tw";
    qido.pathname = "/dicomWeb";
    qido.protocol = "http";
    qido.port = "999";

    let tempQueryParameter = {};

    tempQueryParameter.PatientID = '*';
    tempQueryParameter.limit = "10";
    tempQueryParameter.offset = "0";

    qido.queryParameter = tempQueryParameter;

    // let myHeaders = {};

    // myHeaders.token = "jf903j2vunf9843nvyf934qc";
    // await qido.setUseToken(myHeaders);

    await qido.query();
    console.log(qido.response);
})();



