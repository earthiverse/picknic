import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import { capitalize, parseDataString } from "../../Download";

// Important Fields
const sourceName = "Gov Data Iowa";
const dsName = "Alternative Service Locations - Picnic Areas";
const humanURL = "https://data.iowa.gov/Transportation-Utilities/Alternative-Service-Locations-Picnic-Area/7dgi-gzrf";
const dsURL = "https://data.iowa.gov/api/views/7dgi-gzrf/rows.csv?accessType=DOWNLOAD";
const licenseName = "Unknown";
const licenseURL = "";

parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const match: RegExpExecArray = /([\d\.-]+),\s([\d\.-]+)/.exec(data.Shape);
    const lat: number = parseFloat(match[1]);
    const lng: number = parseFloat(match[2]);

    const objectID = data.OBJECTID;

    let comment: string = "";

    const restrooms: string = data.Restrooms;
    if (restrooms === "Yes - Not 24 Hours") {
      comment += "Has restrooms, but they are not open 24 hours.";
    }
    const place: string = capitalize(data.Place);
    if (place) {
      comment = comment.trimLeft();
      comment += " Located in " + place + ".";
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
          "properties.type": "site",
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
