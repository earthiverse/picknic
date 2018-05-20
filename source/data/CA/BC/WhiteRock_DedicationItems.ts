import Proj4 = require('proj4')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase() })
}

// Important Fields
let source_name = "City of White Rock Open Data Portal"
let dataset_name = "Dedication Items"
let dataset_url_human = "http://data.whiterockcity.ca/dataset/parkitem"
let dataset_url_geojson = "http://wroms.whiterockcity.ca/opendata/GIS/Data/Spatial/Parks/JSON/ParkItem.json"
let license_name = "Open Government License - British Columbia"
let license_url = "https://www2.gov.bc.ca/gov/content/data/open-data/open-government-license-bc"

Download.parseDataJSON(dataset_name, dataset_url_geojson, async function (res: any) {
  let database_updates = 0
  let retrieved = new Date()

  for (let park_item of res.features) {
    let type: string = park_item.properties.Item_Type
    let item_id: string = park_item.properties.Item_Id
    if (type != "PICNIC TABLE") {
      continue
    }
    // The data for this dataset is in EPSG:26910.
    // See: http://spatialreference.org/ref/epsg/nad83-utm-zone-10n/
    let coordinates: any = Proj4("+proj=utm +zone=10 +ellps=GRS80 +datum=NAD83 +units=m +no_defs", "WGS84", park_item.geometry.coordinates)
    let park_name: string = park_item.properties.Park_Name.trim()
    let comment: string
    if (park_name) {
      comment = "Located in " + capitalize(park_name) + "."
    }

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": item_id
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.id": item_id,
          "properties.source.url": dataset_url_human,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.comment": comment,
          "geometry.type": "Point",
          "geometry.coordinates": coordinates
        }
      }, {
        upsert: true
      })
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