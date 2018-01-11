import Mongoose = require('mongoose');
import Request = require('request-promise-native');

import { Picnic, IPicnic } from '../../../models/Picnic';
import { DocumentQuery } from 'mongoose';

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase(); });
};

// Important Fields
let source_name = "Portail des données ouvertes de la Ville de Montréal"
let dataset_name = "Mobilier urbain dans les grands parcs"
let dataset_url_human = "http://donnees.ville.montreal.qc.ca/dataset/mobilierurbaingp"
let dataset_url_json = "http://donnees.ville.montreal.qc.ca/dataset/fb04fa09-fda1-44df-b575-1d14b2508372/resource/65766e31-f186-4ac9-9595-bfcf47ae9158/download/mobilierurbaingp.geojson"
let license_name = "Creative Commons Attribution 4.0 International"
let license_url = "http://creativecommons.org/licenses/by/4.0/"

// Connect to database
console.log("Connecting to MongoDB...");
Mongoose.connect('mongodb://localhost/picknic').then(function () {
  // Download data
  let retrieved = new Date();
  console.log("Downloading " + dataset_url_json + "...");
  let database_updates: Array<any> = Array<any>(0);
  Request({
    uri: dataset_url_json,
    json: true
  })
    // Parse data
    .then((body: any) => {
      console.log("Parsing & inserting data...");
      for (let feature of body.features) {
        // Check if it's a picnic table first
        if (feature.properties.ElementDes == null || feature.properties.ElementDes.search(/table a pique-nique/i) == -1) {
          continue;
        }
        let coordinates = feature.geometry.coordinates;
        let object_id = feature.properties.OBJECTID;
        let park_name = feature.properties.Nom_parc;
        let comment: string;
        if (feature.properties.Nom_parc != null && feature.properties.Nom_parc != "") {
          comment = capitalize(feature.properties.Nom_parc);
        } else {
          comment = undefined;
        }

        database_updates.push(Picnic.findOneAndUpdate({
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
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
      Promise.all(database_updates).then(() => {
        console.log("Updated " + database_updates.length + " data points.")
        console.log("Disconnecting...");
        Mongoose.disconnect();
      })
    })
})