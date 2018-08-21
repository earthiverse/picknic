import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase() })
}

// Important Fields
let source_name = "dataACT"
let dataset_name = "Public Furniture in the ACT"
let dataset_url_human = "https://www.data.act.gov.au/Infrastructure-and-Utilities/Public-Furniture-in-the-ACT/ch39-bukk"
let dataset_url_csv = "https://www.data.act.gov.au/api/views/ch39-bukk/rows.csv?accessType=DOWNLOAD"
let license_name = "Creative Commons Attribution 3.0 Australia"
let license_url = "creativecommons.org/licenses/by/3.0/au/deed.en"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let type: string = data["FEATURE TYPE"]
    if (type != "TABLE") {
      continue
    }

    let lat: number = parseFloat(data["LATITUDE"])
    let lng: number = parseFloat(data["LONGITUDE"])
    let assetID = data["ASSET ID"]
    let location: string = data["LOCATION NAME"].trim()
    let comment
    if (location) {
      comment = "Located in " + capitalize(location) + "."
    }

    await Picnic.updateOne({
      "properties.source.dataset": dataset_name,
      "properties.source.url": dataset_url_human,
      "properties.source.id": assetID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": assetID,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
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
  await Picnic.deleteMany({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})