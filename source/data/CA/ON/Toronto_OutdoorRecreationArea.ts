import { Picnic } from "../../../models/Picnic";
import { parseDataArcGIS } from "../../Download";

// Important Fields
const sourceName = "City of Toronto";
const dsName = "Outdoor Recreation Area";
const gisURL = "http://gis.toronto.ca/arcgis/rest/services/primary/cot_geospatial13_webm/MapServer/51/query";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

parseDataArcGIS(dsName, gisURL, "ASSETCATEGORY=1114", "asset_id,asset_name", 1000, async (res: any[]) => {
  let numOps = 0;
  let retrieved = new Date();

  for (const data of res) {
    let coordinates: any = [data.geometry.x, data.geometry.y];
    let objID = data.attributes.ASSET_ID;
    let name = data.attributes.ASSET_NAME;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.comment": name,
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
