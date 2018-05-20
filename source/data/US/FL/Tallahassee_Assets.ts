// NOTES:
// * This dataset's data isn't the cleanest. It groups some tables together, and not others.
// * Some of the locations that I manually cross-checked with Google Maps were quite a bit off.

import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Talgov City Infrastructure"
let dataset_name = "Park Amenities"
let dataset_url_human = "http://talgov.tlcgis.opendata.arcgis.com/datasets/5bff3a7ad4d14f3a92b2e0eeb3ca0c90_2"
let dataset_url_csv = "http://talgov.tlcgis.opendata.arcgis.com/datasets/5bff3a7ad4d14f3a92b2e0eeb3ca0c90_2.csv"
let license_name = "Creative Commons Attribution 3.0 United States"
let license_url = "https://creativecommons.org/licenses/by/3.0/us/"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let assetType: string = data["TYPE"]
    if (assetType != "Picnic Table" && assetType != "Picnic Shelter") {
      continue
    }
    let lng: number = parseFloat(data["X"])
    let lat: number = parseFloat(data["Y"])
    if (!lng || !lat) {
      continue
    }

    let sheltered: boolean
    if (assetType == "Picnic Shelter") {
      sheltered = true
    }
    let objectID = data["GLOBALID"]

    let comments: string
    if (data["NOTES"].trim()) {
      comments = "Notes from dataset: \"" + data["NOTES"].trim() + "\". "
    }

    await Picnic.updateOne({
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
          "properties.sheltered": sheltered,
          "properties.comment": comments,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat]
        }
      }, {
        "upsert": true,
        "new": true
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