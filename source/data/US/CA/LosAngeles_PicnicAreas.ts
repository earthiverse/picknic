import CSVParse = require('csv-parse/lib/sync');
import Striptags = require('striptags');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "Los Angeles Geohub"
let dataset_name = "Picnic Areas"
let dataset_url_human = "http://geohub.lacity.org/datasets/678499fcf0b84e06ac80a37ae7cde7e3_9"
let dataset_url_csv = "http://geohub.lacity.org/datasets/678499fcf0b84e06ac80a37ae7cde7e3_9.csv"
let license_name = "Public Domain"
let license_url = "https://creativecommons.org/publicdomain/mark/1.0/"

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let lat = parseFloat(data["latitude"]);
    let lng = parseFloat(data["longitude"]);

    let comment: string = data["Name"].trim();
    if (data["hours"].trim()) {
      comment += ". " + Striptags(data["hours"]).trim();
    }

    database_updates.push(Picnic.findOneAndUpdate({
      "geometry.type": "Point",
      "geometry.coordinates": [lng, lat]
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
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