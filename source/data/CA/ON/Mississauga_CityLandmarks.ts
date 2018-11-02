import CSVParse = require("csv-parse/lib/sync");
import { Picnic } from "../../../models/Picnic";
import { capitalCase, parseDataString } from "../../Download";

// Important Fields
const sourceName = "City of Mississauga Open Data Catalogue";
const dsName = "City Landmarks";
const dsHumanURL = "http://data.mississauga.ca/datasets/0ef6b00cb09546caa8e9325787916a9a_0";
const dsURL = "http://data.mississauga.ca/datasets/0ef6b00cb09546caa8e9325787916a9a_0.csv";
const licenseName = "City of Mississauga Open Data Terms of Use";
const licenseURL = "http://www5.mississauga.ca/research_catalogue/CityofMississauga_TermsofUse.pdf";

parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    if (data.LANDMARKTY !== "PICAR") {
      continue;
    }
    const lat = parseFloat(data.Y);
    const lng = parseFloat(data.X);

    const comment: string = capitalCase(data.LANDMARKNA);

    const fid = data.FID;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": fid,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": fid,
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
