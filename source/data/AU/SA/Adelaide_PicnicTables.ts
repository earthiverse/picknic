import XLSX = require('xlsx');
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Adelaide City Council"
let dataset_name = "Picnic Tables"
let dataset_url_human = "https://opendata.adelaidecitycouncil.com/PicnicTables/"
let dataset_url_xls = "https://opendata.adelaidecitycouncil.com/PicnicTables/PicnicTables.xls"
let license_name = "Creative Commons Attribution 4.0 International Public License"
let license_url = "https://creativecommons.org/licenses/by/4.0/legalcode"

// Download & Parse!
let retrieved = new Date();
let j = 0;
let success = 0;
let fail = 0;
console.log("Downloading...");
Request({ url: dataset_url_xls, encoding: null }, function (error: boolean, response: any, body: Uint8Array) {
  let workbook = XLSX.read(body);
  let sheets = workbook.SheetNames;
  sheets.forEach(function (sheetName) {
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

      // Insert or Update Table
      j += 1;
      Picnic.findOneAndUpdate({
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
          "upsert": true
        }).exec(function (err, doc) {
          if (err) {
            console.log(err);
            fail = fail + 1;
          } else {
            success = success + 1;
          }

          // Disconnect on last update
          j -= 1;
          if (j == 0) {
            console.log(success + "/" + (success + fail) + " updated/inserted.");
            Mongoose.disconnect();
          }
        });
    });
  });
});