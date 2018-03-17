import Request = require('request-promise-native')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "City of Winnipeg"
let dataset_name = "Winnipeg Parks"
let dataset_url_human = "https://parkmaps.winnipeg.ca/"
let dataset_url_json = "https://parkmaps.winnipeg.ca/Search.ashx?exact=false&keyword=24%7C64&keyword_type=OR&latitude=0&longitude=0&addr_latitude=undefined&addr_longitude=undefined&radius=undefined"
let license_name = "Unknown"
let license_url = "Unknown"

// First: Use this URL which gets the parks with picnic tables or shelters
// Fun fact: The website doesn't support 'OR', but we can exploit it here, lol.
// https://parkmaps.winnipeg.ca/Search.ashx?exact=false&keyword=24%7C64&keyword_type=OR&latitude=0&longitude=0&addr_latitude=undefined&addr_longitude=undefined&radius=undefined

// Second: Use the park IDs in the previous results with this URL format
// Then look for {"Type": "Picnic Shelter"} or {"Type": "Picnic Site"}
// https://parkmaps.winnipeg.ca/POSInfo.ashx?park_id=345&keyword=24%7C64&keyword_type=AND

Download.parseDataJSONAsync(dataset_name, dataset_url_json, async function (parks: any) {
  let database_updates: Array<any> = Array<any>(0)
  let retrieved = new Date()

  let parks2: any[] = []
  parks.forEach(function (park: any) {
    parks2.push({ parkId: park.ID, parkName: park.Name })
  });
  for (let i = 0; i < parks2.length; i++) {
    let park = parks2[i]
    let parkId = park.parkId
    let parkName = park.parkName

    let parkData = await Request({
      "uri": "https://parkmaps.winnipeg.ca/POSInfo.ashx?park_id=" + parkId + "&keyword=24%7C64&keyword_type=AND",
      "json": true
    })
    console.log("Parsing " + parkName + "...")
    parkData.Assets.forEach(function (asset: any) {
      let picnicShelter;
      let picnicTable;
      if (asset.Type == "Picnic Shelter") {
        picnicShelter = true;
      } else if (asset.Type == "Picnic Site") {
        picnicTable = true;
      } else {
        // Not a picnic asset.
        return;
      }

      let assetID = asset.ID
      let lat = asset.Latitude
      let lng = asset.Longitude

      let comment;
      if (asset.InfoRecords) {
        if (asset.InfoRecords[0].InfoName && asset.InfoRecords[0].InfoValue) {
          comment = asset.InfoRecords[0].InfoName + " " + asset.InfoRecords[0].InfoValue
        }
      }

      database_updates.push(Picnic.findOneAndUpdate({
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
        }).exec());
    })
  }

  return database_updates;
});
