import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Ohio State University"
let dataset_name = "Picnic Table"
let dataset_url_human = "https://hub.arcgis.com/datasets/09412cb07aa745578563feffc02160ab_24"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/09412cb07aa745578563feffc02160ab_24.csv"
let license_name = "CC0" // Emailed the creator of the dataset, recieved a response "Feel free to use that data set however you would like."
let license_url = "https://creativecommons.org/publicdomain/zero/1.0/"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let lng: number = parseFloat(data["X"])
    let lat: number = parseFloat(data["Y"])

    let globalID = data["GlobalID"]

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
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
        "upsert": true
      }).exec()
    database_updates += 1
  }

  // Remove old tables from this data source
  await Picnic.deleteMany({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})