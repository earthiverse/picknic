// TODO: I changed the double equals (==) to triple equals (===) for the string comparisons,
// but it returned zero objects. I'm guessing 'name' might not really be a string.

// TODO: Remove the older tables after adding the new ones.
// It's not feasible to fix other packages at the moment. Need @types/node-expat.
// tslint:disable-next-line:no-var-requires
const expat = require("node-expat");
import { Picnic } from "../../models/Picnic";
import Download = require("../Download");

// Important Fields
const sourceName = "Open Street Maps XAPI";
const datasetName = "Open Street Maps";
const datasetURL = "http://overpass-api.de/api/xapi?node[leisure=picnic_table]";
const licenseName = "Open Data Commons Open Database License (ODbL)";
const licenseURL = "https://opendatacommons.org/licenses/odbl/";

Download.parseDataString(datasetName, datasetURL, async (res: string) => {
  let numUpdates = 0;
  const retrieved = new Date();

  await new Promise((resolve) => {
    const parser = new expat.Parser("UTF-8");

    let table: any = {};

    parser.on("startElement", async (name: string, attributes: any) => {
      if (name == "node") {
        // Start of table
        table = {
          "geometry": {
            coordinates: [attributes.lon, attributes.lat],
            type: "Point",
          },
          "properties.comment": "",
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": datasetName,
          "properties.source.id": attributes.id,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": datasetURL,
          "properties.type": "table",
          "type": "Feature",
        };
      } else if (name == "tag") {
        if (attributes.k == "backrest" && attributes.v == "yes") {
          table["properties.comment"] += " There is a backrest.";
          table["properties.comment"] = table["properties.comment"].trimLeft();
        } else if (attributes.k == "material") {
          table["properties.comment"] += " The table is made of " + attributes.v + ".";
          table["properties.comment"] = table["properties.comment"].trimLeft();
        } else if (attributes.k == "seats") {
          table["properties.comment"] += " There are " + attributes.v + " seats.";
          table["properties.comment"] = table["properties.comment"].trimLeft();
        } else if ((attributes.k == "amenity" && attributes.v == "shelter")
          || (attributes.k == "covered" && attributes.v == "yes")) {
          table["properties.sheltered"] = true;
        } else if (attributes.k == "name") {
          table["properties.comment"] = attributes.v + ". " + table["properties.comment"];
          table["properties.comment"] = table["properties.comment"].trimRight();
        } else if (attributes.k == "colour") {
          table["properties.comment"] += " There table is " + attributes.v + ".";
          table["properties.comment"] = table["properties.comment"].trimLeft();
        } else if (attributes.k && attributes.k.startsWith("description")) {
          // TODO: Comment languages eventually...
          table["properties.comment"] = attributes.v + ". " + table["properties.comment"];
          table["properties.comment"] = table["properties.comment"].trimRight();
        } else if (attributes.k == "bin" && attributes.v == "yes") {
          table["properties.comment"] += " There is a waste basket near the table.";
          table["properties.comment"] = table["properties.comment"].trimLeft();
        }
      }
    });
    parser.on("endElement", async (name: string) => {
      if (name == "node") {
        // End of table
        parser.stop();
        // Look if there's already a table from a different source in our database. If there is, don't add this one!
        const nearTable = await Picnic.findOne({
          "geometry": {
            $near: {
              $geometry: table.geometry,
              $maxDistance: 50, // We're checking within 50 meters.
            },
          },
          "properties.source.name": {
            $ne: "Open Street Maps XAPI",
          },
        }).lean().exec();
        if (!nearTable) {
          // There were no nearby tables, so let's add it!
          await Picnic.updateOne({
            "properties.source.dataset": datasetName,
            "properties.source.id": table["properties.source.id"],
            "properties.source.name": sourceName,
          }, {
              $set: table,
            }, {
              upsert: true,
            }).lean().exec();
          numUpdates += 1;
        }
        parser.resume();
      } else if (name == "osm") {
        // End of document
        resolve();
      }
    });

    parser.write(res);
  });

  return numUpdates;
});
