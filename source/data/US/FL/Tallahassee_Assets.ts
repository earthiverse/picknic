// NOTES:
// * This dataset's data isn't the cleanest. It groups some tables together, and not others.
// * Some of the locations that I manually cross-checked with Google Maps were quite a bit off.

import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Talgov City Infrastructure";
const dsName = "Park Amenities";
const humanURL = "http://talgov.tlcgis.opendata.arcgis.com/datasets/5bff3a7ad4d14f3a92b2e0eeb3ca0c90_2";
const dsURL = "http://talgov.tlcgis.opendata.arcgis.com/datasets/5bff3a7ad4d14f3a92b2e0eeb3ca0c90_2.csv";
const licenseName = "Creative Commons Attribution 3.0 United States";
const licenseURL = "https://creativecommons.org/licenses/by/3.0/us/";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const assetType: string = data.TYPE;
    if (assetType !== "Picnic Table" && assetType !== "Picnic Shelter") {
      continue;
    }
    const lng: number = parseFloat(data.X);
    const lat: number = parseFloat(data.Y);
    if (!lng || !lat) {
      continue;
    }

    let sheltered: boolean;
    if (assetType === "Picnic Shelter") {
      sheltered = true;
    }
    const objectID = data.GLOBALID;

    let comments: string;
    if (data.NOTES.trim()) {
      comments = "Notes from dataset: \"" + data.NOTES.trim() + "\". ";
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comments,
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
