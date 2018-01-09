import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Lethbridge Open Data"
let dataset_name = "Picnic Tables"
let dataset_url_human = "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0"
let dataset_url_csv = "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0.csv"
let license_name = "City of Lethbridge​ - Open Data License (Version 1.0)"
let license_url = "http://www.lethbridge.ca/Pages/OpenDataLicense.aspx"

// Download & Parse!
let retrieved = new Date();
let j = 0;
let success = 0;
let fail = 0;
console.log("Downloading...");
Request(dataset_url_csv, function (error: boolean, response: any, body: string) {
  console.log("Parsing & Updating Database...");
  CSVParse(body, { columns: true }, function (error: any, data: any) {

    // Data
    for (let i = 0; data[i]; i++) {
      let lat: Number = parseFloat(data[i]["Y"]);
      let lng: Number = parseFloat(data[i]["X"]);

      // Comments based on additional data
      let material: string = data[i]["Material"].toLowerCase();
      let concrete_pad: boolean = data[i]["Concrete_Pad"] == "Yes";
      let wheelchair: boolean = data[i]["Wheelchair"] == "Yes";
      let plaque: boolean = data[i]["Plaque"] == "Yes";
      let old_comment: string = data[i]["Comment"];
      let comment: string = "A table made from " + material + ".";
      if (concrete_pad) {
        comment += " Has a concrete pad.";
      }
      if (plaque) {
        comment += " Has a plaque."
      }
      if (old_comment) {
        comment += " The dataset which this table was obtained from has the following comment: \"" + old_comment + "\"";
      }

      // Insert or Update Table
      j++;
      Picnic.findOneAndUpdate({
        "geometry.type": "Point",
        "geometry.coordinates": [lng, lat]
      }, {
          $set: {
            "type": "Feature",
            "properties.type": "table",
            "properties.source.retrieved": retrieved,
            "properties.source.name": source_name,
            "properties.source.dataset": dataset_name,
            "properties.source.url": dataset_url_human,
            "properties.license.name": license_name,
            "properties.license.url": license_url,
            "properties.accessible": wheelchair,
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
    }
  });
});
