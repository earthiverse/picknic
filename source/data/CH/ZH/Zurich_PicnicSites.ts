// NOTES:
// * This dataset has no ID field identifying individual picnic tables (as of 2018-05-14)

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Stadt Zürich Open Data"
let dataset_name = "Picknickplatz"
let dataset_url_human = "https://data.stadt-zuerich.ch/dataset/picknickplatz"
let dataset_url_json = "https://data.stadt-zuerich.ch/dataset/picknickplatz/resource/b533a584-6cd8-460c-8c3f-5b71cd0207ca/download/picknickplatz.json"
let license_name = "CC0 1.0 Universal"
let license_url = "https://creativecommons.org/publicdomain/zero/1.0/"

Download.parseDataJSON(dataset_name, dataset_url_json, async function (res: any) {
  let database_updates = 0
  let retrieved = new Date()

  for (let feature of res.features) {
    // Slice, because there's a third coordinate for elevation that is set to zero in this dataset
    let coordinates = feature.geometry.coordinates.slice(0, 2)

    let comment: string = "name: " + feature.properties.name + ". "
    if (feature.properties.anlageelemente) {
      comment += "anlageelemente: " + feature.properties.anlageelemente + ". "
    }
    let infrastruktur = feature.properties.infrastruktur.replace(/;/g, '').replace(/_/g, ',')
    if (infrastruktur) {
      comment += "infrastruktur: " + infrastruktur + "."
    }
    comment.trimRight()

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "geometry.coordinates": coordinates
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.comment": comment,
          "geometry.type": "Point",
          "geometry.coordinates": coordinates
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