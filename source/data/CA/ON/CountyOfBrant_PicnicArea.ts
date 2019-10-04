import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");
import { parseDataArcGIS } from "../../Download";

// Important Fields
const sourceName = "County of Brant";
const dsName = "Picnic Area";
const gisURL = "http://maps.brant.ca/arcgis/rest/services/PublicData/OutdoorAdventure/MapServer/16";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

parseDataArcGIS(dsName, gisURL, "1=1", "*", 1000, async (res: any[]) => {
  let numOps = 0;
  let retrieved = new Date();

  for (const data of res) {
    let coordinates: any = [data.geometry.x, data.geometry.y];
    let objID = data.attributes.GLOBALID;

    let comment: string;
    let material = data.attributes.MATERIAL;
    if (material === "1") {
      comment = "The table is made of metal.";
    } else if (material === "2") {
      comment = "The table is made of wood.";
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": gisURL,
          "properties.type": "site",
          "type": "Feature",
        },
      }, {
        upsert: true,
      }).exec();
    numOps += 1;
  }

  // Remove old tables from this data source
  await Picnic.deleteMany({
    "properties.source.dataset": dsName,
    "properties.source.name": sourceName,
    "properties.source.retrieved": { $lt: retrieved },
  }).lean().exec();
  numOps += 1;

  return numOps;
});
