// TODO: This script is broken...
import Request = require("request-promise-native");
import Striptags = require("striptags");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Alberta Parks";
const dsName = "Camping by Activity Map";
const dsURL = "https://www.albertaparks.ca/albertaparksca/visit-our-parks/camping/by-activity-map/";
const licenseName = "Creative Commons Attribution-NonCommercial 4.0 International Public License";
const licenseURL = "https://creativecommons.org/licenses/by-nc/4.0/";

Download.parseDataString(dsName, dsURL, async (body: string) => {
  let numOps = 0;
  let retrieved = new Date();
  // Find the JSON in the code that represents the park data
  let parkData: any[];
  let matches1: RegExpExecArray = /var\s*sites\s*=\s*(\[[\s\S]*?\])/.exec(body);
  if (matches1 !== null) {
    // Found data (Probably)!
    // Put the array of parks in a simple JSON object so I can parse it to an actual object
    let data = JSON.parse("{\"data\":" + matches1[1] + "}");
    parkData = data.data;
  } else {
    console.log("Could not find the list of parks...");
    return numOps;
  }

  for (const park of parkData) {
    if (park.type.search("Picnic") === -1) {
      // No day-use picnicing spots
      continue;
    }
    console.log("Parsing " + park.label + "...");
    let parkURL = "https://www.albertaparks.ca" + park.url;
    // Load the park URL
    let body2 = await Request(parkURL);
    let siteData: any[];
    let matches2 = /var\s*sites\s*=\s*(\[[\s\S]*?\])\s*;/.exec(body2);
    if (matches2 !== null) {
      // Found data (Probably)!
      // Put the array of parks in a simple JSON object so I can parse it to an actual object
      let prepare = "{\"data\":" + matches1[1] + "}";
      // Regex to fix the relaxed JSON
      // from https://stackoverflow.com/questions/9637517/parsing-relaxed-json-without-eval
      prepare = prepare.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
      // Regex to fix the bad regex above (lol)
      // (there's a bug where if you use http:// or https:// it will malform the ':')
      prepare = prepare.replace(/http\": /g, "http:");
      // Regex to fix a weird bug on 'Canmore Nordic Centre Day Lodge'
      prepare = prepare.replace(/'VC'/g, "\"VC\"");
      prepare = prepare.replace(/\s+/g, " ");
      let data;
      try {
        data = JSON.parse(prepare);
        siteData = data.data;
      } catch (e) {
        console.log("----- ERROR -----");
        console.log(parkURL);
        console.log(park.label);
        console.log(body2);
        console.log(prepare);
        continue;
      }
    } else {
      console.log("Could not load data for " + park.label + ".");
      continue;
    }

    for (const site of siteData) {
      let facility = site.facility;
      if (facility !== "Day Use") {
        // Not a facility we care about
        continue;
      }
      let facilityURL = "https://www.albertaparks.ca" + site.link;
      let coordinates = site.latlng.reverse();
      let siteName = park.label + " - " + site.name;

      // TODO: Load park_url and see if the text "no picnic tables" appears on website.
      let body3 = await Request(facilityURL);
      // Check for references that this place has no picnic tables
      let noPicnicTablesRegex1 = /no picnic/i;
      let hasPicnicTables = (noPicnicTablesRegex1.exec(body3) == null);
      if (!hasPicnicTables) {
        // No picnic tables here :(
        continue;
      }
      // Check for any reference of picnic tables
      let noPicnicTablesRegex2 = /picnic/i;
      let doesntSpecifyPicnicTables = (noPicnicTablesRegex2.exec(body3) == null);
      if (doesntSpecifyPicnicTables) {
        // It could have picnic tables, but it probably doesn't...
        continue;
      }

      let notesRegex = /<div class=\"callout\">\s*<h4>notes<\/h4>([\s\S]*?)<\/div>/i;
      let m2 = notesRegex.exec(body3);
      let notes: string;
      if ((m2) !== null) {
        notes = Striptags(m2[1]).trim();
      }

      // Insert or Update Table
      await Picnic.updateOne({
        "properties.source.dataset": dsName,
        "properties.source.id": siteName,
        "properties.source.name": sourceName,
      }, {
          $set: {
            "geometry.coordinates": coordinates,
            "geometry.type": "Point",
            "properties.comment": notes,
            "properties.license.name": licenseName,
            "properties.license.url": licenseURL,
            "properties.source.dataset": dsName,
            "properties.source.id": siteName,
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
