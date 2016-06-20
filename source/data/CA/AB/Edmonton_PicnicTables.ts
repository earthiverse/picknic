import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Table } from '../../../models/Table'

// Setup Mongoose
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Edmonton Open Data Portal"
let dataset_name = "Public Picnic Table Locations"
let dataset_url_human = "https://data.edmonton.ca/Facilities-and-Structures/Public-Picnic-Table-Locations/vk3s-q842"
let dataset_url_csv = "https://data.edmonton.ca/api/views/vk3s-q842/rows.csv?accessType=DOWNLOAD"
let license_name = "City of Edmonton Open Data Terms of Use (Version 2.1)"
let license_url = "http://www.edmonton.ca/city_government/documents/Web-version2.1-OpenDataAgreement.pdf"

// Download & Parse!
let parser = CSVParse();

let lat_c = -1;
let lng_c = -1;
let type_c = -1;
let surface_c = -1;
let structural_c = -1;

let retrieved = new Date();

let i = 0;
let success = 0;
let fail = 0;
console.log("Downloading...");
Request(dataset_url_csv, function(error:boolean, response:any, body:string) {
  console.log("Parsing & Updating Database...");  
  CSVParse(body, function(error:boolean, data:any) {
    // Columns
    lat_c = data[i].indexOf('Latitude');
    lng_c = data[i].indexOf('Longitude');
    type_c = data[i].indexOf('Table Type');
    surface_c = data[i].indexOf('Surface Material');
    structural_c = data[i].indexOf('Structural Material');

    // Data
    i = 1;
    for(;data[i];) {
      let lat = parseFloat(data[i][lat_c]);
      let lng = parseFloat(data[i][lng_c]);

      // Comments based on additional data
      let type = data[i][type_c].toLowerCase();
      let surface = data[i][surface_c].toLowerCase();
      let structural = data[i][structural_c].toLowerCase();
      let comment:string;
      if(type == "other table") {
        comment = "A table";
      } else {
        comment = "A " + type;
      }
      comment += " made from " + structural;
      if(surface != structural) {
        comment += " and " + surface;
      }
      comment += " materials.";

      // Insert or Update Table
      let table = new Table();
      
      Table.findOneAndUpdate({
        "geometry.type": "Point",
        "geometry.coordinates": [lng, lat]
      }, { $set: {
        "type": "Feature",
        "properties.source.retrieved": retrieved,
        "properties.source.name": dataset_name,
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
        i = i - 1;
        if(i == 1) {
          console.log(success + "/" + (success + fail) + " updated/inserted.");
          Mongoose.disconnect();
        }
      });

      i = i + 1;      
    }
  });
});
