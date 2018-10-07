import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "City of Sioux Falls";
const dsName = "Park Amenities (Points)";
const humanURL = "https://opendata.arcgis.com/datasets/acd11d56a9394f2889a39e1504c8e088_3";
const dsURL = "https://opendata.arcgis.com/datasets/acd11d56a9394f2889a39e1504c8e088_3.csv";
const licenseName = "Attribution 4.0 International (CC BY 4.0) ";
const licenseURL = "https://creativecommons.org/licenses/by/4.0/";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const type = data.AmenityType;
    if (type !== "PICNIC SHELTER") { // I can't see any data in this dataset for unsheltered picnic tables...
      continue;
    }
    const sheltered = true;

    const lat: number = parseFloat(data.Y);
    const lng: number = parseFloat(data.X);

    const objectID = data.OBJECTID;

    let comment: string = Download.capitalize(data.Information);
    if (comment === "") {
      comment = undefined;
    }

    await Picnic.updateOne({
      "geometry.coordinates": [lng, lat],
      "properties.source.dataset": dsName,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.sheltered": sheltered,
          "properties.source.dataset": dsName,
          "properties.source.id": objectID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": humanURL,
          "properties.type": "table",
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
