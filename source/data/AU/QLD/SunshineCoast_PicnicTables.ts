import CSVParse = require('csv-parse');
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Sunshine Coast Council Open Data"
let dataset_name = "Picnic Tables"
let dataset_url_human = "https://data.sunshinecoast.qld.gov.au/dataset/Picnic-Tables/emjg-3ene"
let dataset_url_csv = "https://data.sunshinecoast.qld.gov.au/api/views/emjg-3ene/rows.csv?accessType=DOWNLOAD"
let license_name = "Creative Commons Attribution 3.0 Australia"
let license_url = "creativecommons.org/licenses/by/3.0/au/deed.en"

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
      let match: RegExpExecArray = regex.exec(data[i]["SHAPE"]);
      let lat: number = parseFloat(match[1]);
      let lng: number = parseFloat(match[2]);

      let objectID = data[i]["OBJECTID"];

      let status: string = data[i]["Status"];
      if (status == "Disposed") continue; // Skip here if the asset is disposed.

      let comment: string = "";
      let originalComments: string = data[i]["Comments"];
      originalComments = originalComments.trim();
      if (originalComments) {
        comment = "Original comment from dataset: \"" + originalComments + "\".";
      }
      let locationDescription: string = data[i]["LocationDesc"];
      locationDescription = locationDescription.trim();
      if (locationDescription) {
        comment += " Location description from dataset: \"" + locationDescription + "\".";
      }
      let owner: string = data[i]["Owner"];
      if (owner) {
        comment += " Owned by " + owner + ".";
      }
      let manager: string = data[i]["AssetManager"];
      if (manager) {
        comment += " Managed by " + manager + ".";
      }
      let maintainer: string = data[i]["MaintainedBy"];
      if (maintainer) {
        comment += " Maintained by " + maintainer + ".";
      }
      let condition: string = data[i]["Condition"];
      if (condition && condition != "Not Assessed") {
        comment += " Condition (1-5, lower is better): " + condition + "."
      }
      let conditionComments: string = data[i]["ConditionComments"];
      conditionComments = conditionComments.trim();
      if (conditionComments) {
        comment += " Condition comments from dataset: \"" + conditionComments + "\"."
      }
      let subType: string = data[i]["AssetSubType"];
      if (subType == "Fish Cleaning") continue; // lol, we don't want to eat at a fish cleaning table...
      else if (subType) {
        comment += " Table style: " + subType + ".";
      }
      let seatType: string = data[i]["SeatType"];
      if (seatType) {
        comment += " Seat type: " + seatType + ".";
      }
      let tableMaterial: string = data[i]["TableMaterial"];
      if (tableMaterial) {
        comment += " Table material: " + tableMaterial + ".";
      }
      let tableFinish: string = data[i]["TableFinishCoating"];
      if (tableFinish) {
        comment += " Table finish: " + tableFinish + ".";
      }
      let mountingType: string = data[i]["MountingType"];
      if (mountingType) {
        comment += " Mounting type: " + mountingType + ".";
      }
      let manufacturer: string = data[i]["Manufacturer"];
      if (manufacturer) {
        comment += " Manufacturer: " + manufacturer + ".";
      }
      let length: string = data[i]["Length_m"];
      if (length) {
        comment += " Length: " + length + "m.";
      }
      let remainingLife: string = data[i]["RemLife"];
      if (remainingLife) {
        comment += " Remaining life: " + remainingLife + ".";
      }
      let equalAccess: any = data[i]["EqualAccess"];
      if (equalAccess == null) {
        equalAccess = undefined;
      } else if (equalAccess == "No") {
        equalAccess = false;
      } else if (equalAccess == "Yes") {
        equalAccess = true;
      }
      let sheltered: any = data[i]["Sheltered"];
      if (sheltered == null) {
        sheltered = undefined;
      } else if (sheltered == "No") {
        sheltered = false;
      } else if (sheltered == "Yes") {
        sheltered = true;
      }

      // Insert or Update Table
      j += 1;
      Picnic.findOneAndUpdate({
        "properties.source.url": dataset_url_human,
        "properties.source.id": objectID
      }, {
          $set: {
            "type": "Feature",
            "properties.type": "table",
            "properties.accessible": equalAccess,
            "properties.sheltered": sheltered,
            "properties.comment": comment,
            "properties.source.retrieved": retrieved,
            "properties.source.name": source_name,
            "properties.source.dataset": dataset_name,
            "properties.source.url": dataset_url_human,
            "properties.source.id": objectID,
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
  });
});