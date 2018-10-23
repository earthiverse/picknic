// NOTES:
// * This dataset has an object id field, but it has IDs from 1 to 351 for 351 tables, so it's probably not useful.

import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "City of Corona Open Data";
const dsName = "Park Picnic Tables";
const humanURL = "https://gis-cityofcorona.opendata.arcgis.com/datasets/park-picnic-tables";
const dsURL = "https://opendata.arcgis.com/datasets/ff7a42aa04b54542b0249678556891c8_3.csv";
// TODO: Find out
const licenseName = "Unknown";
const licenseURL = "";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const lng: number = parseFloat(data.X);
    const lat: number = parseFloat(data.Y);

    let sheltered: boolean;
    if (data.SHELTER === "NO") {
      sheltered = false;
    } else if (data.SHELTER.trim()) {
      sheltered = true;
    }

    const information: string = data.Comments.trim();
    if (information.includes("MISSING")) {
      continue;
    }
    let adaSeating: boolean;
    if (information.includes("ADA SEATING")) {
      adaSeating = true;
    }

    let comment: string = "A ";
    const color: string = data.COLOR.trim();
    if (color) {
      comment += color.toLowerCase() + " ";
    }
    const shape: string = data.TableShape.trim();
    if (shape === "RECT") {
      comment += "rectangular ";
    } else if (shape === "CRCL") {
      comment += "circular ";
    }
    const material: string = data.TableMaterial.trim();
    if (material === "CONC") {
      comment += "concrete ";
    } else if (material === "METAL") {
      comment += "metal ";
    } else if (material === "WOOD") {
      comment += "wood ";
    }
    comment += "table ";
    const condition: string = data.Condition.trim();
    if (condition) {
      comment += "in " + condition.toLowerCase() + " condition ";
    }
    const park: string = data.PARKNAME.trim();
    if (park) {
      comment += "in " + park.toLowerCase();
    }
    comment = comment.trimRight() + ".";

    await Picnic.updateOne({
      "geometry.coordinates": [lng, lat],
      "properties.source.dataset": dsName,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.accessible": adaSeating,
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.sheltered": sheltered,
          "properties.source.dataset": dsName,
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
