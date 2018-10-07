import { Picnic } from "../../models/Picnic";
import { parseDataJSON } from "../Download";

// Important Fields
const sourceName = "Government of Canada Open Government Portal";
const dsName = "Parks Canada Facilities";
const humanURL = "http://open.canada.ca/data/en/dataset/3969368d-33b5-47c8-8953-f31b15d8e007";
const dsURL = "http://opendata.arcgis.com/datasets/90d9d985c73545ff9c6b88ddf19b48ff_0.geojson";
const licenseName = "Open Government License - Canada (Version 2.0)";
const licenseURL = "http://open.canada.ca/en/open-government-licence-canada";

parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const feature of res.features) {
    // Check if it's a picnic table first
    if (!feature.properties.Facility_Type_Installation ||
      feature.properties.Facility_Type_Installation.search(/Picnic/i) === -1) {
      continue;
    }
    const coordinates = feature.geometry.coordinates;
    const objectID = feature.properties.OBJECTID;
    let accessible: boolean;
    if (feature.properties.Accessible.search(/Yes/i) >= 0) {
      accessible = true;
    } else if (feature.properties.Accessible) {
      accessible = false;
    }
    let comment: string;
    if (feature.properties.Name_e) {
      comment = feature.properties.Name_e;
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.accessible": accessible,
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objectID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": humanURL,
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
