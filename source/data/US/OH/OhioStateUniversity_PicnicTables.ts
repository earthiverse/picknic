import CSVParse = require('csv-parse/lib/sync');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "Ohio State University"
let dataset_name = "Picnic Table"
let dataset_url_human = "https://hub.arcgis.com/datasets/09412cb07aa745578563feffc02160ab_24"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/09412cb07aa745578563feffc02160ab_24.csv"
// TODO: I emailed Larisa Kruger, will update if/when I get a response.
let license_name = "License Not Specified"
let license_url = ""

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let lng: number = parseFloat(data["X"]);
    let lat: number = parseFloat(data["Y"]);

    let globalID = data["GlobalID"];

    database_updates.push(Picnic.findOneAndUpdate({
      "geometry.type": "Point",
      "properties.source.id": globalID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": globalID,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
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