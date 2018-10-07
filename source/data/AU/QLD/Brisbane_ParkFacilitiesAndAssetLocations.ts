import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import { capitalize, parseDataString } from "../../Download";

// Important Fields
const sourceName = "Brisbane City Council Data Directory";
const dsName = "Park Facilities and Assets Locations";
const humanURL = "https://www.data.brisbane.qld.gov.au/data/dataset/park-facilities-and-assets";
const dsURL = "https://www.data.brisbane.qld.gov.au/data/dataset/39cb83b5-111e-47fb-ae21-6b141cd16f25/resource/66b3c6ce-4731-4b19-bddd-8736e3111f7e/download/open-data---am---datasetparkfacilties.csv";
const licenseName = "Creative Commons Attribution 4.0";
const licenseURL = "https://creativecommons.org/licenses/by/4.0/";

parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const itemType = data.ITEM_TYPE;
    if (!itemType.startsWith("PICNIC") || itemType === "PICNIC SHELTER") {
      // Not a picnic table, or is a picnic shelter but not a table
      continue;
    }

    const lng: number = data.LONGITUDE;
    const lat: number = data.LATITUDE;

    const description = data.DESCRIPTION;
    const nodeName = capitalize(data.NODES_NAME);

    const objectID = data.ITEM_ID;

    let comment = nodeName + ".";
    if (description) {
      comment += " " + description + ".";
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
