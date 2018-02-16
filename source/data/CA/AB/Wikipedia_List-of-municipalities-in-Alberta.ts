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
var limiter = new RateLimiter(1, 'second');

var data: any = []

// Connect to database
console.log("Connecting to MongoDB...");
Mongoose.connect('mongodb://localhost/picknic').then(function () {
  // Download data
  let retrieved = new Date();
  console.log("Downloading " + url + "...");
  let database_updates: Array<any> = Array<any>(0);
  Request({
    uri: url,
    json: false
  })
    // Parse data
    .then((body: string) => {
      console.log("Parsing data...");
      let $ = Cheerio.load(body);

      // Grab the HTML table that has all the data
      $('#List_of_urban_municipalities').parent().nextUntil('table').next().find('tr:not(.sortbottom)').each(function (i) {
        let columns = $(this).children('td')
        if (columns.length == 0) {
          // Probably a header row, and doesn't contain data
          return
        }
        let name = columns.eq(0).children('a').text();
        let status = columns.eq(1).text();
        console.log("status: " + status)
        const population_regex = /\u2660([\d,]+)/u;
        let population: number;
        let m;
        if ((m = population_regex.exec(columns.eq(4).text())) !== null) {
          population = Number.parseInt(m[1].replace(',', ''));
        }
        data.push({
          name: name,
          properties: {
            population: population,
            status: status
          }
        });
      })
      console.log("Found " + data.length + " municipalities.");

      // Connect to Twitter & search for the accounts for the municipalities
      data.forEach((municipality: any, i: number) => {
        database_updates.push(new Promise(function (resolve, reject) {
          limiter.removeTokens(1, function () {
            twitter.get("users/search", {
              q: Querystring.escape("Open Data " + municipality.name),
              near: Querystring.escape(municipality.name + ", Alberta"),
              within: "1000km"
            }, function (error: any, tweets: any, response: any) {
              if (error) {
                console.log("Error!")
                console.log(error);
                return;
              }
              let search_result = JSON.parse(response.body)[0]
              // TODO: Search for the account with the most followers?

              try {
                let name: string = search_result.name;
                let username: string = search_result.screen_name;
                let verified: boolean = search_result.verified;
                let url: string = search_result.entities.url.urls[0].expanded_url;
                data[i]["twitter"]["open_data"] = {
                  name: name,
                  username: username,
                  verified: verified,
                  url: url
                }
                console.log(name + " (@" + username + ") - " + url)
              } catch (e) {
                // TODO: ideally, I would like to check if the account has a URL before blindly getting it, which is causing this error.
              }
            })
            resolve();
          });
        }));
        database_updates.push(new Promise(function (resolve, reject) {
          limiter.removeTokens(1, function () {
            twitter.get("users/search", {
              q: Querystring.escape(municipality.properties.status + " of " + municipality.name),
              near: Querystring.escape(municipality.name + ", Alberta"),
              within: "1000km"
            }, function (error: any, tweets: any, response: any) {
              let search_result = JSON.parse(response.body)[0]
              try {
                let name: string = search_result.name;
                let username: string = search_result.screen_name;
                let location: string = search_result.location;
                let verified: boolean = search_result.verified;
                let url: string = search_result.entities.url.urls[0].expanded_url;
                data[i]["twitter"]["city"] = {
                  name: name,
                  username: username,
                  location: location,
                  verified: verified,
                  url: url
                }
                console.log(name + " (@" + username + ") - " + url)
              } catch (e) {
                // TODO: ideally, I would like to check if the account has a URL before blindly getting it, which is causing this error.
              }
              resolve();
            })
          });
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
