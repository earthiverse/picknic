import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "City of Boise"
let dataset_name = "Park Activities and Amenities"
let dataset_url_human = "http://opendata.cityofboise.org/datasets/7533d78ac95c45f88dba9b7d85e1c75c_0"
let dataset_url_csv = "http://opendata.cityofboise.org/datasets/7533d78ac95c45f88dba9b7d85e1c75c_0.csv"
// TODO: Find out
let license_name = "No Warranty"
let license_url = ""

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let description: string = data["DescriptionText"]
    if (description.search(/picnic/i) == -1) {
      continue
    }
    let lat: number = parseFloat(data["Y"])
    let lng: number = parseFloat(data["X"])

    let objectID = data["ID"]

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": objectID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": objectID,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.comment": description,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat]
        }
      }, {
        "upsert": true,
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