// NOTES:
// * This script is INCOMPLETE. This dataset includes A LOT OF DATA which overlaps with some of the tables found from other sources. 
//   I would like to look for nearby tables and remove (or not insert in the first place) if there's a table from another data source within 50 meters.
// * There is possibly more data in the tags that could be put in the comments on the table.

import Mongoose = require("mongoose")
import Nconf = require("nconf")
import Path = require("path")
const expat = require('node-expat')

import { Download } from '../Download'
import { Picnic } from '../../models/Picnic'

// Important Fields
let source_name = "Open Street Maps XAPI"
let dataset_name = "Open Street Maps"
let dataset_url_xml = "http://overpass-api.de/api/xapi?node[leisure=picnic_table]"
let license_name = "Open Data Commons Open Database License (ODbL)"
let license_url = "https://opendatacommons.org/licenses/odbl/"

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

Download.parseDataString(dataset_name, dataset_url_xml, async function (res: string) {
  let database_updates = 0
  let retrieved = new Date()

  await new Promise(function (resolve, reject) {
    var parser = new expat.Parser('UTF-8')

    let table: any = {}

    parser.on('startElement', async function (name: any, attributes: any) {
      if (name == "node") {
        // Start of table
        table = {
          "type": "Feature",
          "properties.type": "table",
          "properties.comment": "",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_xml,
          "properties.source.id": attributes.id,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "geometry": {
            "type": "Point",
            "coordinates": [attributes.lon, attributes.lat]
          }
        }
      } else if (name == "tag") {
        if (attributes.k == "backrest" && attributes.v == "yes") {
          table["properties.comment"] += " There is a backrest."
          table["properties.comment"] = table["properties.comment"].trimLeft()
        } else if (attributes.k == "material") {
          table["properties.comment"] += " The table is made of " + attributes.v + "."
          table["properties.comment"] = table["properties.comment"].trimLeft()
        } else if (attributes.k == "seats") {
          table["properties.comment"] += " There are " + attributes.v + " seats."
          table["properties.comment"] = table["properties.comment"].trimLeft()
        } else if ((attributes.k == "amenity" && attributes.v == "shelter") || (attributes.k = "covered" && attributes.v == "yes")) {
          table["properties.sheltered"] = true
        } else if (attributes.k == "name") {
          table["properties.comment"] = attributes.v + ". " + table["properties.comment"]
          table["properties.comment"] = table["properties.comment"].trimRight()
        } else if (attributes.k == "colour") {
          table["properties.comment"] += " There table is " + attributes.v + "."
          table["properties.comment"] = table["properties.comment"].trimLeft()
        } else if (attributes.k && attributes.k.startsWith("description")) {
          // TODO: Comment languages eventually...
          table["properties.comment"] = attributes.v + ". " + table["properties.comment"]
          table["properties.comment"] = table["properties.comment"].trimRight()
        } else if (attributes.k == "bin" && attributes.v == "yes") {
          table["properties.comment"] += " There is a waste basket near the table."
          table["properties.comment"] = table["properties.comment"].trimLeft()
        }
      }
    })
    parser.on('endElement', async function (name: any) {
      if (name == "node") {
        // End of table
        parser.stop()
        // Look if there's already a table from a different source in our database. If there is, don't add this one!
        let near_table = await Picnic.findOne({
          "properties.source.name": {
            $ne: "Open Street Maps XAPI"
          },
          "geometry": {
            $near: {
              $geometry: table.geometry,
              $maxDistance: 50 // We're checking within 50 meters.
            }
          }
        }).lean().exec()
        if (!near_table) {
          // There were no nearby tables, so let's add it!
          await Picnic.updateOne({
            "properties.source.name": source_name,
            "properties.source.dataset": dataset_name,
            "properties.source.id": table["properties.source.id"]
          }, {
              $set: table
            }, {
              upsert: true
            }).lean().exec()
          database_updates += 1
        }
        parser.resume()
      } else if (name == "osm") {
        // End of document
        resolve()
      }
    })

    parser.write(res)
  })

  return database_updates
})