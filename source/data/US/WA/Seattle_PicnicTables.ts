import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Table } from '../../../models/Table';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "data.seattle.gov"
let dataset_name = "Picnic Table"
let dataset_url_human = "https://data.seattle.gov/dataset/Picnic-Table/2kfp-z97k"
let dataset_url_csv = "https://data.seattle.gov/api/views/2kfp-z97k/rows.csv?accessType=DOWNLOAD"
let license_name = "Unspecified (Public Domain?)"
let license_url = "https://en.wikipedia.org/wiki/Public_domain"

// Regular Expression for Location
let regex = new RegExp(/([\d\.-]+)\s([\d\.-]+)/);

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
      let match:RegExpExecArray = regex.exec(data[i]["the_geom"]);
      let lng:number = parseFloat(match[1]);
      let lat:number = parseFloat(match[2]);
      let table_size = data[i]["TABLE_SIZE"];
      let table_pad = data[i]["TABLE_PAD"];

      // Comments based on additional data
      let comment:string = "";
      if(table_size) {
        comment = "Table Size (from dataset): '" + table_size + "'."
      }
      if(table_pad) {
        comment += " Table pad (from dataset): '" + table_pad + "'."
      }
      comment = comment.trim();

      // Insert or Update Table
      j += 1;
      Table.findOneAndUpdate({
        "geometry.type": "Point",
        "geometry.coordinates": [lng, lat]
      }, { $set: {
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
  });
});
