// NOTES:
// * This dataset has no ID field identifying individual picnic tables (as of 2018-05-14)

import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Edmonton Open Data Portal"
let dataset_name = "Public Picnic Table Locations"
let dataset_url_human = "https://data.edmonton.ca/Facilities-and-Structures/Public-Picnic-Table-Locations/vk3s-q842"
let dataset_url_csv = "https://data.edmonton.ca/api/views/vk3s-q842/rows.csv?accessType=DOWNLOAD"
let license_name = "City of Edmonton Open Data Terms of Use (Version 2.1)"
let license_url = "http://www.edmonton.ca/city_government/documents/Web-version2.1-OpenDataAgreement.pdf"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  let csv = CSVParse(res, { columns: true, ltrim: true })
  for (let data of csv) {
    let lat = parseFloat(data["Latitude"])
    let lng = parseFloat(data["Longitude"])

    let type = data["Table Type"].toLowerCase()
    let surface = data["Surface Material"].toLowerCase()
    let structural = data["Structural Material"].toLowerCase()
    let comment: string
    if (type == "other table") {
      comment = "A table"
    } else {
      comment = "A " + type
    }
    comment += " made from " + structural
    if (surface != structural) {
      comment += " and " + surface
    }
    comment += " materials."

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