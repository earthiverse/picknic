// Notes:
// * The website doesn't expose support for 'OR', but we use it in this script.

import Request = require('request-promise-native')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "City of Winnipeg"
let dataset_name = "Winnipeg Parks"
let dataset_url_human = "https://parkmaps.winnipeg.ca/"
let dataset_url_json = "https://parkmaps.winnipeg.ca/Search.ashx?exact=false&keyword=24%7C64&keyword_type=OR&latitude=0&longitude=0&addr_latitude=undefined&addr_longitude=undefined&radius=undefined"
let license_name = "Unknown"
let license_url = "Unknown"

Download.parseDataJSON(dataset_name, dataset_url_json, async function (parks: any[]) {
  let database_updates = 0
  let retrieved = new Date()

  for (let park of parks) {
    let parkId = park.ID
    let parkName = park.Name

    let parkData = await Request({
      "uri": "https://parkmaps.winnipeg.ca/POSInfo.ashx?park_id=" + parkId + "&keyword=24%7C64&keyword_type=AND",
      "json": true
    })
    console.log("Parsing " + parkName + "...")
    for (let asset of parkData.Assets) {
      let picnicShelter
      if (asset.Type == "Picnic Shelter") {
        picnicShelter = true
      } else if (asset.Type != "Picnic Site") {
        // Not a picnic asset.
        continue
      }

      let assetID = asset.ID
      let lat = asset.Latitude
      let lng = asset.Longitude

      let comment
      if (asset.InfoRecords) {
        if (asset.InfoRecords[0].InfoName && asset.InfoRecords[0].InfoValue) {
          comment = asset.InfoRecords[0].InfoName + " " + asset.InfoRecords[0].InfoValue
        }
      }

      await Picnic.updateOne({
        "properties.source.name": source_name,
        "properties.source.dataset": dataset_name,
        "properties.source.id": assetID
      }, {
          $set: {
            "type": "Feature",
            "properties.type": "site",
            "properties.source.retrieved": retrieved,
            "properties.source.name": source_name,
            "properties.source.dataset": dataset_name,
            "properties.source.url": dataset_url_human,
            "properties.source.id": assetID,
            "properties.license.name": license_name,
            "properties.license.url": license_url,
            "properties.sheltered": picnicShelter,
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
