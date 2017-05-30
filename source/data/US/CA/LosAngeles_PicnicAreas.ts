import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');
import striptags from 'striptags';

import { Picnic } from '../../../models/Picnic';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Los Angeles Geohub"
let dataset_name = "Picnic Areas"
let dataset_url_human = "http://geohub.lacity.org/datasets/678499fcf0b84e06ac80a37ae7cde7e3_9"
let dataset_url_csv = "http://geohub.lacity.org/datasets/678499fcf0b84e06ac80a37ae7cde7e3_9.csv"
let license_name = "Public Domain"
let license_url = "https://creativecommons.org/publicdomain/mark/1.0/"

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
      let lat = parseFloat(data[i]["latitude"]);
      let lng = parseFloat(data[i]["longitude"]);

      // Comments based on additional data
      let comment: string = data[i]["Name"].trim();
      if (data[i]["hours"].trim()) {
        comment += ". " + striptags(data[i]["hours"]).trim();
      }

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
