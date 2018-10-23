// NOTES:
// * This dataset changed its data structure around December 2017. It has more data now.
import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Lethbridge Open Data";
const datasetName = "Picnic Tables";
const datasetHumanURL = "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0";
const datasetURL = "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0.csv";
const licenseName = "City of Lethbridge​ - Open Data License (Version 1.0)";
const licenseURL = "http://www.lethbridge.ca/Pages/OpenDataLicense.aspx";

Download.parseDataString(datasetName, datasetURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const lat: number = parseFloat(data.Y);
    const lng: number = parseFloat(data.X);

    const assetID: string = data.AssetID;
    const accessible: boolean = data.Accessible.startsWith("Y");
    const material: string = data.Material.toLowerCase();
    const surface: string = data.Surface.toLowerCase();
    const plaque: boolean = data.Plaque === "Yes";
    const dedication: string = data.Dedication.trim();
    const greenspaceID: string = data.Grnspc_ID;

    let comment: string = data.Comment.trim();
    if (comment) {
      comment += ".";
    }
    if (surface !== "No") {
      comment += " The table is on a surface that is " + surface.toLowerCase() + ".";
      comment.trimLeft();
    }
    if (plaque) {
      comment += " Has a plaque";
      if (dedication) {
        comment += " for " + dedication;
      }
      comment += ".";
      comment.trimLeft();
    }

    await Picnic.updateOne({
      "properties.source.dataset": datasetName,
      "properties.source.id": assetID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.accessible": accessible,
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": datasetName,
          "properties.source.id": assetID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": datasetHumanURL,
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
    "properties.source.dataset": datasetName,
    "properties.source.name": sourceName,
    "properties.source.retrieved": { $lt: retrieved },
  }).lean().exec();
  numOps += 1;

  return numOps;
});
