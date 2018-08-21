// NOTES:
// * This dataset changed its data structure around December 2017. It has more data now.

import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Lethbridge Open Data"
let dataset_name = "Picnic Tables"
let dataset_url_human = "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0"
let dataset_url_csv = "http://opendata.lethbridge.ca/datasets/8fd139cd01a84df4a311f569fe583eff_0.csv"
let license_name = "City of Lethbridge​ - Open Data License (Version 1.0)"
let license_url = "http://www.lethbridge.ca/Pages/OpenDataLicense.aspx"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let lat: Number = parseFloat(data["Y"])
    let lng: Number = parseFloat(data["X"])

    let asset_id: string = data["AssetID"]
    let accessible: boolean = data["Accessible"].startsWith("Y")
    let material: string = data["Material"].toLowerCase()
    let surface: string = data["Surface"].toLowerCase()
    let plaque: boolean = data["Plaque"] == "Yes"
    let dedication: string = data["Dedication"].trim()
    let greenspace_id: string = data["Grnspc_ID"]

    let comment: string = data["Comment"].trim()
    if (comment) {
      comment += "."
    }
    if (surface != "No") {
      comment += " The table is on a surface that is " + surface.toLowerCase() + "."
      comment.trimLeft()
    }
    if (plaque) {
      comment += " Has a plaque"
      if (dedication) {
        comment += " for " + dedication
      }
      comment += "."
      comment.trimLeft()
    }

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": asset_id
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.id": asset_id,
          "properties.source.url": dataset_url_human,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.accessible": accessible,
          "properties.comment": comment,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat]
        }
      }, {
        upsert: true
      }).lean().exec()
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