import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Prince George's County Planning Department";
const dsName = "Picnic Areas";
const humanURL = "http://gisdata.pgplanning.org/arcgis/rest/services/Applications/Parks_and_Rec/MapServer/14";
const dsURL = "http://gisdata.pgplanning.org/arcgis/rest/services/Applications/Parks_and_Rec/MapServer/14/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

Download.parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res.features) {
    const lat: number = parseFloat(data.geometry.y);
    const lng: number = parseFloat(data.geometry.x);
    const objID = data.attributes.PARKID;

    let comment: string = "";
    if (data.attributes.DESCRIPTION) {
      comment = data.attributes.DESCRIPTION;
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
