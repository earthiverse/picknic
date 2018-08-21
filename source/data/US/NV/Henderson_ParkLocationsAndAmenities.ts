import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase() })
}

// Important Fields
let source_name = "City of Henderson GIS Data Portal"
let dataset_name = "Park Points"
let dataset_url_human = "https://opendata.arcgis.com/datasets/553a7c45998e4baf8c64993c665fc195_7"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/553a7c45998e4baf8c64993c665fc195_7.csv"
// TODO: Find out
let license_name = "Unknown"
let license_url = ""

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    // This dataset proposes future parks, too.
    let existing: boolean = data["EXISTING"] == "Y"
    if (!existing) {
      continue
    }

    let cov_picnic = data["COV_PICNIC"]
    let shelter: boolean
    if (cov_picnic == "Y") {
      shelter = true
    } else if (cov_picnic == "N") {
      shelter = false
    }
    let picnic = data["PICNIC"] == "Y"
    if (!picnic && !shelter) {
      continue
    }

    let lat: number = parseFloat(data["Y"])
    let lng: number = parseFloat(data["X"])

    let facility = capitalize(data["FACILITY"]).trim()
    let comment = facility + "."

    if (data["BBQUE"] == "Y") {
      comment = comment.trimLeft()
      comment += " Has BBQ site(s)."
    }

    if (data["OPENGRASS"] == "Y") {
      comment = comment.trimLeft()
      comment += " Has open grass."
    }

    if (data["RESTROOMS"] == "Y") {
      comment = comment.trimLeft()
      comment += " There are washrooms nearby."
    }

    let objectID = data["OBJECTID"]

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": objectID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": objectID,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.sheltered": shelter,
          "properties.comment": comment,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat]
        }
      }, {
        "upsert": true,
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