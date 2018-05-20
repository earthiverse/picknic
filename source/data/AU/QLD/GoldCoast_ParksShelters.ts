// NOTE:
// * This dataset only contains picnic shelters.

import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "City of Gold Coast Open Data Portal"
let dataset_name = "Parks Sheleters"
let dataset_url_human = "https://data-goldcoast.opendata.arcgis.com/datasets/d0cbb642baf74f74b7ed2f3b4a1c3e12_0"
let dataset_url_csv = "https://data-goldcoast.opendata.arcgis.com/datasets/d0cbb642baf74f74b7ed2f3b4a1c3e12_0.csv"
let license_name = "Creative Commons Attribution 3.0"
let license_url = "https://creativecommons.org/licenses/by/3.0/"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let picnic: string = data["PICNIC_SHELTER_SUB_TYPE"]
    if (!picnic.startsWith("Picnic")) {
      // Not a picnic shelter.
      continue
    }

    let lng: number = data["X"]
    let lat: number = data["Y"]

    let objectID = data["OBJECTID"]

    // Picnic contains a simple descriptor of the size of the picnic area.
    let comment = picnic

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": objectID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.sheltered": true,
          "properties.comment": comment,
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": objectID,
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
  await Picnic.remove({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})