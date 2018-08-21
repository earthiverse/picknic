import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Melbourne Data"
let dataset_name = "Street Furniture"
let dataset_url_human = "https://data.melbourne.vic.gov.au/Assets-Infrastructure/Street-furniture-including-bollards-bicycle-rails-/8fgn-5q6t"
let dataset_url_csv = "https://data.melbourne.vic.gov.au/api/views/8fgn-5q6t/rows.csv?accessType=DOWNLOAD"
let license_name = "Creative Commons Attribution 4.0 International Public License"
let license_url = "https://creativecommons.org/licenses/by/4.0/legalcode"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let type: string = data["ASSET_TYPE"]
    if (type != "Picnic Setting") {
      continue
    }

    let match: RegExpExecArray = /([\d\.-]+),\s([\d\.-]+)/.exec(data["CoordinateLocation"])
    let lat: number = parseFloat(match[1])
    let lng: number = parseFloat(match[2])

    let gis_id = data["GIS_ID"]
    let description: string = data["DESCRIPTION"]
    let location_description: string = data["LOCATION_DESC"]

    let comment = description + ". " + location_description

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": gis_id
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": gis_id,
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