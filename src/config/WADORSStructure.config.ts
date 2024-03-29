export default {
  Description: {
    "{s}": "ServerURL",
    "{study}": "StudyInstanceUID",
    "{series}": "SeriesInstanceUID",
    "{instance}": "SOPInstanceUID",
    "{frames}": "NumberOfFrames",
  },
  Study: {
    EntireURL: "{s}/studies/{study}",
    RenderedURL: "{s}/studies/{study}/rendered",
    MetadataURL: "{s}/studies/{study}/series",
  },
  Series: {
    EntireURL: "{s}/studies/{study}/series/{series}",
    RenderedURL: "{s}/studies/{study}/series/{series}/rendered",
    MetadataURL: "{s}/studies/{study}/series/{series}/metadata",
  },
  Instance: {
    EntireURL: "{s}/studies/{study}/series/{series}/instances/{instance}",
    RenderedURL:
      "{s}/studies/{study}/series/{series}/instances/{instance}/rendered",
    MetadataURL:
      "{s}/studies/{study}/series/{series}/instances/{instance}/metadata",
  },
  Frame: {
    RenderedURL:
      "{s}/studies/{study}/series/{series}/instances/{instance}/frames/{frames}/rendered",
  },
};
