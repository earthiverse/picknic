import XLSX = require('xlsx');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "Adelaide City Council"
let dataset_name = "Picnic Tables"
let dataset_url_human = "https://opendata.adelaidecitycouncil.com/PicnicTables/"
let dataset_url_xls = "https://opendata.adelaidecitycouncil.com/PicnicTables/PicnicTables.xls"
let license_name = "Creative Commons Attribution 4.0 International Public License"
let license_url = "https://creativecommons.org/licenses/by/4.0/legalcode"

Download.parseDataBinary(dataset_name, dataset_url_xls, function (res: Uint8Array) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  let workbook = XLSX.read(res);
  workbook.SheetNames.forEach(function (sheetName) {
    let data: any = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    data.forEach(function (row: any) {
      let lat: number = parseFloat(row["POINT_Y"]);
      let lng: number = parseFloat(row["POINT_X"]);

      let type: string = row["Type"];
      let uniqueAsse: string = row["UniqueAsse"];

      let comment: string = "";
      if (type && type != "Unknown") {
        comment = "Type: " + type;
      }

      database_updates.push(Picnic.findOneAndUpdate({
        "properties.source.url": dataset_url_human,
        "properties.source.id": uniqueAsse
      }, {
          $set: {
            "type": "Feature",
            "properties.type": "table",
            "properties.source.retrieved": retrieved,
            "properties.source.name": source_name,
            "properties.source.dataset": dataset_name,
            "properties.source.url": dataset_url_human,
            "properties.source.id": uniqueAsse,
            "properties.license.name": license_name,
            "properties.license.url": license_url,
            "properties.comment": comment,
            "geometry.type": "Point",
            "geometry.coordinates": [lng, lat]
          }
        }, {
          "upsert": true,
          "new": true
        }).exec());
    });
  });

  return database_updates;
});