import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Cook County Government"
let dataset_name = "Picnic Grove"
let dataset_url_human = "http://cookviewer1.cookcountyil.gov/ArcGIS/rest/services/cookVwrDynmc/MapServer/7"
let dataset_url_json_1 = "http://cookviewer1.cookcountyil.gov/ArcGIS/rest/services/cookVwrDynmc/MapServer/7/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json"
let dataset_url_json_2 = "http://cookviewer1.cookcountyil.gov/ArcGIS/rest/services/cookVwrDynmc/MapServer/7/query?where=OBJECTID>%3D500&outFields=*&returnGeometry=true&outSR=4326&f=json"
let license_name = "Unknown"
let license_url = "Unknwon"

let retrieved = new Date()
let parsingFunction = async function (res: any) {
  let database_updates = 0

  for (let data of res.features) {
    let lat: number = parseFloat(data.geometry.y)
    let lng: number = parseFloat(data.geometry.x)
    let object_id = data.attributes.OBJECTID

    let comment: string = "This is a picnic \"grove\", there may be no tables here."
    let capacity: number
    if (data.attributes.Capacity) {
      comment += " There is room for approximately " + capacity + " people to picnic."
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
  await Picnic.deleteMany({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
}

let runSync = async () => {
  await Download.parseDataJSON(dataset_name, dataset_url_json_1, parsingFunction)
  await Download.parseDataJSON(dataset_name, dataset_url_json_2, parsingFunction)
}
runSync()