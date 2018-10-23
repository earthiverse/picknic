// NOTE:
// * This dataset only contains picnic shelters.

import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "City of Gold Coast Open Data Portal";
const dsName = "Parks Sheleters";
const humanURL = "https://data-goldcoast.opendata.arcgis.com/datasets/d0cbb642baf74f74b7ed2f3b4a1c3e12_0";
const dsURL = "https://data-goldcoast.opendata.arcgis.com/datasets/d0cbb642baf74f74b7ed2f3b4a1c3e12_0.csv";
const licenseName = "Creative Commons Attribution 3.0";
const licenseURL = "https://creativecommons.org/licenses/by/3.0/";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const picnic: string = data.PICNIC_SHELTER_SUB_TYPE;
    if (!picnic.startsWith("Picnic")) {
      // Not a picnic shelter.
      continue;
    }

    const lng: number = data.X;
    const lat: number = data.Y;

    const objectID = data.OBJECTID;

    // Picnic contains a simple descriptor of the size of the picnic area.
    const comment = picnic;

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
          "properties.sheltered": true,
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
