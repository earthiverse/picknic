import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Bristol ArcGIS Server";
const dsName = "Park Furniture";
const humanURL = "http://maps.bristol.gov.uk/arcgis/rest/services/ext/moving_home/FeatureServer/60";
const dsURL = "http://maps.bristol.gov.uk/arcgis/rest/services/ext/moving_home/FeatureServer/60/query?where=Type+%3D+'Picnic+Table'&outFields=*&returnGeometry=true&outSR=4326&f=json";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

Download.parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res.features) {
    const lat: number = parseFloat(data.geometry.y);
    const lng: number = parseFloat(data.geometry.x);
    const objID = data.attributes.ASSET_ID;
    let comment: string = data.attributes.SITE_NAME;

    if (data.attributes.LOCATION) {
      comment = ". " + data.attributes.LOCATION + ".";
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": humanURL,
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
