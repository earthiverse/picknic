import Cheerio = require('cheerio');
import Fs = require('fs');
import Mongoose = require('mongoose');
import Nconf = require("nconf");
import Path = require("path");
import Request = require('request-promise-native');
import Querystring = require('querystring');
var Twitter = require('twitter');
var RateLimiter = require('limiter').RateLimiter;

// Load Config
Nconf.file(Path.join(__dirname, "../../../../config.json"));
let twitterConfig = Nconf.get("twitter");

// Important Fields
let url = "https://en.wikipedia.org/wiki/List_of_municipalities_in_Alberta"
let dataset_name = "Wikipedia - List of municipalities in Alberta"

// Twitter
var twitter = new Twitter({
  consumer_key: twitterConfig.consumer_key,
  consumer_secret: twitterConfig.consumer_secret,
  access_token_key: twitterConfig.access_token_key,
  access_token_secret: twitterConfig.access_token_secret
});

// Rate limiter
var twitterLimits = new RateLimiter(1, 'second');
var wikipediaLimits = new RateLimiter(2, 'second');

// This 'data' will store all the data we scrape
var data: any = []

// Connect to database
console.log("Connecting to MongoDB...");
Mongoose.connect('mongodb://localhost/picknic').then(function () {
  // Grab the starting Wikipedia page
  let retrieved = new Date();
  console.log("Downloading " + url + "...");
  let database_updates: Array<any> = Array<any>(0);
  Request({
    uri: url
  })
    // Parse data
    .then((body: string) => {
      console.log("Parsing data...");
      let $ = Cheerio.load(body);

      // Grab the HTML table that has all the data for the municipalities
      $('#List_of_urban_municipalities').parent().nextUntil('table').next().find('tr:not(.sortbottom)').each(function (i) {
        let columns = $(this).children('td')
        if (columns.length == 0) {
          // Probably a header row, and doesn't contain data
          return
        }
        let name = columns.eq(0).children('a').text();
        let url_wikipedia = "https://en.wikipedia.org" + columns.eq(0).children('a').attr('href');
        let status = columns.eq(1).text();
        let population = Number.parseInt(columns.eq(3).text().replace(',', ''));
        console.log(population + " people live in the " + status + " of " + name + "!");
        console.log("check out " + url_wikipedia + " for more fun info!");
        data.push({
          "name": name,
          "properties": {
            "url_wikipedia": url_wikipedia,
            "population": population,
            "status": status
          }
        });
      })
      // TODO: Grab the HTML table that has all the data for the 'special' municipalities
      console.log("Found " + data.length + " municipalities.");

      // Look for Twitter accounts
      data.forEach((municipality: any, i: number) => {
        // Create a promise to get data for the current city.
        database_updates.push(new Promise(function (resolve, reject) {
          // TODO: 1st: Follow Wikipedia to the official website & see if there's a Twitter link on the page
          wikipediaLimits.removeTokens(1, function () {
            Request({
              "uri": municipality.properties.url_wikipedia
            })
              .then((body: string) => {
                let $ = Cheerio.load(body);

                // Find "official website"
                let official_url = $('.official-website').children().children('a').attr('href')
                if (official_url) {
                  data[i]["properties"]["url_official"] = official_url

                  // Check the official website for a twitter link
                  Request({
                    "uri": official_url,
                    "headers": {
                      "User-Agent": "request" // Some of these websites will throw an error without this...
                    },
                    "strictSSL": false
                  }).then((body: string) => {
                    const twitter_url_regex = /href\s*=\s*["']https?:\/\/(www\.)?twitter\.com\/(#!\/)?@?(?!(twitterapi|intent|share|search))(.+?)["'\?\/]/g;
                    let m = twitter_url_regex.exec(body);
                    if (m) {
                      // We may have found a twitter URL on the page
                      console.log("found potential twitter for " + municipality.name + " : " + m[5]);
                      data[i]["twitter"] = {
                        "official": {
                          "username": m[4]
                        }
                      }
                      resolve();
                    } else {
                      // TODO: CONTINUE THE HUNT!
                      console.log("didn't find a suitable twitter url for " + municipality.name + " on their website")
                      resolve();
                      //reject();
                    }
                  }).catch(function (error) {
                    console.log("failed getting website for " + municipality.name + " (" + data[i]["properties"]["url_official"] + ")")
                    console.error(error);
                  });
                } else {
                  console.log("didn't find a website for " + municipality.name)
                  resolve();
                  //reject();
                }

                // TODO: If we found a URL, resolve, otherwise keep going
                resolve();
              })
              .catch(function (error) {
                console.log(error);
                //reject();
                resolve();
              });
          });
          // TODO: 2nd: Search Twitter users for a potential match
        }));
      })
    })
    // Error handler for download
    .catch(function (error) {
      console.log("----- ERROR (" + dataset_name + ") -----");
      console.log(error);
      Mongoose.disconnect();
    })
    .then(() => {
      // Disconnect from database
      Promise.all(database_updates).then(() => {
        Fs.writeFile("Wikipedia_List-of-municipalities-in-Alberta.json", JSON.stringify(data, null, 2), function (err) {
          if (err) {
            console.log("Error writing data...")
            console.log(err);
          }
        });

        console.log("Updated " + database_updates.length + " data points.")
        console.log("Disconnecting...");
        Mongoose.disconnect();
      })
    })
})
  .catch((error) => {
    console.log("Failed to connect to Mongo...");
    console.log(error);
    process.exit(1);
  })
