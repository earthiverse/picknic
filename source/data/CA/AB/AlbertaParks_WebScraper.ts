import Mongoose = require('mongoose')
import Request = require('request-promise-native')
import Striptags = require('striptags')

import { Picnic } from '../../../models/Picnic'
import { Download } from '../../Download'

// Important Fields
let source_name = "Alberta Parks"
let dataset_name = "Camping by Activity Map"
let dataset_url_human = "https://www.albertaparks.ca/albertaparksca/visit-our-parks/camping/by-activity-map/"
let license_name = "Creative Commons Attribution-NonCommercial 4.0 International Public License"
let license_url = "https://creativecommons.org/licenses/by-nc/4.0/"

Download.parseDataString(dataset_name, dataset_url_human, async function (body: string) {
  let database_updates = 0
  let retrieved = new Date()
  // Find the JSON in the code that represents the park data
  let m: RegExpExecArray
  let park_data: Array<any>
  if ((m = /var\s*sites\s*=\s*(\[[\s\S]*?\])/.exec(body)) !== null) {
    // Found data (Probably)!
    // Put the array of parks in a simple JSON object so I can parse it to an actual object
    let data = JSON.parse("{\"data\":" + m[1] + "}")
    park_data = data.data
  } else {
    console.log("Could not find the list of parks...")
    return database_updates
  }

  for (let park of park_data) {
    if (park.type.search("Picnic") == -1) {
      // No day-use picnicing spots
      continue
    }
    console.log("Parsing " + park.label + "...")
    let park_url = "https://www.albertaparks.ca" + park.url
    // Load the park URL 
    let body = await Request(park_url)
    let site_data: Array<any>
    if ((m = /var\s*sites\s*=\s*(\[[\s\S]*?\])\s*;/.exec(body)) !== null) {
      // Found data (Probably)!
      // Put the array of parks in a simple JSON object so I can parse it to an actual object
      let prepare = "{\"data\":" + m[1] + "}"
      // Regex to fix the relaxed JSON from https://stackoverflow.com/questions/9637517/parsing-relaxed-json-without-eval
      prepare = prepare.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')
      // Regex to fix the bad regex above (lol)
      // (there's a bug where if you use http:// or https:// it will malform the ':')
      prepare = prepare.replace(/http\": /g, "http:")
      // Regex to fix a weird bug on 'Canmore Nordic Centre Day Lodge'
      prepare = prepare.replace(/'VC'/g, "\"VC\"")
      prepare = prepare.replace(/\s+/g, ' ')
      let data
      try {
        data = JSON.parse(prepare)
        site_data = data.data
      } catch (e) {
        console.log("----- ERROR -----")
        console.log(park_url)
        console.log(park.label)
        console.log(body)
        console.log(prepare)
        continue
      }
    } else {
      console.log("Could not load data for " + park.label + ".")
      continue
    }

    for (let site of site_data) {
      var facility = site.facility
      if (facility != "Day Use") {
        // Not a facility we care about
        continue
      }
      let facility_url = "https://www.albertaparks.ca" + site.link
      let coordinates = site.latlng.reverse()
      let site_name = park.label + " - " + site.name

      // TODO: Load park_url and see if the text "no picnic tables" appears on website.
      let body = await Request(facility_url)
      // Check for references that this place has no picnic tables
      const no_picnic_tables_regex_1 = /no picnic/i
      let has_picnic_tables = (no_picnic_tables_regex_1.exec(body) == null)
      if (!has_picnic_tables) {
        // No picnic tables here :(
        continue
      }
      // Check for any reference of picnic tables
      const no_picnic_tables_regex_2 = /picnic/i
      let doesnt_specify_picnic_tables = (no_picnic_tables_regex_2.exec(body) == null)
      if (doesnt_specify_picnic_tables) {
        // It could have picnic tables, but it probably doesn't...
        continue
      }

      const notes_regex = /<div class=\"callout\">\s*<h4>notes<\/h4>([\s\S]*?)<\/div>/i
      let m
      let notes: string
      if ((m = notes_regex.exec(body)) !== null) {
        notes = Striptags(m[1]).trim()
      }

      // Insert or Update Table
      await Picnic.updateOne({
        "properties.source.name": source_name,
        "properties.source.dataset": dataset_name,
        "properties.source.id": site_name
      }, {
          $set: {
            "type": "Feature",
            "properties.type": "site",
            "properties.source.retrieved": retrieved,
            "properties.source.name": source_name,
            "properties.source.dataset": dataset_name,
            "properties.source.id": site_name,
            "properties.source.url": dataset_url_human,
            "properties.license.name": license_name,
            "properties.license.url": license_url,
            "properties.comment": notes,
            "geometry.type": "Point",
            "geometry.coordinates": coordinates
          }
        }, {
          "upsert": true
        }).exec()
      database_updates += 1
    }
  }

  // Remove old tables from this data source
  await Picnic.deleteMany({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})