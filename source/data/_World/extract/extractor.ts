import Fs = require('fs')
import Path = require('path')
import Mongoose = require('mongoose')
import Nconf = require("nconf")

import { Picnic } from '../../../models/Picnic'

// Load Configuration
Nconf.file(Path.join(__dirname, "../../../../config.json"))
let mongoConfig = Nconf.get("mongo")

let data_output_folder = "../../../../source/data/"
let data_output_filename = "PicknicTables.jsonl"
let countries_json = data_output_folder + "_World/extract/geo-countries/data/countries.geojson"

let json_text = Fs.readFile(countries_json, "utf8", async function (error, json_text) {
  if (error) {
    console.error("Could not load the geojson file.", error)
    process.exit(1)
  }

  // Open Connection
  console.log("Connecting to MongoDB...")
  await Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true })
  Mongoose.set('useFindAndModify', false)

  let countries = JSON.parse(json_text)
  for (let country of countries.features) {
    let country_name = country.properties.ADMIN
    let country_geojson = country.geometry

    try {
      let tables = await Picnic.find({ "properties.source.name": "Picknic" }).where("geometry").within(country_geojson).lean().exec()
      console.log(country_name + " - " + tables.length)

      if (tables.length > 0) {
        // There's tables!
        let jsonl_output = ""
        for (let table of tables) {
          jsonl_output += JSON.stringify(table) + "\n"
        }
        // TODO: Change this so the files go in the /CA/ directories, and such...
        // TODO: Backup is more important than getting this working, so I'm pushing this anyways...
        let export_path = Path.join(data_output_folder, "_World", country_name + "_" + data_output_filename)
        Fs.writeFileSync(export_path, jsonl_output)
      }
    } catch (error) {
      console.error("Errored for " + country_name + "...")
    }
  }

  // Close Connection
  console.log("Disconnecting from MongoDB...")
  await Mongoose.disconnect()
})