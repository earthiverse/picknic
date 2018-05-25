// NOTES:
// * This dataset has no ID field identifying individual picnic tables (as of 2018-05-14)

import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Open Calgary"
let dataset_name = "Parks Seating"
let dataset_url_human = "https://data.calgary.ca/Recreation-and-Culture/Parks-Seating/ikeb-n5bc"
let dataset_url_csv = "https://data.calgary.ca/api/views/ikeb-n5bc/rows.csv?accessType=DOWNLOAD"
let license_name = "Open Government License - City of Calgary (Version 2.1)"
let license_url = "https://data.calgary.ca/stories/s/Open-Calgary-Terms-of-Use/u45n-7awa"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  let csv = CSVParse(res, { columns: true, ltrim: true })
  for (let data of csv) {
    let lat = parseFloat(data["latitude"])
    let lng = parseFloat(data["longitude"])
    let type = data["TYPE_DESCRIPTION"]
    if (type != "PICNIC TABLE" && type != "MEMORIAL PICNIC TABLE") {
      continue
    }
    let active = data["LIFE_CYCLE_STATUS"]
    if (active != "ACTIVE") {
      continue
    }
    let asset_class: string = data["ASSET_CLASS"]
    let maint_info: string = data["MAINT_INFO"]
    let comment = ""
    if (asset_class.search("REMOVED") != -1) {
      comment += " Might be missing."
    }
    if (maint_info.search("PORTABLE") != -1) {
      comment += " This is a portable table, so it might be moved, or missing."
    }

    // Fix comment before adding
    comment = comment.trimLeft()
    if (!comment) {
      comment = undefined
    }

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
  await Picnic.remove({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})