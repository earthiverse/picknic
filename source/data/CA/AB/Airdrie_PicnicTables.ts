// NOTES:
// * This dataset has a sketchy ID field identifying individual picnic tables (as of 2018-05-18)

import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "City of Airdrie";
const dsName = "Airdrie Picnictables";
const humanURL = "http://data-airdrie.opendata.arcgis.com/datasets/airdrie-picnictables";
const dsURL = "https://opendata.arcgis.com/datasets/b07ce15756884cfdab2537d5d9b92eb4_0.csv";
const licenseName = "Open Data Licence - City of Airdrie (Version 1.0)";
const licenseURL = "http://data-airdrie.opendata.arcgis.com/pages/our-open-licence";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const color: string = data.COLOUR.trim().toLowerCase();
    const manufacturer: string = data.MANUFACTUR.trim().toLowerCase();
    let material: string = data.MATERIAL.trim().toLowerCase();
    // TODO: NOTE: This FID doesn't look meaninful, so it might break in the future. :(
    const assetID: string = data.FID;

    let comment: string;
    if (color) {
      comment = "A " + color.toLowerCase() + " table";
    } else {
      comment = "A table";
    }
    if (material) {
      if (material === "wooden") {
        material = "wood";
      }
      comment += " made from " + material.toLowerCase;
    }
    if (manufacturer) {
      comment += " manufactured by " + manufacturer.toLowerCase;
    }
    comment += ".";

    const lat: number = parseFloat(data.Y);
    const lng: number = parseFloat(data.X);

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": assetID, // This ID is sketchy, as there are 140 tables, and the IDs are 1 to 140...
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": assetID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": humanURL,
          "properties.type": "table",
          "type": "Feature",
        },
      }, {
        upsert: true,
      }).lean().exec();
    numOps += 1;
  }

  // Remove old tables from this data source
  await Picnic.deleteMany({
    "properties.source.dataset": dsName,
    "properties.source.name": sourceName,
    "properties.source.retrieved": { $lt: retrieved },
  }).lean().exec();
  numOps += 1;

  return Promise.resolve(numOps);
});
