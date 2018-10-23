import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "National Park Service";
const dsName = "Zion National Park - Picnic Tables";
const humanURL = "https://opendata.arcgis.com/datasets/b89ef7a7f234491a995dbaefb9f160ac_0";
const dsURL = "https://opendata.arcgis.com/datasets/b89ef7a7f234491a995dbaefb9f160ac_0.csv";
const licenseName = "Unspecified (Public Domain?)";
const licenseURL = "https://en.wikipedia.org/wiki/Public_domain";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const lat = parseFloat(data.Y);
    const lng = parseFloat(data.X);

    const comment: string = data.Location.trim() + " - " + data.Description;
    const globalID: string = data.GlobalID;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": globalID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
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
