import Mongoose = require('mongoose');
import Nconf = require("nconf");
import Path = require("path");
import Request = require('request-promise-native');

const fakeUa = require('fake-useragent');

// Load Configuration
Nconf.file(Path.join(__dirname, "../../config.json"));
let mongoConfig = Nconf.get("mongo");

export namespace Download {
  function parse(requestSettings: any, dataset_name: string, dataset_url_data: string, parseFunction: (res: any) => any) {
    console.log("Connecting to MongoDB...");
    Mongoose.connect(mongoConfig.picknic).then(function () {
      let database_updates: Array<Promise<any>> = Array<Promise<any>>(0);

      // Download data
      console.log("Downloading " + dataset_url_data + "...");
      Request(requestSettings)
        // Parse data
        .then(async function (body) {
          console.log("Parsing data...");
          database_updates = await parseFunction(body);
        })
        // Error handler for download
        .catch(function (error) {
          console.log("----- ERROR (" + dataset_name + ") -----");
          console.log(error);
          Mongoose.disconnect();
        })
        .then(function () {
          // Disconnect from database
          console.log("Waiting for database updates to complete...")
          Promise.all(database_updates).then(function () {
            console.log("Performed " + database_updates.length + " database operations!")
            console.log("Disconnecting...");
            Mongoose.disconnect();
          })
        })
    }).catch(function (error) {
      console.log(error)
      process.exit()
    })
  }

  // Used for CSV based files and Raw HTML
  export function parseDataString(dataset_name: string, dataset_url_data: string, parseFunction: (res: string) => Promise<any>[]) {
    parse({
      uri: dataset_url_data,
      headers: {
        'User-Agent': fakeUa()
      }
    }, dataset_name, dataset_url_data, parseFunction);
  }
  export function parseDataStringAsync(dataset_name: string, dataset_url_data: string, parseFunction: (res: string) => Promise<any[]>) {
    parse({
      uri: dataset_url_data,
      headers: {
        'User-Agent': fakeUa()
      }
    }, dataset_name, dataset_url_data, parseFunction)
  }
  export function parseDataPostStringAsync(dataset_name: string, dataset_url_data: string, post_form: any, parseFunction: (res: string) => Promise<any[]>) {
    parse({
      uri: dataset_url_data,
      headers: {
        'User-Agent': fakeUa()
      },
      method: "POST",
      form: post_form
    }, dataset_name, dataset_url_data, parseFunction)
  }

  // Used for JSON based files
  export function parseDataJSON(dataset_name: string, dataset_url_data: string, parseFunction: (res: any) => Promise<any>[]) {
    parse({
      uri: dataset_url_data,
      json: true,
      headers: {
        'User-Agent': fakeUa()
      }
    }, dataset_name, dataset_url_data, parseFunction);
  }
  export function parseDataJSONAsync(dataset_name: string, dataset_url_data: string, parseFunction: (res: any) => Promise<any[]>) {
    parse({
      uri: dataset_url_data,
      json: true,
      headers: {
        'User-Agent': fakeUa()
      }
    }, dataset_name, dataset_url_data, parseFunction);
  }

  // Used for excel based files
  export function parseDataBinary(dataset_name: string, dataset_url_data: string, parseFunction: (res: Uint8Array) => Promise<any>[]) {
    parse({
      uri: dataset_url_data,
      encoding: null,
      headers: {
        'User-Agent': fakeUa()
      }
    }, dataset_name, dataset_url_data, parseFunction);
  }
}

