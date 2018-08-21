// NOTES:
// This script is a little different, because ARCGIS limits the # of returned results to 1000, and I make two passes to get them.
// Improvements could be made to read a tag that gets set in the first result that says it was limited, and continue (increment by 1000),
// but for now this is easier.

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase() })
}

// Important Fields
let source_name = "NSW Spatial Data Catalogue"
let dataset_name = "NSW Points of Interest"
let dataset_url_human = "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer"
let dataset_url_geojson_1 = "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer/0/query?where=poitype%3D%27Picnic+Area%27&outFields=poiname,objectid&returnGeometry=true&resultOffset=0&resultRecordCount=1000&f=json"
let dataset_url_geojson_2 = "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer/0/query?where=poitype%3D%27Picnic+Area%27&outFields=poiname,objectid&returnGeometry=true&resultOffset=1000&resultRecordCount=1000&f=json"
let license_name = "Creative Commons Attribution 3.0 Australia"
let license_url = "https://creativecommons.org/licenses/by/3.0/au/legalcode"

let retrieved = new Date()
let parsingFunction = async function (res: any) {
  let database_updates = 0

  for (let result of res.features) {
    let comment: string
    let name: string = result.attributes.poiname
    if (name) {
      comment = "Located in " + capitalize(name) + "."
    }
    let coordinates: any = [result.geometry.x, result.geometry.y]
    let objectid: any = result.attributes.objectid

    await Picnic.updateOne({
      "properties.source.dataset": dataset_name,
      "properties.source.url": dataset_url_human,
      "properties.source.id": objectid
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.id": objectid,
          "properties.source.url": dataset_url_human,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "geometry.type": "Point",
          "geometry.coordinates": coordinates
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
  await Download.parseDataJSON(dataset_name, dataset_url_geojson_1, parsingFunction)
  await Download.parseDataJSON(dataset_name, dataset_url_geojson_2, parsingFunction)
}
runSync()