// NOTES:
// * This dataset has a sketchy ID field identifying individual picnic tables (as of 2018-05-18)

import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "City of Airdrie"
let dataset_name = "Airdrie Picnictables"
let dataset_url_human = "http://data-airdrie.opendata.arcgis.com/datasets/airdrie-picnictables"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/b07ce15756884cfdab2537d5d9b92eb4_0.csv"
let license_name = "Open Data Licence - City of Airdrie (Version 1.0)"
let license_url = "http://data-airdrie.opendata.arcgis.com/pages/our-open-licence"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let color: string = data["Colour"].trim().toLowerCase()
    if (color == "") {
      color = undefined
    }
    let manufacturer: string = data["Manufactur"].trim().toLowerCase()
    if (manufacturer == "") {
      manufacturer = undefined
    }
    let material: string = data["Material"].trim().toLowerCase()
    if (material == "") {
      material = undefined
    }
    // TODO: NOTE: This FID doesn't look meaninful, so it might break in the future. :(
    let assetID: string = data["FID"]

    let comment: string
    if (color) {
      comment = "A " + color.toLowerCase() + " table"
    } else {
      comment = "A table"
    }
    if (material) {
      if (material == "wooden") {
        material = "wood"
      }
      comment += " made from " + material.toLowerCase
    }
    if (manufacturer) {
      comment += " manufactured by " + manufacturer.toLowerCase
    }
    comment += "."

    let lat: number = parseFloat(data["Y"])
    let lng: number = parseFloat(data["X"])

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": assetID // This ID is sketchy, as there are 140 tables, and the IDs are 1 to 140...
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.id": assetID,
          "properties.source.url": dataset_url_human,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
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

  return Promise.resolve(database_updates)
})