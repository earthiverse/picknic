// Notes:
// * The website doesn't expose support for 'OR', but we use it in this script.

import Request = require("request-promise-native");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "City of Winnipeg";
const dsName = "Winnipeg Parks";
const humanURL = "https://parkmaps.winnipeg.ca/";
const dsURL = "https://parkmaps.winnipeg.ca/Search.ashx?exact=false&keyword=24%7C64&keyword_type=OR&latitude=0&longitude=0&addr_latitude=undefined&addr_longitude=undefined&radius=undefined";
const licenseName = "Unknown";
const licenseURL = "Unknown";

Download.parseDataJSON(dsName, dsURL, async (parks: any[]) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const park of parks) {
    const parkId = park.ID;
    const parkName = park.Name;

    const parkData = await Request({
      json: true,
      uri: "https://parkmaps.winnipeg.ca/POSInfo.ashx?park_id=" + parkId + "&keyword=24%7C64&keyword_type=AND",
    });
    console.log("Parsing " + parkName + "...");
    for (const asset of parkData.Assets) {
      let picnicShelter;
      if (asset.Type === "Picnic Shelter") {
        picnicShelter = true;
      } else if (asset.Type !== "Picnic Site") {
        // Not a picnic asset.
        continue;
      }

      const assetID = asset.ID;
      const lat = asset.Latitude;
      const lng = asset.Longitude;

      let comment;
      if (asset.InfoRecords) {
        if (asset.InfoRecords[0].InfoName && asset.InfoRecords[0].InfoValue) {
          comment = asset.InfoRecords[0].InfoName + " " + asset.InfoRecords[0].InfoValue;
        }
      }

      await Picnic.updateOne({
        "properties.source.dataset": dsName,
        "properties.source.id": assetID,
        "properties.source.name": sourceName,
      }, {
          $set: {
            "geometry.coordinates": [lng, lat],
            "geometry.type": "Point",
            "properties.comment": comment,
            "properties.license.name": licenseName,
            "properties.license.url": licenseURL,
            "properties.sheltered": picnicShelter,
            "properties.source.dataset": dsName,
            "properties.source.id": assetID,
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
