import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Prince George's County Planning Department"
let dataset_name = "Picnic Areas"
let dataset_url_human = "http://gisdata.pgplanning.org/arcgis/rest/services/Applications/Parks_and_Rec/MapServer/14"
let dataset_url_json = "http://gisdata.pgplanning.org/arcgis/rest/services/Applications/Parks_and_Rec/MapServer/14/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json"
let license_name = "Unknown"
let license_url = "Unknwon"

Download.parseDataJSON(dataset_name, dataset_url_json, async function (res: any) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of res.features) {
    let lat: number = parseFloat(data.geometry.y)
    let lng: number = parseFloat(data.geometry.x)
    let object_id = data.attributes.PARKID

    let comment: string = ""
    if (data.attributes.DESCRIPTION) {
      comment = data.attributes.DESCRIPTION
    }

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": object_id
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
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
  await Picnic.remove({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})