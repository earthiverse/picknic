import { Picnic } from "../../../models/Picnic";
import { parseDataArcGIS } from "../../Download";

// Important Fields
const sourceName = "Gisborne District Council ArcGIS Server";
const dsName = "GDC Parks and Facilities";
const gisURL = "http://maps.gdc.govt.nz/arcgis/rest/services/Data/GDC_parks_facilities/MapServer/0";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

parseDataArcGIS(dsName, gisURL, "assettype LIKE 'Picnic%'", "compkey,comments,unitdesc", 1000, async (res: any[]) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res) {
    const coordinates = [data.geometry.x, data.geometry.y];
    const objID = data.attributes.CompKey;
    let comment = "";

    if (data.attributes.Comments) {
      comment = data.attributes.Comments;
    }
    if (data.attributes.UnitDesc) {
      if (comment !== "") {
        comment = comment + ". ";
      }
      comment = comment + data.attributes.UnitDesc + ".";

    }
    comment = comment.replace(/\s+/g, " ");

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
          "properties.type": "table",
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
