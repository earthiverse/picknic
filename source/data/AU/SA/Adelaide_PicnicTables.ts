import XLSX = require('xlsx')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Adelaide City Council"
let dataset_name = "Picnic Tables"
let dataset_url_human = "https://opendata.adelaidecitycouncil.com/PicnicTables/"
let dataset_url_xls = "https://opendata.adelaidecitycouncil.com/PicnicTables/PicnicTables.xls"
let license_name = "Creative Commons Attribution 4.0 International Public License"
let license_url = "https://creativecommons.org/licenses/by/4.0/legalcode"

Download.parseDataBinary(dataset_name, dataset_url_xls, async function (res: Uint8Array) {
  let database_updates = 0
  let retrieved = new Date()

  let workbook = XLSX.read(res)
  for (let sheetName of workbook.SheetNames) {
    let data: any = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    for (let row of data) {
      let lat: number = parseFloat(row["POINT_Y"])
      let lng: number = parseFloat(row["POINT_X"])

      let type: string = row["Type"]
      let uniqueAsse: string = row["UniqueAsse"]

      let comment: string = ""
      if (type && type != "Unknown") {
        comment = "Type: " + type
      }

      await Picnic.updateOne({
        "properties.source.name": source_name,
        "properties.source.dataset": dataset_name,
        "properties.source.id": uniqueAsse
      }, {
          $set: {
            "type": "Feature",
            "properties.type": "table",
            "properties.source.retrieved": retrieved,
            "properties.source.name": source_name,
            "properties.source.dataset": dataset_name,
            "properties.source.url": dataset_url_human,
            "properties.source.id": uniqueAsse,
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