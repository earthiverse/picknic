import CSVParse = require('csv-parse/lib/sync');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "National Park Service"
let dataset_name = "Hovenweep National Monument - Picnic Tables"
let dataset_url_human = "https://opendata.arcgis.com/datasets/209df3d63249486ab527e3cfcb4ba5c3_0"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/209df3d63249486ab527e3cfcb4ba5c3_0.csv"
let license_name = "Unspecified (Public Domain?)"
let license_url = "https://en.wikipedia.org/wiki/Public_domain"

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let lat = parseFloat(data["Y"]);
    let lng = parseFloat(data["X"]);
    let alt = parseFloat(data["GPS_HEIGHT"]);

    let comment: string = data["TYPE"];
    let globalID: string = data["GlobalID"];

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
          "properties.comment": comment,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat, alt]
        }
      }, {
        "upsert": true,
        "new": true
      }).exec());
  });

  return database_updates;
});