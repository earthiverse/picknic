// NOTES:
// * This dataset has no ID field identifying individual picnic tables (as of 2018-05-14)

import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
export const sourceName = "Edmonton Open Data Portal";
export const datasetName = "Public Picnic Table Locations";
const datasetHumanURL = "https://data.edmonton.ca/Facilities-and-Structures/Public-Picnic-Table-Locations/vk3s-q842";
const datasetURL = "https://data.edmonton.ca/api/views/vk3s-q842/rows.csv?accessType=DOWNLOAD";
const licenseName = "City of Edmonton Open Data Terms of Use (Version 2.1)";
const licenseURL = "http://www.edmonton.ca/city_government/documents/Web-version2.1-OpenDataAgreement.pdf";

export async function parse(res: string) {
  let numOps = 0;
  const retrieved = new Date();

  const csv = CSVParse(res, { columns: true, ltrim: true });
  for (const data of csv) {
    const lat = parseFloat(data.Latitude);
    const lng = parseFloat(data.Longitude);

    const type = data["Table Type"].toLowerCase();
    const surface = data["Surface Material"].toLowerCase();
    const structural = data["Structural Material"].toLowerCase();
    let comment: string;
    if (type === "other table") {
      comment = "A table";
    } else {
      comment = "A " + type;
    }
    comment += " made from " + structural;
    if (surface !== structural) {
      comment += " and " + surface;
    }
    comment += " materials.";

    await Picnic.updateOne({
      "geometry.coordinates": [lng, lat],
      "properties.source.dataset": datasetName,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": datasetName,
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
}
export async function run() {
  return await Download.parseDataString(datasetName, datasetURL, parse);
}

if (require.main === module) {
  run();
}
