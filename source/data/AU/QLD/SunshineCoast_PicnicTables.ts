import CSVParse = require('csv-parse/lib/sync');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "Sunshine Coast Council Open Data"
let dataset_name = "Picnic Tables"
let dataset_url_human = "https://data.sunshinecoast.qld.gov.au/dataset/Picnic-Tables/emjg-3ene"
let dataset_url_csv = "https://data.sunshinecoast.qld.gov.au/api/views/emjg-3ene/rows.csv?accessType=DOWNLOAD"
let license_name = "Creative Commons Attribution 3.0 Australia"
let license_url = "creativecommons.org/licenses/by/3.0/au/deed.en"

// Regular Expression for Location
let regex = new RegExp(/([\d\.-]+),\s([\d\.-]+)/);

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let match: RegExpExecArray = regex.exec(data["SHAPE"]);
    let lat: number = parseFloat(match[1]);
    let lng: number = parseFloat(match[2]);

    let objectID = data["OBJECTID"];

    let status: string = data["Status"];
    if (status == "Disposed") return; // Skip here if the asset is disposed.

    let comment: string = "";
    let originalComments: string = data["Comments"];
    originalComments = originalComments.trim();
    if (originalComments) {
      comment = "Original comment from dataset: \"" + originalComments + "\".";
    }
    let locationDescription: string = data["LocationDesc"];
    locationDescription = locationDescription.trim();
    if (locationDescription) {
      comment += " Location description from dataset: \"" + locationDescription + "\".";
    }
    let owner: string = data["Owner"];
    if (owner) {
      comment += " Owned by " + owner + ".";
    }
    let manager: string = data["AssetManager"];
    if (manager) {
      comment += " Managed by " + manager + ".";
    }
    let maintainer: string = data["MaintainedBy"];
    if (maintainer) {
      comment += " Maintained by " + maintainer + ".";
    }
    let condition: string = data["Condition"];
    if (condition && condition != "Not Assessed") {
      comment += " Condition (1-5, lower is better): " + condition + "."
    }
    let conditionComments: string = data["ConditionComments"];
    conditionComments = conditionComments.trim();
    if (conditionComments) {
      comment += " Condition comments from dataset: \"" + conditionComments + "\"."
    }
    let subType: string = data["AssetSubType"];
    if (subType == "Fish Cleaning") return; // lol, we don't want to eat at a fish cleaning table...
    else if (subType) {
      comment += " Table style: " + subType + ".";
    }
    let seatType: string = data["SeatType"];
    if (seatType) {
      comment += " Seat type: " + seatType + ".";
    }
    let tableMaterial: string = data["TableMaterial"];
    if (tableMaterial) {
      comment += " Table material: " + tableMaterial + ".";
    }
    let tableFinish: string = data["TableFinishCoating"];
    if (tableFinish) {
      comment += " Table finish: " + tableFinish + ".";
    }
    let mountingType: string = data["MountingType"];
    if (mountingType) {
      comment += " Mounting type: " + mountingType + ".";
    }
    let manufacturer: string = data["Manufacturer"];
    if (manufacturer) {
      comment += " Manufacturer: " + manufacturer + ".";
    }
    let length: string = data["Length_m"];
    if (length) {
      comment += " Length: " + length + "m.";
    }
    let remainingLife: string = data["RemLife"];
    if (remainingLife) {
      comment += " Remaining life: " + remainingLife + ".";
    }
    let equalAccess: any = data["EqualAccess"];
    if (equalAccess == null || equalAccess == "") {
      equalAccess = undefined;
    } else if (equalAccess == "No") {
      equalAccess = false;
    } else if (equalAccess == "Yes") {
      equalAccess = true;
    }
    let sheltered: any = data["Sheltered"];
    if (sheltered == null || sheltered == "") {
      sheltered = undefined;
    } else if (sheltered == "No") {
      sheltered = false;
    } else if (sheltered == "Yes") {
      sheltered = true;
    }

    database_updates.push(Picnic.findOneAndUpdate({
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
        "upsert": true,
        "new": true
      }).exec());
  });

  return database_updates;
});