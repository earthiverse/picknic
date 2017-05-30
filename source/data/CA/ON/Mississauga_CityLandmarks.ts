import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase(); });
};

import { Picnic } from '../../../models/Picnic';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "City of Mississauga Open Data Catalogue"
let dataset_name = "City Landmarks"
let dataset_url_human = "http://data.mississauga.ca/datasets/0ef6b00cb09546caa8e9325787916a9a_0"
let dataset_url_csv = "http://data.mississauga.ca/datasets/0ef6b00cb09546caa8e9325787916a9a_0.csv"
let license_name = "City of Mississauga Open Data Terms of Use"
let license_url = "http://www5.mississauga.ca/research_catalogue/CityofMississauga_TermsofUse.pdf"

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
    for (let i = 1; data[i]; i++) {
      if (data[i]["LANDMARKTY"] != "PICAR") {
        continue;
      }
      let lat = parseFloat(data[i]["Y"]);
      let lng = parseFloat(data[i]["X"]);

      // Comments based on additional data
      let comment: string = capitalize(data[i]["LANDMARKNA"]);

      // Insert or Update Table
      j += 1;
      Picnic.findOneAndUpdate({
        "geometry.type": "Point",
        "geometry.coordinates": [lng, lat]
      }, {
          $set: {
            "type": "Feature",
            "properties.type": "site",
            "properties.source.retrieved": retrieved,
            "properties.source.name": source_name,
            "properties.source.dataset": dataset_name,
            "properties.source.url": dataset_url_human,
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
    }
  });
});
