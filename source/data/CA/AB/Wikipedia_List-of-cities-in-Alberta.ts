import Cheerio = require('cheerio');
import Fs = require('fs');
import Mongoose = require('mongoose');
import Request = require('request-promise-native');
import querystring = require('querystring');
var Twitter = require('twitter');

// Important Fields
let url = "https://en.wikipedia.org/wiki/List_of_cities_in_Alberta"
let dataset_name = "Wikipedia - List of cities in Alberta"

// Twitter
var twitter = new Twitter({
  consumer_key: 'gQg2En5djdSC91YW3TWjSBk46',
  consumer_secret: 'CasEzhFhmvlnZl9hjU9YR79yKVUiFoSJ8GmXfVvF1KmGsNxJcD',
  access_token_key: '721527858053533696-qFCZkAt9WuVFSMxfPMnKwJZk07dxpNN',
  access_token_secret: 'MUTjUXynh3gOhWK9gfJyKZ1jFz7EjcV7hKZ0PktFFOops'
});

var cities: any[] = [];
var data: any = {}

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
      $('#List').parent().next('table').find('tr').each(function (i) {
        let columns = $(this).children('td')
        if (columns.length == 0) {
          // Probably a header row, and doesn't contain data
          return
        }
        let city = columns.eq(0).children('a').text();
        const population_regex = /\u2660([\d,]+)/u;
        let population: number;
        let m;
        if ((m = population_regex.exec(columns.eq(4).text())) !== null) {
          population = Number.parseInt(m[1].replace(',', ''));
        }
        cities.push(city);
        data[city] = {
          properties: {
            population: population
          },
          twitter: {
          }
        };
      })
      console.log("Found " + cities.length + " cities.");

      // Connect to Twitter & search for the accounts for the cities
      cities.forEach((city) => {
        database_updates.push(new Promise(function (resolve, reject) {
          twitter.get("users/search", {
            q: querystring.escape("Open Data " + city)
          }, function (error: any, tweets: any, response: any) {
            let search_result = JSON.parse(response.body)[0]
            try {
              let name: string = search_result.name;
              let username: string = search_result.screen_name;
              let verified: boolean = search_result.verified;
              let url: string = search_result.entities.url.urls[0].expanded_url;
              data[city]["twitter"]["open_data"] = {
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
        }));
        database_updates.push(new Promise(function (resolve, reject) {
          twitter.get("users/search", {
            q: querystring.escape("City of " + city)
          }, function (error: any, tweets: any, response: any) {
            let search_result = JSON.parse(response.body)[0]
            try {
              let name: string = search_result.name;
              let username: string = search_result.screen_name;
              let location: string = search_result.location;
              let verified: boolean = search_result.verified;
              let url: string = search_result.entities.url.urls[0].expanded_url;
              data[city]["twitter"]["city"] = {
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
        Fs.writeFile("Wikipedia_List-of-cities-in-Alberta.json", JSON.stringify(data, null, 2), function (err) {
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
