import CSVParse = require('csv-parse/lib/sync');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase(); });
};

// Important Fields
let source_name = "City of Sioux Falls"
let dataset_name = "Park Amenities (Points)"
let dataset_url_human = "https://opendata.arcgis.com/datasets/acd11d56a9394f2889a39e1504c8e088_3"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/acd11d56a9394f2889a39e1504c8e088_3.csv"
let license_name = "Attribution 4.0 International (CC BY 4.0) "
let license_url = "https://creativecommons.org/licenses/by/4.0/"

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let type = data["AmenityType"];
    if (type != "PICNIC SHELTER") { // I can't see any data in this dataset for unsheltered picnic tables...
      return;
    }
    let sheltered = true;

    let lat: number = parseFloat(data["Y"]);
    let lng: number = parseFloat(data["X"]);

    let objectID = data["OBJECTID"]

    let comment: string = capitalize(data["Information"])
    if (comment == "") {
      comment = undefined;
    }

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
          "properties.source.id": objectID,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.sheltered": sheltered,
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