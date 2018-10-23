import { Picnic } from "../../../models/Picnic";
import { parseDataArcGIS } from "../../Download";

// Important Fields
const sourceName = "City of Peterborough";
const dsName = "Picnic";
const gisURL = "http://maps.peterborough.ca/arcgis/rest/services/External/Operational/MapServer/20";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

parseDataArcGIS(dsName, gisURL, "1=1", "objectid", 1000, async (res: any[]) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res) {
    const coordinates: number[] = data.geometry.points[0];
    const objID = data.attributes.OBJECTID;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
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
