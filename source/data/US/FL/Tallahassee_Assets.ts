/*
 Note: This dataset's data isn't the cleanest. It groups some tables together, and not others.
       Some of the locations that I manually cross-checked with Google Maps were quite a bit off.
*/
import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Table } from '../../../models/Table';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Talgov City Infrastructure"
let dataset_name = "Park Amenities"
let dataset_url_human = "http://talgov.tlcgis.opendata.arcgis.com/datasets/5bff3a7ad4d14f3a92b2e0eeb3ca0c90_2"
let dataset_url_csv = "http://talgov.tlcgis.opendata.arcgis.com/datasets/5bff3a7ad4d14f3a92b2e0eeb3ca0c90_2.csv"
let license_name = "Creative Commons Attribution 3.0 United States"
let license_url = "https://creativecommons.org/licenses/by/3.0/us/"

// Download & Parse!
let retrieved = new Date();
let j = 0;
let success = 0;
let fail = 0;
console.log("Downloading...");
Request(dataset_url_csv, function(error:boolean, response:any, body:string) {
  console.log("Parsing & Updating Database...");
  CSVParse(body, {columns: true}, function(error:any, data:any) {

    // Data
    for(let i = 1;data[i];i++) {
      let lng:number = parseFloat(data[i]["X"]);
      let lat:number = parseFloat(data[i]["Y"]);
      
      let assetType:string = data[i]["TYPE"];
      if(assetType == "Picnic Table" || assetType == "Picnic Shelter") {
        let sheltered:boolean;
        if(assetType == "Picnic Shelter") {
          sheltered = true;
        } else {
          sheltered = undefined;
        }
        let objectID = data[i]["GLOBALID"];

        let comments:string;
        if(data[i]["NOTES"].trim()) {
          comments = "Notes from dataset: \"" + data[i]["NOTES"].trim() + "\". ";
        }

        // Insert or Update Table
        j += 1;
        Table.findOneAndUpdate({
          "geometry.type": "Point",
          "properties.source.id": objectID
        }, { $set: {
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
          "properties.comment": comments,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat]
        }}, {
          "upsert": true
        }).exec(function(err, doc) {
          if(err) {
            console.log(err);
            fail = fail + 1;
          } else {
            success = success + 1;
          }

          // Disconnect on last update
          j -= 1;
          if(j == 0) {
            console.log(success + "/" + (success + fail) + " updated/inserted.");
            Mongoose.disconnect();
          }
        });
      }
    }
  });
});
