import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "data.seattle.gov"
let dataset_name = "Picnic Table"
let dataset_url_human = "https://data.seattle.gov/dataset/Picnic-Table/2kfp-z97k"
let dataset_url_csv = "https://data.seattle.gov/api/views/2kfp-z97k/rows.csv?accessType=DOWNLOAD"
let license_name = "Unspecified (Public Domain?)"
let license_url = "https://en.wikipedia.org/wiki/Public_domain"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let match: RegExpExecArray = /([\d\.-]+)\s([\d\.-]+)/.exec(data["the_geom"])
    let lng: number = parseFloat(match[1])
    let lat: number = parseFloat(match[2])
    let table_size = data["TABLE_SIZE"]
    let table_pad = data["TABLE_PAD"]

    let comment: string = ""
    if (table_size) {
      comment = "Table Size (from dataset): '" + table_size + "'."
    }
    if (table_pad) {
      comment += " Table pad (from dataset): '" + table_pad + "'."
    }
    comment = comment.trim()

    let id = data["AMWOID"].trim() // This dataset is missing the ID on a couple tables...
    if (!id) {
      id = undefined
    }

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": id
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.id": id,
          "properties.source.url": dataset_url_human,
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
  await Picnic.remove({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})