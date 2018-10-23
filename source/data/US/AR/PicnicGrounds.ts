// NOTES:
// * AHTD = Arkansas Highways and Transportation Department
// * There are no object IDs in this dataset.

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Arkansas GIS Office";
const dsName = "Picnic Grounds AHTD";
const humanURL = "https://hub.arcgis.com/datasets/AGIO::picnic-grounds-ahtd";
const dsURL = "https://gis.arkansas.gov/arcgis/rest/services/FEATURESERVICES/Structure/FeatureServer/32/query?where=1%3D1&returnGeometry=true&f=geojson";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

Download.parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res.features) {
    const coordinates: number[] = data.geometry.coordinates[0];

    await Picnic.updateOne({
      "geometry.coordinates": coordinates,
      "properties.source.dataset": dsName,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": humanURL,
          "properties.type": "site",
          "type": "Feature",
        },
      }, {
        upsert: true,
      }).exec();
    numOps += 1;
  }

  // Remove old tables from this data source
  await Picnic.deleteMany({
    "properties.source.dataset": dsName,
    "properties.source.name": sourceName,
    "properties.source.retrieved": { $lt: retrieved },
  }).lean().exec();
  numOps += 1;

  return numOps;
});
