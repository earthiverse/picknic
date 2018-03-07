import CSVParse = require('csv-parse/lib/sync');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase(); });
};

// Important Fields
let source_name = "Gov Data Iowa"
let dataset_name = "Alternative Service Locations - Picnic Areas"
let dataset_url_human = "https://data.iowa.gov/Transportation-Utilities/Alternative-Service-Locations-Picnic-Area/7dgi-gzrf"
let dataset_url_csv = "https://data.iowa.gov/api/views/7dgi-gzrf/rows.csv?accessType=DOWNLOAD"
// TODO: Find out
let license_name = "Unknown"
let license_url = ""

// Regular Expression for Location
let regex = new RegExp(/([\d\.-]+),\s([\d\.-]+)/);

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let match: RegExpExecArray = regex.exec(data["Shape"]);
    let lat: number = parseFloat(match[1]);
    let lng: number = parseFloat(match[2]);

    let objectID = data["OBJECTID"]

    let comment: string = ""

    let restrooms: string = data["Restrooms"]
    if (restrooms == "Yes - Not 24 Hours") {
      comment += "Has restrooms, but they are not open 24 hours."
    }
    let place: string = capitalize(data["Place"])
    if (place) {
      comment = comment.trimLeft();
      comment += " Located in " + place + "."
    }

    database_updates.push(Picnic.findOneAndUpdate({
      "geometry.type": "Point",
      "properties.source.id": objectID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": objectID,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
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