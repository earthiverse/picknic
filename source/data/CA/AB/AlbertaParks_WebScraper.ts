// NOTE: This script has some major flaws.
// Well, all scripts do, but this one more-so...
// Look at all the 'j's and you'll wonder what the heck I was thinking...
import Mongoose = require('mongoose');
import Request = require('request');
import Striptags = require('striptags');

import { Picnic } from '../../../models/Picnic';

Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "Alberta Parks"
let dataset_name = "N/A"
let dataset_url_human = "https://www.albertaparks.ca/albertaparksca/visit-our-parks/camping/by-activity-map/"
let license_name = "Creative Commons Attribution-NonCommercial 4.0 International Public License"
let license_url = "https://creativecommons.org/licenses/by-nc/4.0/"

let j = 0;
let success = 0;
let fail = 0;
Request(dataset_url_human, function (error: boolean, response: any, body: string) {
  // Find the JSON in the code that represents the park data
  const park_list_regex = /var\s*sites\s*=\s*(\[[\s\S]*?\])/;
  let m: RegExpExecArray;
  let park_data: Array<any>;
  if ((m = park_list_regex.exec(body)) !== null) {
    // Found data (Probably)!
    // Put the array of parks in a simple JSON object so I can parse it to an actual object
    let data = JSON.parse("{\"data\":" + m[1] + "}");
    park_data = data.data;
  } else {
    console.log("Could not find the list of parks...")
    Mongoose.disconnect();
    return;
  }
  park_data.forEach(function (park: any) {
    let type = park.type;
    if (type.search("Picnic") == -1) {
      // No day-use picnicing spots
      return;
    }
    let park_name = park.label;
    let park_url = "https://www.albertaparks.ca" + park.url;
    // Load the park URL 
    let retrieved = new Date();
    Request(park_url, function (error: boolean, response: any, body: string) {
      const site_list_regex = /var\s*sites\s*=\s*(\[[\s\S]*?\])\s*;/;
      let site_data: Array<any>;
      if ((m = site_list_regex.exec(body)) !== null) {
        // Found data (Probably)!
        // Put the array of parks in a simple JSON object so I can parse it to an actual object
        let prepare = "{\"data\":" + m[1] + "}";
        // Regex to fix the relaxed JSON from https://stackoverflow.com/questions/9637517/parsing-relaxed-json-without-eval
        prepare = prepare.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
        // Regex to fix the bad regex above (lol)
        // (there's a bug where if you use http:// or https:// it will malform the ':')
        prepare = prepare.replace(/http\": /g, "http:");
        // Regex to fix a weird bug on 'Canmore Nordic Centre Day Lodge'
        prepare = prepare.replace(/'VC'/g, "\"VC\"");
        let data;
        try {
          data = JSON.parse(prepare);
        } catch (e) {
          console.log("----- ERROR -----");
          console.log(prepare);
        }
        site_data = data.data;
      } else {
        console.log("Could not load data for " + park_name + ".");
        return;
      }
      // console.log("----- PARK -----");
      // console.log(park);
      site_data.forEach(function (site: any) {
        var facility = site.facility;
        if (facility != "Day Use") {
          // Not a facility we care about
          return;
        }
        j += 1;
        let facility_url = "https://www.albertaparks.ca" + site.link;
        let coordinates = (site.latlng as Array<number>).reverse();
        let site_name = park_name + " - " + site.name;

        // TODO: Load park_url and see if the text "no picnic tables" appears on website.
        Request(facility_url, function (error: boolean, response: any, body: string) {
          // Check for references that this place has no picnic tables
          const no_picnic_tables_regex_1 = /no picnic/i;
          let has_picnic_tables = (no_picnic_tables_regex_1.exec(body) == null);
          if (!has_picnic_tables) {
            // No picnic tables here :(
            j -= 1;
            return;
          }
          // Check for any reference of picnic tables
          const no_picnic_tables_regex_2 = /picnic/i;
          let doesnt_specify_picnic_tables = (no_picnic_tables_regex_2.exec(body) == null);
          if (doesnt_specify_picnic_tables) {
            // It could have picnic tables, but it probably doesn't...
            j -= 1;
            return;
          }

          const notes_regex = /<div class=\"callout\">\s*<h4>notes<\/h4>([\s\S]*?)<\/div>/i;
          let m;
          let notes: string;
          if ((m = notes_regex.exec(body)) !== null) {
            notes = Striptags(m[1]).trim();
          } else {
            notes = undefined;
          }

          // Insert or Update Table
          console.log("Adding a table!");
          Picnic.findOneAndUpdate({
            "geometry.type": "Point",
            "properties.source.id": site_name
          }, {
              $set: {
                "type": "Feature",
                "properties.type": "site",
                "properties.source.retrieved": retrieved,
                "properties.source.name": source_name,
                "properties.source.dataset": dataset_name,
                "properties.source.url": dataset_url_human,
                "properties.license.name": license_name,
                "properties.license.url": license_url,
                "properties.comment": notes,
                "geometry.type": "Point",
                "geometry.coordinates": coordinates
              }
            }, {
              "upsert": true
            }).exec(function (err, doc) {
              if (err) {
                console.log(err);
                fail = fail + 1;
              } else {
                success = success + 1;
              }

              // Disconnect on last update
              j -= 1;
              console.log("j is now " + j + "!")
              if (j == 0) {
                console.log(success + "/" + (success + fail) + " updated/inserted.");
                Mongoose.disconnect();
              }
            });
        });

        // console.log("----- SITE -----");
        // console.log(site);
        console.log("j is now " + j + "!")
        if (j == 0) {
          console.log(success + "/" + (success + fail) + " updated/inserted.");
          Mongoose.disconnect();
        }
      });
    });
  });
});