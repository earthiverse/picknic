import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "City of Airdrie"
let dataset_name = "Airdrie Picnictables"
let dataset_url_human = "http://data-airdrie.opendata.arcgis.com/datasets/airdrie-picnictables"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/b07ce15756884cfdab2537d5d9b92eb4_0.csv"
let license_name = "Open Data Licence - City of Airdrie (Version 1.0)"
let license_url = "http://data-airdrie.opendata.arcgis.com/pages/our-open-licence"

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
      let color: string = data[i]["Colour"];
      if (color == "" || color == null) {
        color = undefined;
      }
      let manufacturer: string = data[i]["Manufactur"];
      if (manufacturer == "" || manufacturer == null) {
        manufacturer = undefined;
      }
      let material: string = data[i]["Material"];
      if (material == "" || material == null) {
        material = undefined;
      } else {
        material = ""
      }
      // TODO: NOTE: This FID doesn't look meaninful, so it might break in the future. :(
      let assetID: string = data[i]["FID"];

      // Comments based on additional data
      let comment: string;
      if (color) {
        comment = "A " + color.toLowerCase() + " table";
      } else {
        comment = "A table"
      }
      if (material) {
        comment += " made from " + material.toLowerCase;
      }
      if (manufacturer) {
        comment += " manufactured by " + manufacturer.toLowerCase;
      }
      comment += "."

      // Location is in the following format: (Latitude, Longitude)
      let lat: number = parseFloat(data[i]["Y"]);
      let lng: number = parseFloat(data[i]["X"]);

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