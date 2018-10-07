import Fs = require("fs");
// TODO: There is no @types/mapshaper, so until then we will disable the warning.
// tslint:disable-next-line:no-var-requires
const Mapshaper = require("mapshaper");
import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");

import { Picnic } from "../../../models/Picnic";

// Load Configuration
Nconf.file(Path.join(__dirname, "../../../../config.json"));
const mongoConfig = Nconf.get("mongo");

const dataOutputFolder = "../../../../source/data/JP";
const dataOutputFilename = "PicknicTables.jsonl";
const prefecturesJSONFolder = dataOutputFolder + "/extract/JapanCityGeoJson/geojson/prefectures";

Fs.readdir(prefecturesJSONFolder, async (error, filenames) => {
  if (error) {
    console.error("Could not list the directory.", error);
    process.exit(1);
  }

  // Open Connection
  console.log("Connecting to MongoDB...");
  await Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true });

  // Go through all the prefecture's JSON, and query for tables inside it
  for (const filename of filenames) {
    const fileExt = Path.extname(filename);
    const fileNum = filename.slice(0, 2);
    if (fileExt !== ".json" || fileNum === "ho") {
      continue;
    }

    const filePath = Path.join(prefecturesJSONFolder, filename);
    const geoJSONText = Fs.readFileSync(filePath, "utf8");
    const geojson = JSON.parse(geoJSONText);

    // Run the geojson through Mapshaper to simplify it and bring it under the 16mb for Mongoose.
    const simplifyMap = new Promise((resolve, reject) => {
      Mapshaper.applyCommands("-i a.json -dissolve -simplify 10% -clean -o",
        { "a.json": geojson }, async (err: any, output: any) => {
          if (err) {
            console.log(err);
            reject();
          }
          const simpleGeoJSON = JSON.parse(output["a.json"]);
          const tables: any = await Picnic.find({ "properties.source.name": "Picknic" })
            .where("geometry").within(simpleGeoJSON.geometries[0]).lean().exec();
          console.log(fileNum + " - " + tables.length);

          if (tables.length > 0) {
            // There's tables!
            let jsonlOutput = "";
            for (const table of tables) {
              jsonlOutput += JSON.stringify(table) + "\n";
            }
            const exportPath = Path.join(dataOutputFolder, dataOutputFilename);
            Fs.writeFileSync(exportPath, jsonlOutput);
          }

          resolve();
        });
    });
    await simplifyMap;
  }

  // Close Connection
  console.log("Disconnecting from MongoDB...");
  await Mongoose.disconnect();
});
