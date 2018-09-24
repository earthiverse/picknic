import Fs = require('fs')
import Path = require('path')
import Mongoose = require('mongoose')
import Nconf = require("nconf")
let Mapshaper = require("mapshaper")

import { Picnic } from '../../../models/Picnic'

// Load Configuration
Nconf.file(Path.join(__dirname, "../../../../config.json"))
let mongoConfig = Nconf.get("mongo")

let data_output_folder = "../../../../source/data/JP"
let data_output_filename = "PicknicTables.jsonl"
let prefectures_json_folder = data_output_folder + "/extract/JapanCityGeoJson/geojson/prefectures"

Fs.readdir(prefectures_json_folder, async function (error, filenames) {
  if (error) {
    console.error("Could not list the directory.", error)
    process.exit(1)
  }

  // Open Connection
  console.log("Connecting to MongoDB...")
  await Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true })

  // Go through all the prefecture's JSON, and query for tables inside it
  for (let filename of filenames) {
    let file_extension = Path.extname(filename)
    let file_number = filename.slice(0, 2)
    if (file_extension != ".json" || file_number == "ho") {
      continue
    }

    let file_path = Path.join(prefectures_json_folder, filename)
    let geojson_text = Fs.readFileSync(file_path, "utf8")

    let geojson = JSON.parse(geojson_text)

    // Run the geojson through Mapshaper to simplify it and bring it under the 16mb for Mongoose.
    let simplifyMap = new Promise(function (resolve, reject) {
      Mapshaper.applyCommands('-i a.json -dissolve -simplify 10% -clean -o', { 'a.json': geojson }, async function (err: any, output: any) {
        if (err) {
          console.log(err)
          reject()
        }
        let simplified_geojson = JSON.parse(output['a.json'])
        let tables = await Picnic.find({ "properties.source.name": "Picknic" }).where("geometry").within(simplified_geojson.geometries[0]).lean().exec()
        console.log(file_number + " - " + tables.length)

        if (tables.length > 0) {
          // There's tables!
          let jsonl_output = ""
          for (let table of tables) {
            jsonl_output += JSON.stringify(table) + "\n"
          }
          let export_path = Path.join(data_output_folder, data_output_filename)
          Fs.writeFileSync(export_path, jsonl_output)
        }

        resolve()
      })
    })
    await simplifyMap
  }

  // Close Connection
  console.log("Disconnecting from MongoDB...")
  await Mongoose.disconnect()
})