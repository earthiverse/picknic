import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "City of Perrysburg Open Data";
const dsName = "Park Amenities";
const humanURL = "http://data.pburg.opendata.arcgis.com/datasets/3d438bf93d814588892d6192ebcaa800_0";
const dsURL = "http://data.pburg.opendata.arcgis.com/datasets/3d438bf93d814588892d6192ebcaa800_0.csv";
const licenseName = "Creative Commons Attribution 3.0 United States";
const licenseURL = "https://creativecommons.org/licenses/by/3.0/us/";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const feature: string = data.FEATURE;
    if (feature !== "Picnic_Table") {
      continue;
    }
    const lng: number = parseFloat(data.X);
    const lat: number = parseFloat(data.Y);

    let sheltered: boolean;
    if (data.COMMENTS.trim() === "Covered") {
      sheltered = true;
    }
    const objectID = data.OBJECTID;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
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
