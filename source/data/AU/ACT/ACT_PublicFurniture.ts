import CSVParse = require("csv-parse/lib/sync");
import { Picnic } from "../../../models/Picnic";
import { capitalCase, parseDataString } from "../../Download";

// Important Fields
const sourceName = "dataACT";
const dsName = "Public Furniture in the ACT";
const humanURL = "https://www.data.act.gov.au/Infrastructure-and-Utilities/Public-Furniture-in-the-ACT/ch39-bukk";
const dsURL = "https://www.data.act.gov.au/api/views/ch39-bukk/rows.csv?accessType=DOWNLOAD";
const licenseName = "Creative Commons Attribution 3.0 Australia";
const licenseURL = "creativecommons.org/licenses/by/3.0/au/deed.en";

parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const type: string = data["FEATURE TYPE"];
    if (type !== "TABLE") {
      continue;
    }

    const lat: number = parseFloat(data.LATITUDE);
    const lng: number = parseFloat(data.LONGITUDE);
    const assetID = data["ASSET ID"];
    const location: string = data["LOCATION NAME"].trim();
    let comment;
    if (location) {
      comment = "Located in " + capitalCase(location) + ".";
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": assetID,
      "properties.source.url": humanURL,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": assetID,
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
