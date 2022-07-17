# CSY-DICOMweb-WADO-RS-URI
This private repository generates the URL and requests to PACS for DICOMweb WADO-RS/URI.

## DICOM WADO
### DICOMweb WADO-RS
> https://www.dicomstandard.org/using/dicomweb/retrieve-wado-rs-and-wado-uri/
> https://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_10.4.html
DICOM PS3.18 2022b => 10.4 Retrieve Transaction

### DICOMweb WADO-URI
> https://dicom.nema.org/medical/dicom/current/output/chtml/part18/chapter_9.html
DICOM PS3.18 2022b => 9 URI Service


# How to use
```javascript
//引入套件
import WADO from "csy-dicomweb-wado-rs-uri";

//實體化
let wado = new WADO();

//查詢模式設定：rs、uri
wado.queryMode = "rs";

//查詢階層設定：studies、series、instances
// wado.queryLevel = "studies";
//有使用到的套件參數設定：url-parse package
wado.hostname = "test.dicom.tw";
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

//只查詢到 Series
await wado.querySeriesByStudy();

//查詢 Series 底下所有的 Instance 還有底下所有的 Frame
await wado.queryInstanceBySeries();



```