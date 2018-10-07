import CSVParse = require("csv-parse/lib/sync");
import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Melbourne Data";
const dsName = "Street Furniture";
const dsHumanURL = "https://data.melbourne.vic.gov.au/Assets-Infrastructure/Street-furniture-including-bollards-bicycle-rails-/8fgn-5q6t";
const dsURL = "https://data.melbourne.vic.gov.au/api/views/8fgn-5q6t/rows.csv?accessType=DOWNLOAD";
const licenseName = "Creative Commons Attribution 4.0 International Public License";
const licenseURL = "https://creativecommons.org/licenses/by/4.0/legalcode";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const type: string = data.ASSET_TYPE;
    if (type !== "Picnic Setting") {
      continue;
    }

    const match: RegExpExecArray = /([\d\.-]+),\s([\d\.-]+)/.exec(data.CoordinateLocation);
    const lat: number = parseFloat(match[1]);
    const lng: number = parseFloat(match[2]);

    const gisID = data.GIS_ID;
    const description: string = data.DESCRIPTION;
    const locationDescription: string = data.LOCATION_DESC;

    const comment = description + ". " + locationDescription;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": gisID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": gisID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": dsHumanURL,
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
