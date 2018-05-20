import CSVParse = require('csv-parse/lib/sync')
import Striptags = require('striptags')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Los Angeles Geohub"
let dataset_name = "Picnic Areas"
let dataset_url_human = "http://geohub.lacity.org/datasets/678499fcf0b84e06ac80a37ae7cde7e3_9"
let dataset_url_csv = "http://geohub.lacity.org/datasets/678499fcf0b84e06ac80a37ae7cde7e3_9.csv"
let license_name = "Public Domain"
let license_url = "https://creativecommons.org/publicdomain/mark/1.0/"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let lat = parseFloat(data["latitude"])
    let lng = parseFloat(data["longitude"])

    let ext_id = data["ext_id"]

    let comment: string = data["Name"].trim()
    if (data["hours"].trim()) {
      comment += ". " + Striptags(data["hours"]).trim()
    }

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": ext_id
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.id": ext_id,
          "properties.source.url": dataset_url_human,
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