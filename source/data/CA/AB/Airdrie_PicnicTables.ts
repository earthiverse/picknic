import Mongoose = require('mongoose');
import Request = require('request');

import { Table } from '../../../models/Table';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Calgary Region Open Data"
let dataset_name = "Airdrie Picnictables.zip"
let dataset_url_human = "http://www.calgaryregionopendata.ca/browse/file/10188"
let dataset_url_geojson = "https://opener.dobt.co/dropbox/download/10189"
let license_name = "Calgary Regional Partnership Open Data Licence (Version 1.0)"
let license_url = "http://calgaryregion.ca/dam/Website/reports/General/GIS/Public-documents/Calgary-Regional-Partnership-Open-Data-Licence/Calgary%20Regional%20Partnership%20Open%20Data%20Licence.pdf"

// Download & Parse!
let retrieved = new Date();
let j = 0;
let success = 0;
let fail = 0;
console.log("Downloading...");
Request(dataset_url_geojson, function(error:boolean, response:any, body:any) {
  console.log("Parsing & Updating Database...");
  let geojson_data = JSON.parse(response.body);
  geojson_data.features.forEach(function(feature_table:any) {
    let color:string = feature_table.properties.Colour;
    let manufacturer:string = feature_table.properties.Manufactur;
    let material:string = feature_table.properties.Material;
    let coordinates:any = feature_table.geometry.coordinates;

    // Comments based on additional data
    let comment:string;
    if(color) {
      comment = "A " + color.toLowerCase() + " table";
    } else {
      comment = "A table"
    }
    if(material) {
      comment += " made from " + material.toLowerCase;
    }
    if (manufacturer) {
      comment +=" manufactured by " + manufacturer.toLowerCase;
    }
    comment += "."

    j += 1;
    Table.findOneAndUpdate({
      "geometry.type": "Point",
      "geometry.coordinates": coordinates
    }, { $set: {
      "type": "Feature",
      "properties.type": "table",
      "properties.source.retrieved": retrieved,
      "properties.source.name": dataset_name,
      "properties.source.url": dataset_url_human,
      "properties.license.name": license_name,
      "properties.license.url": license_url,
      "properties.comment": comment,
      "geometry.type": "Point",
      "geometry.coordinates": coordinates
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
  });
});