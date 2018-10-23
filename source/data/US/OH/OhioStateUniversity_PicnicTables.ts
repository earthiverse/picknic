import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Ohio State University";
const dsName = "Picnic Table";
const humanURL = "https://hub.arcgis.com/datasets/09412cb07aa745578563feffc02160ab_24";
const dsURL = "https://opendata.arcgis.com/datasets/09412cb07aa745578563feffc02160ab_24.csv";
const licenseName = "CC0"; // Emailed the creator of the dataset, recieved a response "Feel free to use that data set however you would like."
const licenseURL = "https://creativecommons.org/publicdomain/zero/1.0/";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const lng: number = parseFloat(data.X);
    const lat: number = parseFloat(data.Y);

    const globalID = data.GlobalID;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": globalID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": globalID,
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
