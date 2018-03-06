import CSVParse = require('csv-parse/lib/sync');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "City of Corona Open Data"
let dataset_name = "Park Picnic Tables"
let dataset_url_human = "https://opendata.arcgis.com/datasets/304d0de598b347e2bbc387b63c9b8d3e_3"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/304d0de598b347e2bbc387b63c9b8d3e_3.csv"
// TODO: Find out
let license_name = "Unknown"
let license_url = ""

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let lng: number = parseFloat(data["X"]);
    let lat: number = parseFloat(data["Y"]);

    let sheltered: boolean;
    if (data["SHELTER"] == "NO") {
      sheltered = false;
    } else if (data["SHELTER"].trim() != "") {
      sheltered = true;
    }

    let information: string = data["Comment"].trim()
    if (information.includes("MISSING")) {
      return;
    }
    let ada_seating: boolean;
    if (information.includes("ADA SEATING")) {
      ada_seating = true;
    } else {
      ada_seating = undefined;
    }

    let comment: string = "A "
    let color: string = data["COLOR"].trim()
    if (color) {
      comment += color.toLowerCase() + " ";
    }
    let shape: string = data["DESCRIPT"].trim()
    if (shape == "RECT") {
      comment += "rectangular "
    } else if (shape == "CRCL") {
      comment += "circular "
    }
    let material: string = data["MATERIAL"].trim()
    if (material == "CONC") {
      comment += "concrete "
    } else if (material == "METAL") {
      comment += "metal "
    } else if (material == "WOOD") {
      comment += "wood "
    }
    comment += "table "
    let condition: string = data["Condition"].trim()
    if (condition) {
      comment += "in " + condition.toLowerCase() + " condition "
    }
    let park: string = data["PARKNAME"].trim()
    if (park) {
      comment += "in " + park.toLowerCase()
    }
    comment = comment.trimRight() + ".";

    database_updates.push(Picnic.findOneAndUpdate({
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
          "properties.sheltered": sheltered,
          "properties.accessible": ada_seating,
          "properties.comment": comment,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat]
        }
      }, {
        "upsert": true,
        "new": true
      }).exec());
  })

  return database_updates;
});