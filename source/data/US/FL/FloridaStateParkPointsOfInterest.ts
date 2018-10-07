// NOTES:
// * 'OBJECTID' goes from 1 to #of results, so it's possibly not accurate.

import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Florida Department of Environmental Protection";
const dsName = "Florida State Park Points of Interest";
const humanURL = "https://myflorida-floridadisaster.opendata.arcgis.com/datasets/f3ae9dab9acc4fcc8c445db176178d7d_6";
const dsURL = "https://myflorida-floridadisaster.opendata.arcgis.com/datasets/f3ae9dab9acc4fcc8c445db176178d7d_6.csv";
const licenseName = "Creative Commons Attribution 3.0 United States"; // Not really the license, but close enough. Needs no warranty, and attribution.
const licenseURL = "https://creativecommons.org/licenses/by/3.0/us/";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const assetType: string = data.POI_CLASSIFICATION;
    if (assetType !== "Picnic Area" && assetType !== "Picnic Pavilion") {
      continue;
    }
    const lng: number = parseFloat(data.X);
    const lat: number = parseFloat(data.Y);

    let sheltered: boolean;
    if (assetType === "Picnic Pavilion") {
      sheltered = true;
    }
    const objectID = data.OBJECTID;

    const siteName: string = data.SITE_NAME.trim();
    const comments = "Located in " + siteName + ".";

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
