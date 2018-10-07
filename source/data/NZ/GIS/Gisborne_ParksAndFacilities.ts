import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Gisborne District Council ArcGIS Server";
const dsName = "GDC Parks and Facilities";
const humanURL = "http://maps.gdc.govt.nz/arcgis/rest/services/Data/GDC_parks_facilities/MapServer/0";
const dsURL = "http://maps.gdc.govt.nz/arcgis/rest/services/Data/GDC_parks_facilities/MapServer/0/query?where=AssetType+LIKE+'Picnic%25'&outFields=*&returnGeometry=true&outSR=4326&f=json";
const licenseName = "Unknown";
const licenseURL = "Unknwon";

Download.parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res.features) {
    const lat: number = parseFloat(data.geometry.y);
    const lng: number = parseFloat(data.geometry.x);
    const objID = data.attributes.CompKey;
    let comment: string = "";

    if (data.attributes.Comments) {
      comment = data.attributes.Comments;
    }
    if (data.attributes.UnitDesc) {
      if (comment !== "") {
        comment = comment + ". ";
      }
      comment = comment + data.attributes.UnitDesc + ".";

    }
    comment = comment.replace(/\s+/g, " ");

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
