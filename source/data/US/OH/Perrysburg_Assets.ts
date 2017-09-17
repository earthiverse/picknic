import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "City of Perrysburg Open Data"
let dataset_name = "Park Amenities"
let dataset_url_human = "http://data.pburg.opendata.arcgis.com/datasets/3d438bf93d814588892d6192ebcaa800_0"
let dataset_url_csv = "http://data.pburg.opendata.arcgis.com/datasets/3d438bf93d814588892d6192ebcaa800_0.csv"
let license_name = "Creative Commons Attribution 3.0 United States"
let license_url = "https://creativecommons.org/licenses/by/3.0/us/"

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
      let lng: number = parseFloat(data[i]["X"]);
      let lat: number = parseFloat(data[i]["Y"]);

      let feature: string = data[i]["FEATURE"];
      if (feature == "Picnic_Table") {
        let sheltered: boolean;
        if (data[i]["COMMENTS"].trim() == "Covered") {
          sheltered = true;
        } else {
          sheltered = undefined;
        }
        let objectID = data[i]["OBJECTID"];

        // Insert or Update Table
        j += 1;
        Picnic.findOneAndUpdate({
          "geometry.type": "Point",
          "properties.source.id": objectID
        }, {
            $set: {
              "type": "Feature",
              "properties.type": "table",
              "properties.source.retrieved": retrieved,
              "properties.source.name": source_name,
              "properties.source.dataset": dataset_name,
              "properties.source.url": dataset_url_human,
              "properties.source.id": objectID,
              "properties.license.name": license_name,
              "properties.license.url": license_url,
              "properties.sheltered": sheltered,
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
    }
  });
});
