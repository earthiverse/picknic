import Fs = require("fs");
import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");
import { Picnic } from "../../../models/Picnic";

// Load Configuration
Nconf.file(Path.join(__dirname, "../../../../config.json"));
const mongoConfig = Nconf.get("mongo");

const dataOutputFolder = "../../../../source/data/";
const dataOutputFilename = "PicknicTables.jsonl";
const countriesJSON = dataOutputFolder + "_World/extract/geo-countries/data/countries.geojson";

Fs.readFile(countriesJSON, "utf8", async (error, jsonText) => {
  if (error) {
    console.error("Could not load the geojson file.", error);
    process.exit(1);
  }

  // Open Connection
  console.log("Connecting to MongoDB...");
  await Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true });
  Mongoose.set("useFindAndModify", false);

  const countries = JSON.parse(jsonText);
  for (const country of countries.features) {
    const countryName = country.properties.ADMIN;
    const countryGeoJSON = country.geometry;

    try {
      const tables: any = await Picnic.find({ "properties.source.name": "Picknic" })
        .where("geometry").within(countryGeoJSON).lean().exec();
      console.log(countryName + " - " + tables.length);

      if (tables.length > 0) {
        // There's tables!
        let jsonlOutput = "";
        for (const table of tables) {
          jsonlOutput += JSON.stringify(table) + "\n";
        }
        // TODO: Change this so the files go in the /CA/ directories, and such...
        // TODO: Backup is more important than getting this working, so I'm pushing this anyways...
        const exportPath = Path.join(dataOutputFolder, "_World", countryName + "_" + dataOutputFilename);
        Fs.writeFileSync(exportPath, jsonlOutput);
      }
    } catch (error) {
      console.error("Errored for " + countryName + "...");
    }
  }

  // Close Connection
  console.log("Disconnecting from MongoDB...");
  await Mongoose.disconnect();
});
