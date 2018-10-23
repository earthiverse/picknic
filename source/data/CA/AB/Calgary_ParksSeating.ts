// NOTES:
// * This dataset has no ID field identifying individual picnic tables (as of 2018-05-14)
import CSVParse = require("csv-parse/lib/sync");
import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Open Calgary";
const dsName = "Parks Seating";
const dsHumanURL = "https://data.calgary.ca/Recreation-and-Culture/Parks-Seating/ikeb-n5bc";
const dsURL = "https://data.calgary.ca/api/views/ikeb-n5bc/rows.csv?accessType=DOWNLOAD";
const licenseName = "Open Government License - City of Calgary (Version 2.1)";
const licenseURL = "https://data.calgary.ca/stories/s/Open-Calgary-Terms-of-Use/u45n-7awa";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  const csv = CSVParse(res, { columns: true, ltrim: true });
  for (const data of csv) {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    const type = data.TYPE_DESCRIPTION;
    if (type !== "PICNIC TABLE" && type !== "MEMORIAL PICNIC TABLE") {
      continue;
    }
    const active = data.LIFE_CYCLE_STATUS;
    if (active !== "ACTIVE") {
      continue;
    }
    const assetClass: string = data.ASSET_CLASS;
    const maintInfo: string = data.MAINT_INFO;
    let comment = "";
    if (assetClass.search("REMOVED") !== -1) {
      comment += " Might be missing.";
    }
    if (maintInfo.search("PORTABLE") !== -1) {
      comment += " This is a portable table, so it might be moved, or missing.";
    }

    // Fix comment before adding
    comment = comment.trimLeft();
    if (!comment) {
      comment = undefined;
    }

    await Picnic.updateOne({
      "geometry.coordinates": [lng, lat],
      "properties.source.dataset": dsName,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": dsHumanURL,
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

  return numOps;
});
