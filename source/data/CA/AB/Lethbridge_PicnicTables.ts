import CSVParse = require('csv-parse/lib/sync');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "Lethbridge Open Data"
let dataset_name = "Picnic Tables"
let dataset_url_human = "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0"
let dataset_url_csv = "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0.csv"
let license_name = "City of Lethbridge​ - Open Data License (Version 1.0)"
let license_url = "http://www.lethbridge.ca/Pages/OpenDataLicense.aspx"

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let lat: Number = parseFloat(data["Y"]);
    let lng: Number = parseFloat(data["X"]);

    let material: string = data["Material"].toLowerCase();
    let concrete_pad: boolean = data["Concrete_Pad"] == "Yes";
    let wheelchair: boolean = data["Wheelchair"] == "Yes";
    let plaque: boolean = data["Plaque"] == "Yes";
    let old_comment: string = data["Comment"];
    let comment: string = "A table made from " + material + ".";
    if (concrete_pad) {
      comment += " Has a concrete pad.";
    }
    if (plaque) {
      comment += " Has a plaque."
    }
    if (old_comment) {
      comment += " The dataset which this table was obtained from has the following comment: \"" + old_comment + "\"";
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
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.accessible": wheelchair,
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