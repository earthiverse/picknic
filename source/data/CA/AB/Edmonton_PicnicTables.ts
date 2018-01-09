import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Edmonton Open Data Portal"
let dataset_name = "Public Picnic Table Locations"
let dataset_url_human = "https://data.edmonton.ca/Facilities-and-Structures/Public-Picnic-Table-Locations/vk3s-q842"
let dataset_url_csv = "https://data.edmonton.ca/api/views/vk3s-q842/rows.csv?accessType=DOWNLOAD"
let license_name = "City of Edmonton Open Data Terms of Use (Version 2.1)"
let license_url = "http://www.edmonton.ca/city_government/documents/Web-version2.1-OpenDataAgreement.pdf"

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
      let lat = parseFloat(data[i]["Latitude"]);
      let lng = parseFloat(data[i]["Longitude"]);

      // Comments based on additional data
      let type = data[i]["Table Type"].toLowerCase();
      let surface = data[i]["Surface Material"].toLowerCase();
      let structural = data[i]["Structural Material"].toLowerCase();
      let comment: string;
      if (type == "other table") {
        comment = "A table";
      } else {
        comment = "A " + type;
      }
      comment += " made from " + structural;
      if (surface != structural) {
        comment += " and " + surface;
      }
      comment += " materials.";

      // Insert or Update Table
      j += 1;
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
