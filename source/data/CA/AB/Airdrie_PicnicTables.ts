// NOTES:
// * This dataset has no ID field identifying individual picnic tables (as of 2018-05-14)

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

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0)
  let retrieved = new Date()

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let color: string = data["Colour"]
    if (color == "") {
      color = undefined
    }
    let manufacturer: string = data["Manufactur"]
    if (manufacturer == "") {
      manufacturer = undefined
    }
    let material: string = data["Material"]
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
      comment += " made from " + material.toLowerCase
    }
    if (manufacturer) {
      comment += " manufactured by " + manufacturer.toLowerCase
    }
    comment += "."

    let lat: number = parseFloat(data["Y"])
    let lng: number = parseFloat(data["X"])

    database_updates.push(Picnic.create({
      "type": "Feature",
      "properties.type": "table",
      "properties.source.retrieved": retrieved,
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.url": dataset_url_human,
      "properties.license.name": license_name,
      "properties.license.url": license_url,
      "properties.comment": comment,
      "geometry.type": "Point",
      "geometry.coordinates": [lng, lat]
    }))
  })

  // Remove old tables from this data source
  database_updates.push(Picnic.remove({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec())

  return database_updates
})