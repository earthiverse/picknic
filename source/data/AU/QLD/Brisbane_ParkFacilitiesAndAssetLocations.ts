import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase() })
}

// Important Fields
let source_name = "Brisbane City Council Data Directory"
let dataset_name = "Park Facilities and Assets Locations"
let dataset_url_human = "https://www.data.brisbane.qld.gov.au/data/dataset/park-facilities-and-assets"
let dataset_url_csv = "https://www.data.brisbane.qld.gov.au/data/dataset/39cb83b5-111e-47fb-ae21-6b141cd16f25/resource/66b3c6ce-4731-4b19-bddd-8736e3111f7e/download/open-data---am---datasetparkfacilties.csv"
let license_name = "Creative Commons Attribution 4.0"
let license_url = "https://creativecommons.org/licenses/by/4.0/"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let itemType = data["ITEM_TYPE"]
    if (!itemType.startsWith("PICNIC") || itemType == "PICNIC SHELTER") {
      // Not a picnic table, or is a picnic shelter but not a table
      continue
    }

    let lng: number = data["LONGITUDE"]
    let lat: number = data["LATITUDE"]

    let description = data["DESCRIPTION"]
    let nodeName = capitalize(data["NODES_NAME"])

    let objectID = data["ITEM_ID"]

    let comment = nodeName + "."
    if (description) {
      comment += " " + description + "."
    }

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": objectID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
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
  await Picnic.deleteMany({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})