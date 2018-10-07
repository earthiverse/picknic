import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "City of Toronto";
const dsName = "Outdoor Recreation Area";
const humanURL = "http://gis.toronto.ca/arcgis/rest/services/primary/cot_geospatial13_webm/MapServer/51/query";
const dsURL = "http://gis.toronto.ca/arcgis/rest/services/primary/cot_geospatial13_webm/MapServer/51/query?where=ASSETCATEGORY%3D1114&outFields=*&returnGeometry=true&outSR=4326&f=json";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

Download.parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res.features) {
    const lat: number = parseFloat(data.geometry.y);
    const lng: number = parseFloat(data.geometry.x);
    const objID = data.attributes.ASSET_ID;

    const name = data.attributes.ASSET_NAME;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": name,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objID,
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
