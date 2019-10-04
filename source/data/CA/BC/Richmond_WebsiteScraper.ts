// NOTES:
// This script is broken
// * I don't know how to license webscraping...

import Cheerio = require("cheerio");
import Nconf = require("nconf");
import Path = require("path");
import Request = require("request-promise-native");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Load configuration
Nconf.file(Path.join(__dirname, "../../../../config.json"));
const keysConfig = Nconf.get("keys");

// Missing @types for @google/maps.
// tslint:disable-next-line:no-var-requires
const googleMaps = require("@google/maps");
const googleMapsClient = googleMaps.createClient({
  Promise,
  key: keysConfig.public.googleMaps,
});

// Important Fields
const sourceName = "City of Richmond";
const dsName = "Parks Database and Search";
const dsHumanURL = "https://www.richmond.ca/parks/parks/about/amenities/default.aspx";
const licenseName = "Unknown";
const licenseURL = "Unknown";

// Load the page once to get all the good bits that are required to fulfil the search parameters...
Request(dsHumanURL).then((body: string) => {
  const $ = Cheerio.load(body);
  const eventArgument = $("#__EVENTARGUMENT").attr("value");
  const eventTarget = $("#__EVENTTARGET").attr("value");
  const eventValidation = $("#__EVENTVALIDATION").attr("value");
  const viewState = $("#__VIEWSTATE").attr("value");
  const viewStateGenerator = $("#__VIEWSTATEGENERATOR").attr("value");

  // Do the search with the attributes we got!
  Download.parseDataPostString(dsName, dsHumanURL, {
    __EVENTARGUMENT: eventArgument,
    __EVENTTARGET: eventTarget,
    __EVENTVALIDATION: eventValidation,
    __VIEWSTATE: viewState,
    __VIEWSTATEGENERATOR: viewStateGenerator,
    ctl00$pagecontent$btnSearch: "Search",
    ctl00$pagecontent$ddlAmenities: "7", // 7 is the lucky number for picnic tables!
    ctl00$pagecontent$ddlRecArea: "0",
    ctl00$pagecontent$ddlSpecFeature: "0",
    ctl00$pagecontent$txtParkName: "",
  }, async (body2: string) => {
    let numOps = 0;
    const retrieved = new Date();

    // Get the links to all the parks that contain picnic tables
    const C = Cheerio.load(body2);
    const parks: any[] = [];
    C(".subtitle").each(() => {
      const e = C(this);
      const parkName = e.text();
      const parkURL = e.find("a").attr("href");
      parks.push({ parkName, parkURL });
    });

    for (const park of parks) {
      // There's a park name with two spaces in the name for some reason, let's fix that...
      let parkName = park.parkName.replace(/\s+/, " ");
      let parkURL = park.parkURL;

      console.log("Parsing " + parkName + "...");
      let data = await Request("https://www.richmond.ca/parks/parks/about/amenities/" + parkURL)
        .then((body3: string) => {
          // Find the number of picnic tables at this park.
          let numPicnicTables2 = /class="subtitle">Picnic Tables[\s\S]+AmenitiesNumber">([0-9]+)/i.exec(body3)[1];
          let address2 = /maps\.google\.com\/maps\?q=(.+?)&/i.exec(body3)[1];

          return ({ numPicnicTables2, address2 });
        });

      let numPicnicTables = data.numPicnicTables2;
      let address = data.address2;

      let comment = parkName + ".";
      if (numPicnicTables === "1") {
        comment += " " + numPicnicTables + " picnic table.";
      } else if (numPicnicTables) {
        comment += " " + numPicnicTables + " picnic tables.";
      }

      let googleData = await googleMapsClient.geocode({
        address,
      }).asPromise();
      googleData = googleData.json.results[0];
      if (googleData) {
        let lat = googleData.geometry.location.lat;
        let lng = googleData.geometry.location.lng;

        await Picnic.updateOne({
          "properties.source.dataset": dsName,
          "properties.source.id": parkName,
          "properties.source.name": sourceName,
        }, {
            $set: {
              "geometry.coordinates": [lng, lat],
              "geometry.type": "Point",
              "properties.comment": comment,
              "properties.license.name": licenseName,
              "properties.license.url": licenseURL,
              "properties.source.dataset": dsName,
              "properties.source.id": parkName,
              "properties.source.name": sourceName,
              "properties.source.retrieved": retrieved,
              "properties.source.url": dsHumanURL,
              "properties.type": "site",
              "type": "Feature",
            },
          }, {
            upsert: true,
          }).lean().exec();
        numOps += 1;
      } else {
        console.log("Couldn't get a location from Google for " + parkName + "!");
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
});
