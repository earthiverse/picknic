import XLSX = require("xlsx");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Adelaide City Council";
const dsName = "Picnic Tables";
const humanURL = "https://opendata.adelaidecitycouncil.com/PicnicTables/";
const dsURL = "https://opendata.adelaidecitycouncil.com/PicnicTables/PicnicTables.xls";
const licenseName = "Creative Commons Attribution 4.0 International Public License";
const licenseURL = "https://creativecommons.org/licenses/by/4.0/legalcode";

Download.parseDataBinary(dsName, dsURL, async (res: Uint8Array) => {
  let numOps = 0;
  const retrieved = new Date();

  const workbook = XLSX.read(res);
  for (const sheetName of workbook.SheetNames) {
    const data: any = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    for (const row of data) {
      const lat: number = parseFloat(row.POINT_Y);
      const lng: number = parseFloat(row.POINT_X);

      const type: string = row.Type;
      const uniqueAsse: string = row.UniqueAsse;

      let comment: string = "";
      if (type && type !== "Unknown") {
        comment = "Type: " + type;
      }

      await Picnic.updateOne({
        "properties.source.dataset": dsName,
        "properties.source.id": uniqueAsse,
        "properties.source.name": sourceName,
      }, {
          $set: {
            "geometry.coordinates": [lng, lat],
            "geometry.type": "Point",
            "properties.comment": comment,
            "properties.license.name": licenseName,
            "properties.license.url": licenseURL,
            "properties.source.dataset": dsName,
            "properties.source.id": uniqueAsse,
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
