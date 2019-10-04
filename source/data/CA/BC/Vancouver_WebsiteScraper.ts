// NOTES:
// * I don't know how to license webscraping...
// * There is a zip file that contains the same information that I scrape here
//   ftp://webftp.vancouver.ca/opendata/csv/csv_parks_facilities.zip
//   but Request doesn't like ftp:// links, and I don't feel like adding another package for ftp just yet...

import Cheerio = require("cheerio");
import Request = require("request-promise-native");
import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "City of Vancouver";
const dsName = "Picnics in Vancouver's parks";
const dsHumanURL = "http://vancouver.ca/parks-recreation-culture/picnics.aspx";
const licenseName = "Unknown";
const licenseURL = "Unknown";

Download.parseDataString(dsName, dsHumanURL, async (body: string) => {
  let numOps = 0;
  let retrieved = new Date();

  let $ = Cheerio.load(body);
  let parks: any[] = [];
  $("table.collapse").find("tr").each(async (i) => {
    if (i === 0) {
      // Skip the table header
      return;
    }
    let columns = $(this).find("td");
    let siteName = columns.eq(0).text().trim();
    let parkLocationID = columns.eq(1).find("a").attr("href").slice(-4);
    let parkDetails = columns.eq(3).text().trim().replace(/[\n\r]+/g, ". ").replace(/\s+/g, " ").trim() + ".";
    parks.push({ siteName, parkLocationID, parkDetails });
  });

  for (const park of parks) {
    let siteName = park.siteName;
    let parkLocationID = park.parkLocationID;
    let parkDetails: string = park.siteName + ". " + park.parkDetails;

    // What's the opposite of not sheltered? Sheltered!
    let hasPicnicShelter = !/not\s+sheltered/i.test(parkDetails);

    console.log("Finding location for " + siteName + "...");
    const data = await Request({
      uri: "http://vanmapp1.vancouver.ca/googleKml/designated_picnic_locations/id/" + parkLocationID,
    }).then((body2: string) => {
      // Lol, KML...
      let result = /<coordinates>([\-.0-9]+),([\-.0-9]+)/.exec(body2);
      let lng = result[1];
      let lat = result[2];
      return [lng, lat];
    });

    let coordinates = data;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": parkLocationID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.comment": parkDetails,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.sheltered": hasPicnicShelter,
          "properties.source.dataset": dsName,
          "properties.source.id": parkLocationID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": dsHumanURL,
          "properties.type": "site",
          "type": "Feature",
        },
      }, {
        upsert: true,
      });
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
