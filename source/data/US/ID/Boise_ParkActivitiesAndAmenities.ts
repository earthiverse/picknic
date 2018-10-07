import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "City of Boise";
const dsName = "Park Activities and Amenities";
const humanURL = "http://opendata.cityofboise.org/datasets/7533d78ac95c45f88dba9b7d85e1c75c_0";
const dsURL = "http://opendata.cityofboise.org/datasets/7533d78ac95c45f88dba9b7d85e1c75c_0.csv";
// TODO: Find out
const licenseName = "No Warranty";
const licenseURL = "";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const description: string = data.DescriptionText;
    if (description.search(/picnic/i) === -1) {
      continue;
    }
    const lat: number = parseFloat(data.Y);
    const lng: number = parseFloat(data.X);

    const objectID = data.ID;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": description,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objectID,
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
