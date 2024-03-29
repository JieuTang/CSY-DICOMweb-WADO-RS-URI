export default {
  Description: {
    "{s}": "ServerURL",
    "{study}": "StudyInstanceUID",
    "{series}": "SeriesInstanceUID",
    "{instance}": "SOPInstanceUID",
    "{frames}": "NumberOfFrames",
  },
  Study: {
    EntireURL: "{s}/wado?requestType=WADO/&studyUID={study}",
    MetadataURL: "{s}/studies/{study}/series",
  },
  Series: {
    EntireURL: "{s}/wado?requestType=WADO/&studyUID={study}&seriesUID={series}",
    MetadataURL: "{s}/studies/{study}/series/{series}/metadata",
  },
  Instance: {
    EntireURL:
      "{s}/wado?requestType=WADO/&studyUID={study}&seriesUID={series}&objectUID={instance}",
    MetadataURL:
      "{s}/studies/{study}/series/{series}/instances/{instance}/metadata",
  },
  Frame: {
    RenderedURL:
      "{s}/wado?requestType=WADO/&studyUID={study}&seriesUID={series}&objectUID={instance}&frameNumber={frames}&contentType=image/jpeg",
  },
};
