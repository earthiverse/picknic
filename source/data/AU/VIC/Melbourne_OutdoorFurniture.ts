import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Melbourne Data"
let dataset_name = "Street furniture including bollards, bicycle rails, bins, drinking fountains, horse troughs, planter boxes, seats, barbecues"
let dataset_url_human = "https://data.melbourne.vic.gov.au/Assets-Infrastructure/Street-furniture-including-bollards-bicycle-rails-/8fgn-5q6t"
let dataset_url_csv = "https://data.melbourne.vic.gov.au/api/views/8fgn-5q6t/rows.csv?accessType=DOWNLOAD"
let license_name = "Creative Commons Attribution 4.0 International Public License"
let license_url = "https://creativecommons.org/licenses/by/4.0/legalcode"

// Regular Expression for Location
let regex = new RegExp(/([\d\.-]+),\s([\d\.-]+)/);

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
      // Location is in the following format: (Latitude, Longitude)
      let match: RegExpExecArray = regex.exec(data[i]["CoordinateLocation"]);
      let lat: number = parseFloat(match[1]);
      let lng: number = parseFloat(match[2]);

      let gis_id = data[i]["GIS_ID"];
      let type: string = data[i]["ASSET_TYPE"];
      let description: string = data[i]["DESCRIPTION"];
      let location_description: string = data[i]["LOCATION_DESC"];

      if (type == "Picnic Setting") {
        let comment = description + ". " + location_description;

        // Insert or Update Table
        j += 1;
        Picnic.findOneAndUpdate({
          "properties.source.url": dataset_url_human,
          "properties.source.id": gis_id
        }, {
            $set: {
              "type": "Feature",
              "properties.type": "table",
              "properties.source.retrieved": retrieved,
              "properties.source.name": source_name,
              "properties.source.dataset": dataset_name,
              "properties.source.url": dataset_url_human,
              "properties.source.id": gis_id,
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
    }
  });
});