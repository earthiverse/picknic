import CSVParse = require('csv-parse/lib/sync')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "Colorado Parks and Wildlife Atlas"
let dataset_name = "Picnic Area"
let dataset_url_human = "http://ndismaps.nrel.colostate.edu/arcgis/rest/services/FishingAtlas/CFA_AnglerBase_Map/MapServer/49"
let dataset_url_json = "http://ndismaps.nrel.colostate.edu/arcgis/rest/services/FishingAtlas/CFA_AnglerBase_Map/MapServer/49/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json"
let license_name = "Copyright CPW Technicians and GIS staff, Chris Johnson, Eric Drummond, Bill Gaertner, and Matt Schulz."
let license_url = "Unknwon"

Download.parseDataJSON(dataset_name, dataset_url_json, async function (res: any) {
  let database_updates = 0
  let retrieved = new Date()

  for (let data of res.features) {
    let lat: number = parseFloat(data.geometry.y)
    let lng: number = parseFloat(data.geometry.x)
    let object_id = data.attributes.GlobalID

    let accessible: boolean
    if (data.attributes.HANDI_ACCESS == "Yes") {
      accessible = true
    }

    let comment: string = ""
    if (data.attributes.COMMENTS) {
      comment = data.attributes.COMMENTS
    }
    let propname: string = data.attributes.PROPNAME
    if (propname) {
      comment += " Located in " + propname + "."
    }
    let fac_name: string = data.attributes.FAC_NAME
    if (fac_name && fac_name.trim()) {
      comment += " Located at " + fac_name + "."
    }
    let material = data.attributes.MATERIAL
    if (material == "1") {
      comment += " The table is made of metal."
    } else if (material == "2") {
      comment += " The table is made of wood."
    }
    comment = comment.trimLeft()

    let sheltered: boolean
    if (data.attributes.TYPE_DETAIL == "Sheltered" || (fac_name && fac_name.search("Sheltered"))) {
      sheltered = true
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
          "properties.accessible": accessible,
          "properties.sheltered": sheltered,
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