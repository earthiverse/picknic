import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "City of Gold Coast Open Data Portal"
let dataset_name = "Parks Sheleters"
let dataset_url_human = "https://data-goldcoast.opendata.arcgis.com/datasets/d0cbb642baf74f74b7ed2f3b4a1c3e12_0"
let dataset_url_csv = "https://data-goldcoast.opendata.arcgis.com/datasets/d0cbb642baf74f74b7ed2f3b4a1c3e12_0.csv"
let license_name = "Creative Commons Attribution 3.0"
let license_url = "https://creativecommons.org/licenses/by/3.0/"

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0)
  let retrieved = new Date()

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let picnic: string = data["PICNIC_SHELTER_SUB_TYPE"]
    if (!picnic.startsWith("Picnic")) {
      // Not a picnic shelter.
      return
    }

    let lng: number = data["X"]
    let lat: number = data["Y"]

    let objectID = data["OBJECTID"]

    // Picnic contains a simple descriptor of the size of the picnic area.
    let comment = picnic

    database_updates.push(Picnic.findOneAndUpdate({
      "properties.source.url": dataset_url_human,
      "properties.source.id": objectID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.sheltered": true,
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
        "upsert": true,
        "new": true
      }).exec())
  })

  return database_updates
})