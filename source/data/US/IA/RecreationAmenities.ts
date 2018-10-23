import { Picnic } from "../../../models/Picnic";
import { parseDataArcGIS } from "../../Download";

// Important Fields
const sourceName = "Iowa ArcGIS Server";
const dsName = "Recreation Amenities";
const gisURL = "https://programs.iowadnr.gov/geospatial/rest/services/Recreation/Recreation/MapServer/8";
const licenseName = "Unknown";
const licenseURL = "";

parseDataArcGIS(dsName, gisURL, "Type%3D'Picnic+Area'", "OBJECTID", 1000, async (res: any[]) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res) {
    const coordinates = [data.geometry.x, data.geometry.y];
    const objectID = data.OBJECTID;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objectID,
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
