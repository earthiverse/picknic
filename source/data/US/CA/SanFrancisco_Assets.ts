import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Table } from '../../../models/Table';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "SF OpenData"
let dataset_name = "Assets Maintained by the Recreation and Parks Department"
let dataset_url_human = "https://data.sfgov.org/Culture-and-Recreation/Assets-Maintained-by-the-Recreation-and-Parks-Depa/ays8-rxxc"
let dataset_url_csv = "https://data.sfgov.org/api/views/ays8-rxxc/rows.csv?accessType=DOWNLOAD"
let license_name = "ODC Public Domain Dedication and Licence (PDDL)"
let license_url = "http://opendatacommons.org/licenses/pddl/1.0/"

// Regular Expression for Location
let regex = new RegExp(/([\d\.-]+),\s([\d\.-]+)/);

// Download & Parse!
let retrieved = new Date();
let i = 1;
let j = 0;
let success = 0;
let fail = 0;
console.log("Downloading...");
Request(dataset_url_csv, function(error:boolean, response:any, body:string) {
  console.log("Parsing & Updating Database...");
  CSVParse(body, {columns: true}, function(error:any, data:any) {

    // Data
    for(;data[i];) {
      // Location is in the following format: (Latitude, Longitude)
      let match:RegExpExecArray = regex.exec(data[i]["Geom"]);
      let lat:number = parseFloat(match[1]);
      let lng:number = parseFloat(match[2]);

      let type:string = data[i]["Asset Type"].toLowerCase();
      let asset_id = data[i]["Asset ID"];
      let subtype:string = data[i]["Asset Subtype"].toLowerCase();
      let map_label:string = data[i]["Map Label"];
      let asset_name:string = data[i]["Asset Name"];
      let quantity = data[i]["Quantity"];

      if(type == "table") {
        let comment:string;
        if(subtype == "picnic") {
          comment = "A picnic table.";
        } else if(subtype == "half table") {
          comment = "A half table.";
        } else {
          comment = "A table."
        }
        comment += " The dataset which this table was obtained from has the following information: \"Label: " + map_label + ", Asset Name: " + asset_name + ", Quantity: " + quantity + "\"."

        // Insert or Update Table
        j += 1;
        Table.findOneAndUpdate({
          "properties.source.id": asset_id
        }, { $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": asset_id,
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

      i = i + 1;
    }
  });
});
