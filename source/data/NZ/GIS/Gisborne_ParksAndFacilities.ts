import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Gisborne District Council ArcGIS Server"
let dataset_name = "GDC Parks and Facilities"
let dataset_url_human = "http://maps.gdc.govt.nz/arcgis/rest/services/Data/GDC_parks_facilities/MapServer/0"
let dataset_url_csv = "http://maps.gdc.govt.nz/arcgis/rest/services/Data/GDC_parks_facilities/MapServer/0/query?where=AssetType+LIKE+'Picnic%25'&outFields=*&returnGeometry=true&outSR=4326&f=json"
let license_name = "Unknown"
let license_url = "Unknwon"

Download.parseDataJSON(dataset_name, dataset_url_csv, async function (res: any) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of res.features) {
    let lat: number = parseFloat(data.geometry.y)
    let lng: number = parseFloat(data.geometry.x)
    let object_id = data.attributes.CompKey
    let comment: string = ""

    if (data.attributes.Comments) {
      comment = data.attributes.Comments
    }
    if (data.attributes.UnitDesc) {
      if (comment != "") {
        comment = comment + ". "
      }
      comment = comment + data.attributes.UnitDesc + "."

    }
    comment = comment.replace(/\s+/g, ' ')

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": object_id
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.id": object_id,
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
  await Picnic.deleteMany({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})