// NOTES:
// * This dataset has an object id field, but it has IDs from 1 to 351 for 351 tables, so it's probably not useful.

import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "City of Corona Open Data"
let dataset_name = "Park Picnic Tables"
let dataset_url_human = "https://gis-cityofcorona.opendata.arcgis.com/datasets/park-picnic-tables"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/ff7a42aa04b54542b0249678556891c8_3.csv"
// TODO: Find out
let license_name = "Unknown"
let license_url = ""

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let lng: number = parseFloat(data["X"])
    let lat: number = parseFloat(data["Y"])

    let sheltered: boolean
    if (data["SHELTER"] == "NO") {
      sheltered = false
    } else if (data["SHELTER"].trim()) {
      sheltered = true
    }

    let information: string = data["Comments"].trim()
    if (information.includes("MISSING")) {
      continue
    }
    let ada_seating: boolean
    if (information.includes("ADA SEATING")) {
      ada_seating = true
    }

    let comment: string = "A "
    let color: string = data["COLOR"].trim()
    if (color) {
      comment += color.toLowerCase() + " "
    }
    let shape: string = data["TableShape"].trim()
    if (shape == "RECT") {
      comment += "rectangular "
    } else if (shape == "CRCL") {
      comment += "circular "
    }
    let material: string = data["TableMaterial"].trim()
    if (material == "CONC") {
      comment += "concrete "
    } else if (material == "METAL") {
      comment += "metal "
    } else if (material == "WOOD") {
      comment += "wood "
    }
    comment += "table "
    let condition: string = data["Condition"].trim()
    if (condition) {
      comment += "in " + condition.toLowerCase() + " condition "
    }
    let park: string = data["PARKNAME"].trim()
    if (park) {
      comment += "in " + park.toLowerCase()
    }
    comment = comment.trimRight() + "."

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "geometry.coordinates": [lng, lat]
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.sheltered": sheltered,
          "properties.accessible": ada_seating,
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