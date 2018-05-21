// NOTES:
// * 'OBJECTID' goes from 1 to #of results, so it's possibly not accurate.

import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Florida Department of Environmental Protection"
let dataset_name = "Florida State Park Points of Interest"
let dataset_url_human = "https://myflorida-floridadisaster.opendata.arcgis.com/datasets/f3ae9dab9acc4fcc8c445db176178d7d_6"
let dataset_url_csv = "https://myflorida-floridadisaster.opendata.arcgis.com/datasets/f3ae9dab9acc4fcc8c445db176178d7d_6.csv"
let license_name = "Creative Commons Attribution 3.0 United States" // Not really the license, but close enough. Needs no warranty, and attribution.
let license_url = "https://creativecommons.org/licenses/by/3.0/us/"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let assetType: string = data["POI_CLASSIFICATION"]
    if (assetType != "Picnic Area" && assetType != "Picnic Pavilion") {
      continue
    }
    let lng: number = parseFloat(data["X"])
    let lat: number = parseFloat(data["Y"])

    let sheltered: boolean
    if (assetType == "Picnic Pavilion") {
      sheltered = true
    }
    let objectID = data["OBJECTID"]

    let site_name: string = data["SITE_NAME"].trim()
    let comments = "Located in " + site_name + "."

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
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