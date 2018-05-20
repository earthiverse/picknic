import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "National Park Service"
let dataset_name = "Picnic Areas"
let dataset_url_human = "https://opendata.arcgis.com/datasets/0180f1331f004a01878e03dcd03a99ad_0"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/0180f1331f004a01878e03dcd03a99ad_0.csv"
let license_name = "Unspecified (Public Domain?)"
let license_url = "https://en.wikipedia.org/wiki/Public_domain"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let lat = parseFloat(data["Y"])
    let lng = parseFloat(data["X"])
    let globalID: string = data["GlobalID"]

    let comment: string = data["POINAME"]
    if (data["LOC_NAME"]) {
      comment = data["LOC_NAME"] + " - "
    }
    if (data["LANDFORM"]) {
      comment += "Landform: " + data["LANDFORM"]
    }

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": globalID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": globalID,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.comment": comment,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat]
        }
      }, {
        "upsert": true
      }).exec()
    database_updates += 1
  }

  // Remove old tables from this data source
  await Picnic.remove({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})