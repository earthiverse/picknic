import Mongoose = require('mongoose');
import Nconf = require("nconf");
import Path = require("path");
import Request = require('request-promise-native');

import { DocumentQuery } from 'mongoose';

// Load Configuration
Nconf.file(Path.join(__dirname, "../../config.json"));
let mongoConfig = Nconf.get("mongo");

export namespace Download {
  export function parseData(dataset_name: string, dataset_url_data: string, parseFunction: (res: string) => Promise<any>[]) {
    console.log("Connecting to MongoDB...");
    Mongoose.connect(mongoConfig.picknic).then(function () {
      let database_updates: Array<Promise<any>> = Array<Promise<any>>(0);

      // Download data
      console.log("Downloading " + dataset_url_data + "...");
      Request({
        uri: dataset_url_data
      })
        // Parse data
        .then(function (body) {
          console.log("Parsing data...");
          database_updates = parseFunction(body);
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
          Promise.all(database_updates).then(() => {
            console.log("Updated " + database_updates.length + " data points!")
            console.log("Disconnecting...");
            Mongoose.disconnect();
          })
        })
    })
  }
}

