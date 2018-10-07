import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../models/Picnic";
import Download = require("../Download");

// Important Fields
const sourceName = "Forestry Commission Open Data";
const dsName = "National Forest Estate Recreation Points GB 2016";
const humanURL = "https://opendata.arcgis.com/datasets/f680a7a646d345b597e597b9eb03be61_0";
const dsURL = "https://opendata.arcgis.com/datasets/f680a7a646d345b597e597b9eb03be61_0.csv";
const licenseName = "Open Government Licence 3.0";
const licenseURL = "http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    // Skip any assets that aren't picnic tables
    if (data.AssetType !== "Picnic Table") {
      continue;
    }
    const lat = parseFloat(data.Y);
    const lng = parseFloat(data.X);

    const objectID = data.OBJECTID;

    let comment: string;
    // This data isn't really an asset name all the time, sometimes it's a comment...
    const assetName: string = data.ASSET_NAME;
    if (assetName) {
      comment = assetName;
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
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
