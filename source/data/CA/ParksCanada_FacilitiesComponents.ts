import Mongoose = require('mongoose');
import Request = require('request-promise-native');

import { Picnic, IPicnic } from '../../models/Picnic';
import { DocumentQuery } from 'mongoose';

// Important Fields
let source_name = "Government of Canada Open Government Portal"
let dataset_name = "Parks Canada Facilities Components"
let dataset_url_human = "http://open.canada.ca/data/en/dataset/78af8288-d785-49e6-8773-e21a707d14ca"
let dataset_url_json = "http://opendata.arcgis.com/datasets/c2bd1dec9aee44ad9403eaff2a7faadd_0.geojson"
let license_name = "Open Government License - Canada (Version 2.0)"
let license_url = "http://open.canada.ca/en/open-government-licence-canada"

// Statistics
let successes = 0;
let failures = 0;
let total = 0;

// Connect to database
console.log("Connecting to MongoDB...");
Mongoose.connect('mongodb://localhost/picknic').then(function () {
  // Download data
  let retrieved = new Date();
  console.log("Downloading " + dataset_url_json + "...");
  let y: Array<any> = Array<any>(0);
  Request({
    uri: dataset_url_json,
    json: true
  })
    // Parse data
    .then((body: any) => {
      console.log("Parsing data...");
      for (let feature of body.features) {
        // Check if it's a picnic table first
        if (feature.properties.Component_Type_Composante == null || feature.properties.Component_Type_Composante.search(/Picnic/i) == -1) {
          continue;
        }
        let coordinates = feature.geometry.coordinates;
        let object_id = feature.properties.OBJECTID;
        let accessible: boolean;
        if (feature.properties.Accessible == null || feature.properties.Accessible == "") {
          accessible = undefined;
        } else if ((feature.properties.Accessible as string).search(/Yes/i) >= 0) {
          accessible = true;
        } else {
          accessible = false;
        }
        let comment: string;
        if (feature.properties.Name_e != null && feature.properties.Name_e != "") {
          comment = feature.properties.Name_e;
        } else {
          comment = undefined;
        }

        total += 1;
        y.push(Picnic.findOneAndUpdate({
          "properties.source.url": dataset_url_human,
          "properties.source.id": object_id
        }, {
            $set: {
              "type": "Feature",
              "properties.type": "table",
              "properties.source.retrieved": retrieved,
              "properties.source.name": source_name,
              "properties.source.dataset": dataset_name,
              "properties.source.url": dataset_url_human,
              "properties.source.id": object_id,
              "properties.license.name": license_name,
              "properties.license.url": license_url,
              "properties.accessible": accessible,
              "properties.comment": comment,
              "geometry.type": "Point",
              "geometry.coordinates": coordinates
            }
          }, {
            "upsert": true,
            "new": true
          }).exec());
      }
    })
    // Error handler for download
    .catch(function (error) {
      console.log("----- ERROR (" + dataset_name + ") -----");
      console.log(error);
      Mongoose.disconnect();
    })
    .then(() => {
      // Disconnect from database
      Promise.all(y).then((values) => {
        console.log("Updated " + y.length + " data points.")
        console.log("Disconnecting...");
        Mongoose.disconnect();
      })
    })
})