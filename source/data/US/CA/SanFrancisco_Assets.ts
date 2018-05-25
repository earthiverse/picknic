// NOTES:
// * This dataset could be grabbed directly from the ArcGIS server
// * https://rpdgis.sfgov.org/arcgis/rest/services/Production/SFRPD_Assets/FeatureServer/0/query?where=Asset_Type+%3D+%27Table%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=4326&gdbVersion=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=&resultOffset=&resultRecordCount=&f=html
// * It looks like there's a few more results on the ArcGIS server, too.

import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "SF OpenData"
let dataset_name = "Assets Maintained by the Recreation and Parks Department"
let dataset_url_human = "https://data.sfgov.org/Culture-and-Recreation/Assets-Maintained-by-the-Recreation-and-Parks-Depa/ays8-rxxc"
let dataset_url_csv = "https://data.sfgov.org/api/views/ays8-rxxc/rows.csv?accessType=DOWNLOAD"
let license_name = "ODC Public Domain Dedication and Licence (PDDL)"
let license_url = "http://opendatacommons.org/licenses/pddl/1.0/"

Download.parseDataString(dataset_name, dataset_url_csv, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of CSVParse(res, { columns: true, ltrim: true })) {
    let type: string = data["Asset Type"].toLowerCase()
    if (type != "table") {
      continue
    }
    let match: RegExpExecArray = /([\d\.-]+),\s([\d\.-]+)/.exec(data["Geom"])
    let lat: number = parseFloat(match[1])
    let lng: number = parseFloat(match[2])

    let asset_id = data["Asset ID"]
    let subtype: string = data["Asset Subtype"].toLowerCase()
    let map_label: string = data["Map Label"]
    let asset_name: string = data["Asset Name"]
    let quantity = data["Quantity"]

    let comment: string
    if (subtype == "picnic") {
      comment = "A picnic table."
    } else if (subtype == "half table") {
      comment = "A half table."
    } else {
      comment = "A table."
    }
    comment += " The dataset which this table was obtained from has the following information: \"Label: " + map_label + ", Asset Name: " + asset_name + ", Quantity: " + quantity + "\"."

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": asset_id
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": asset_id,
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