import { Picnic } from "../../models/Picnic";
import { capitalize, parseDataArcGIS } from "../Download";

// Important Fields
const sourceName = "Bureau of Land Management";
const dsName = "Picnic Areas";
const gisURL = "https://gis.blm.gov/arcgis/rest/services/recreation/BLM_Natl_Recs_pts/MapServer/9";
const licenseName = "Unknown";
const licenseURL = "Unknown";

export async function parse(res: any[]) {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res) {
    let comment: string;
    const name: string = data.attributes.FET_NAME;
    if (name) {
      comment = "Located in " + capitalize(name) + ".";
    }
    const coordinates: any = [data.geometry.x, data.geometry.y];
    const objectid: string = data.attributes.Original_GlobalID;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectid,
      "properties.source.url": gisURL,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objectid,
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
}

if (require.main === module) {
  parseDataArcGIS(dsName, gisURL, "fet_type=4", "original_globalid,fet_name", 1000, parse);
}
