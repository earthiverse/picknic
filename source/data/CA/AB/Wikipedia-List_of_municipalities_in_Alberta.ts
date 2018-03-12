import Cheerio = require('cheerio');
import Mongoose = require('mongoose');
import Nconf = require("nconf");
import Path = require("path");

import { Municipality } from "../../../models/Municipality"
import { TwitterExtractor } from "../../../TwitterExtractor";
import { WikipediaExtractor } from "../../../WikipediaExtractor"


// Load Configuration
Nconf.file(Path.join(__dirname, "../../../../config.json"));
let mongoConfig = Nconf.get("mongo");

console.log("Connecting to MongoDB...");
// TODO: Add failure to connect
Mongoose.connect(mongoConfig.picknic).then(function () {
  // Scrape the list of cities to get the table
  WikipediaExtractor.GetPage("List of municipalities in Alberta").then(function (html: any) {
    WikipediaExtractor.FindTable(html, "Urban municipalities of Alberta").then(function (table: any) {
      console.log(table.rows.length)
      table.rows.forEach(function (row: string[]) {
        // Get the page title from the link in the first column
        let $ = Cheerio.load(row[0])
        let placeWikiPage = $("a").attr("title")
        let placeName = $("a").text()
        let placeType = row[1]

        // Scrape the city's wiki
        WikipediaExtractor.GetPage(placeWikiPage).then(function (html: any) {
          // Get the official website URL
          let cityWebsite = WikipediaExtractor.FindWebsite(html)
          let cityCoordinates = WikipediaExtractor.FindCoordinates(html)

          // Add city
          console.log("Performing upsert on", placeName)
          Municipality.update({
            "properties.country": "CA",
            "properties.subdivision": "AB",
            "properties.name": placeName
          }, {
              $set: {
                "properties.country": "CA",
                "properties.subdivision": "AB",
                "properties.name": placeName,
                "properties.type": placeType,
                "geometry.type": "Point",
                "geometry.coordinates": cityCoordinates

              }
            }, {
              "upsert": true,
              "new": true
            }).exec()

          if (cityWebsite) {
            TwitterExtractor.scrapeHTMLForTwitterUsers(cityWebsite).then(function (users: string[]) {
              if (users) {
                console.log("Performing update on", placeName)
                Municipality.update({
                  "properties.country": "CA",
                  "properties.subdivision": "AB",
                  "properties.name": placeName
                }, {
                    $set: {
                      "properties.country": "CA",
                      "properties.subdivision": "AB",
                      "properties.name": placeName,
                      "properties.twitter": users
                    }
                  }, {
                    "upsert": true,
                    "new": true
                  }).exec()
              }
            })
          } else {
            console.log(placeName)
            console.log("  Cannot find external url")
          }
        })
      })
    })
  }).catch(function (error) {
    console.log("----- ERROR (???) -----");
    console.log(error);
    Mongoose.disconnect();
  })
}).catch(function (error) {
  console.log(error)
  process.exit()
})