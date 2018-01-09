import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "dataACT"
let dataset_name = "Public Furniture in the ACT"
let dataset_url_human = "https://www.data.act.gov.au/Infrastructure-and-Utilities/Public-Furniture-in-the-ACT/ch39-bukk"
let dataset_url_csv = "https://www.data.act.gov.au/api/views/ch39-bukk/rows.csv?accessType=DOWNLOAD"
let license_name = "Creative Commons Attribution 3.0 Australia"
let license_url = "creativecommons.org/licenses/by/3.0/au/deed.en"

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
      // Location is in the following format: (Latitude, Longitude)
      let lat: number = parseFloat(data[i]["LATITUDE"]);
      let lng: number = parseFloat(data[i]["LONGITUDE"]);

      let assetID = data[i]["ASSET ID"];
      let type: string = data[i]["FEATURE TYPE"];

      if (type == "TABLE") {

        // Insert or Update Table
        j += 1;
        Picnic.findOneAndUpdate({
          "properties.source.url": dataset_url_human,
          "properties.source.id": assetID
        }, {
            $set: {
              "type": "Feature",
              "properties.type": "table",
              "properties.source.retrieved": retrieved,
              "properties.source.name": source_name,
              "properties.source.dataset": dataset_name,
              "properties.source.url": dataset_url_human,
              "properties.source.id": assetID,
              "properties.license.name": license_name,
              "properties.license.url": license_url,
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