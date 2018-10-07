import Cheerio = require("cheerio");
import Nconf = require("nconf");
import Path = require("path");
import Request = require("request-promise-native");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Load configuration
Nconf.file(Path.join(__dirname, "../../../../config.json"));
const keysConfig = Nconf.get("keys");

const googleMapsClient = require("@google/maps").createClient({
  Promise,
  key: keysConfig.public.googleMaps,
});

// Important Fields
const sourceName = "City of Redmond";
const dsName = "Parks & Trails";
const dsURL = "http://www.redmond.gov/cms/One.aspx?portalId=169&pageId=676";
const licenseName = "Unknown";
const licenseURL = "Unknown";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  // TODO: Find park links
  const $ = Cheerio.load(res);
  const urls: string[] = [];
  $(".parksListNav").find("a").each(() => {
    const e = $(this);
    const href = e.attr("href");
    urls.push("http://www.redmond.gov/cms/" + href);
  });
  for (const url of urls) {
    let parkName: string;
    let hasPicnicTable: boolean;
    let hasPicnicShelter: boolean;

    let failedURL = false;
    let noPicnicTables = false;
    const googleResponse = await Request({
      uri: url,
    }).then((body: string) => {
      const $2 = Cheerio.load(body);
      // Check if it mentions picnic related ammenities
      parkName = $2("#pagetitle").text();
      const mainContent = $2("#main-content").text();
      hasPicnicTable = /picnic\s+table/i.test(mainContent);
      hasPicnicShelter = /picnic\s+shelter/i.test(mainContent);

      if (hasPicnicTable || hasPicnicShelter) {
        // Get the location of the park from Google.
        return googleMapsClient.geocode({
          address: parkName + " Redmond, WA, USA",
        }).asPromise();
      } else {
        noPicnicTables = true;
      }
    }).catch(() => {
      failedURL = true;
    });

    if (googleResponse) {
      const result = googleResponse.json.results[0];
      const lat = result.geometry.location.lat;
      const lng = result.geometry.location.lng;

      console.log(parkName + " was OK!");
      await Picnic.updateOne({
        "properties.source.dataset": dsName,
        "properties.source.id": parkName,
        "properties.source.name": sourceName,
      }, {
          $set: {
            "geometry.coordinates": [lng, lat],
            "geometry.type": "Point",
            "properties.comment": parkName,
            "properties.license.name": licenseName,
            "properties.license.url": licenseURL,
            "properties.sheltered": hasPicnicShelter,
            "properties.source.dataset": dsName,
            "properties.source.id": parkName,
            "properties.source.name": sourceName,
            "properties.source.retrieved": retrieved,
            "properties.source.url": dsURL,
            "properties.type": "site",
            "type": "Feature",
          },
        }, {
          upsert: true,
        }).exec();
      numOps += 1;
    } else {
      if (noPicnicTables) {
        console.log(parkName + " has no picnic tables.");
      } else if (failedURL) {
        console.log("----- Failure -----");
        console.log("Failed to retrieve " + url);
      } else {
        console.log("----- Failure -----");
        console.log("Failed to parse " + parkName);
        console.log(JSON.stringify(googleResponse, null, 2));
      }
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
