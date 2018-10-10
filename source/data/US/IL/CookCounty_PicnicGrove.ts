import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Cook County Government";
const dsName = "Picnic Grove";
// NOTE: This server has old ArcGIS software that doesn't support pagination, meaning we can't use parseDataArcGIS...
const gisURL = "http://cookviewer1.cookcountyil.gov/ArcGIS/rest/services/cookVwrDynmc/MapServer/7";
const dsURL1 = "http://cookviewer1.cookcountyil.gov/ArcGIS/rest/services/cookVwrDynmc/MapServer/7/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json";
const dsURL2 = "http://cookviewer1.cookcountyil.gov/ArcGIS/rest/services/cookVwrDynmc/MapServer/7/query?where=OBJECTID>%3D500&outFields=*&returnGeometry=true&outSR=4326&f=json";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

const retrieved = new Date();
const parsingFunction = async (res: any) => {
  let numOps = 0;

  for (const data of res.features) {
    const lat: number = parseFloat(data.geometry.y);
    const lng: number = parseFloat(data.geometry.x);
    const objectID = data.attributes.OBJECTID;

    let comment: string = "This is a picnic \"grove\", there may be no tables here.";
    if (data.attributes.Capacity) {
      comment += " There is room for approximately " + data.attributes.Capacity + " people to picnic.";
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objectID,
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
};

const runSync = async () => {
  await Download.parseDataJSON(dsName, dsURL1, parsingFunction);
  await Download.parseDataJSON(dsName, dsURL2, parsingFunction);
};
runSync();
