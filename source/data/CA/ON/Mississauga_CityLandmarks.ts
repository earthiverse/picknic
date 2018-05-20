import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase() })
}

// Important Fields
let source_name = "City of Mississauga Open Data Catalogue"
let dataset_name = "City Landmarks"
let dataset_url_human = "http://data.mississauga.ca/datasets/0ef6b00cb09546caa8e9325787916a9a_0"
let dataset_url_csv = "http://data.mississauga.ca/datasets/0ef6b00cb09546caa8e9325787916a9a_0.csv"
let license_name = "City of Mississauga Open Data Terms of Use"
let license_url = "http://www5.mississauga.ca/research_catalogue/CityofMississauga_TermsofUse.pdf"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    if (data["LANDMARKTY"] != "PICAR") {
      continue
    }
    let lat = parseFloat(data["Y"])
    let lng = parseFloat(data["X"])

    let comment: string = capitalize(data["LANDMARKNA"])

    let fid = data["FID"]

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": fid
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.id": fid,
          "properties.source.url": dataset_url_human,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.comment": comment,
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