import { Picnic } from "../../../models/Picnic";
import { capitalize, parseDataArcGIS } from "../../Download";

// Important Fields
const sourceName = "NSW Spatial Data Catalogue";
const dsName = "NSW Points of Interest";
const gisURL = "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer/0";
const licenseName = "Creative Commons Attribution 3.0 Australia";
const licenseURL = "https://creativecommons.org/licenses/by/3.0/au/legalcode";

parseDataArcGIS(dsName, gisURL, "poitype='Picnic Area'", "poiname,objectid", 1000, async (res: any[]) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res) {
    let comment: string;
    const name: string = data.attributes.poiname;
    if (name) {
      comment = "Located in " + capitalize(name) + ".";
    }
    const coordinates: any = [data.geometry.x, data.geometry.y];
    const objectid: any = data.attributes.objectid;

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
