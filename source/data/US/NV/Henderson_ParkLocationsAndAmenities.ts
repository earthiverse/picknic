import CSVParse = require("csv-parse/lib/sync");
import { Picnic } from "../../../models/Picnic";
import { capitalCase, parseDataString } from "../../Download";

// Important Fields
const sourceName = "City of Henderson GIS Data Portal";
const dsName = "Park Points";
const dsHumanURL = "https://opendata.arcgis.com/datasets/553a7c45998e4baf8c64993c665fc195_7";
const dsURL = "https://opendata.arcgis.com/datasets/553a7c45998e4baf8c64993c665fc195_7.csv";
// TODO: Find out
const licenseName = "Unknown";
const licenseURL = "";

parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    // This dataset proposes future parks, too.
    const existing: boolean = data.EXISTING === "Y";
    if (!existing) {
      continue;
    }

    let shelter: boolean;
    if (data.COV_PICNIC === "Y") {
      shelter = true;
    } else if (data.COV_PICNIC === "N") {
      shelter = false;
    }
    const picnic = data.PICNIC === "Y";
    if (!picnic && !shelter) {
      continue;
    }

    const lat: number = parseFloat(data.Y);
    const lng: number = parseFloat(data.X);

    const facility = capitalCase(data.FACILITY).trim();
    let comment = facility + ".";

    if (data.BBQUE === "Y") {
      comment = comment.trimLeft();
      comment += " Has BBQ site(s).";
    }

    if (data.OPENGRASS === "Y") {
      comment = comment.trimLeft();
      comment += " Has open grass.";
    }

    if (data.RESTROOMS === "Y") {
      comment = comment.trimLeft();
      comment += " There are washrooms nearby.";
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
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.sheltered": shelter,
          "properties.source.dataset": dsName,
          "properties.source.id": objectID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": dsHumanURL,
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
