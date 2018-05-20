import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "City of Perrysburg Open Data"
let dataset_name = "Park Amenities"
let dataset_url_human = "http://data.pburg.opendata.arcgis.com/datasets/3d438bf93d814588892d6192ebcaa800_0"
let dataset_url_csv = "http://data.pburg.opendata.arcgis.com/datasets/3d438bf93d814588892d6192ebcaa800_0.csv"
let license_name = "Creative Commons Attribution 3.0 United States"
let license_url = "https://creativecommons.org/licenses/by/3.0/us/"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let feature: string = data["FEATURE"]
    if (feature != "Picnic_Table") {
      continue
    }
    let lng: number = parseFloat(data["X"])
    let lat: number = parseFloat(data["Y"])

    let sheltered: boolean
    if (data["COMMENTS"].trim() == "Covered") {
      sheltered = true
    }
    let objectID = data["OBJECTID"]

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