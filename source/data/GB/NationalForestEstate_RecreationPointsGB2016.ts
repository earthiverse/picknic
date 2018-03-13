import CSVParse = require('csv-parse/lib/sync');

import { Download } from '../Download'
import { Picnic } from '../../models/Picnic';

// Important Fields
let source_name = "Forestry Commission Open Data"
let dataset_name = "National Forest Estate Recreation Points GB 2016"
let dataset_url_human = "https://opendata.arcgis.com/datasets/f680a7a646d345b597e597b9eb03be61_0"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/f680a7a646d345b597e597b9eb03be61_0.csv"
let license_name = "Open Government Licence 3.0"
let license_url = "http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    // Skip any assets that aren't picnic tables
    if (data["AssetType"] != "Picnic Table") {
      return;
    }
    let lat = parseFloat(data["Y"])
    let lng = parseFloat(data["X"])

    let objectID = data["OBJECTID"]

    let comment: string;
    // This data isn't really an asset name all the time, sometimes it's a comment...
    let assetName: string = data["ASSET_NAME"]
    if (assetName) {
      comment = assetName;
    }

    database_updates.push(Picnic.findOneAndUpdate({
      "geometry.type": "Point",
      "properties.source.id": objectID
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