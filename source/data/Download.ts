/*
  NOTE: This is being depricated. Please use the Downloader classes.
*/

import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");
import Request = require("request-promise-native");
// It's not feasible to fix other packages at the moment. Need @types/fake-useragent.
// tslint:disable-next-line:no-var-requires
const fakeUa = require("fake-useragent");

// Load Configuration
Nconf.file(Path.join(__dirname, "../../config.json"));
const mongoConfig = Nconf.get("mongo");

// From https://stackoverflow.com/a/2332821
export function capitalCase(s: string) {
  return s.toLowerCase().replace(/\b./g, (a: string) => a.toUpperCase());
}

async function parse(settings: any, dsName: string, dsURL: string, parseFunction: (res: any) => Promise<number>) {
  try {
    // Open Connection
    console.log("Connecting to MongoDB...");
    Mongoose.set("useCreateIndex", true);
    await Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true });

    // Download Data
    console.log("Downloading " + dsURL + "...");
    const body = await Request(settings);

    // Parse Data
    console.log("Parsing data...");
    const numOps = await parseFunction(body);
    console.log("Performed " + numOps + " database operations!");

    // Close Connection
    console.log("Disconnecting from MongoDB...");
    await Mongoose.disconnect();
    return numOps;
  } catch (error) {
    console.log(error);
    return -1;
  }
}

// Used for CSV based files and Raw HTML
export async function parseDataString(dsName: string, dsURL: string, parseFunction: (res: string) => Promise<number>) {
  return await parse({
    headers: {
      "User-Agent": fakeUa(),
    },
    uri: dsURL,
  }, dsName, dsURL, parseFunction);
}
export async function parseDataPostString(dsName: string, dsURL: string, postForm: any,
  parseFunction: (res: string) => Promise<number>) {
  return await parse({
    form: postForm,
    headers: {
      "User-Agent": fakeUa(),
    },
    method: "POST",
    uri: dsURL,
  }, dsName, dsURL, parseFunction);
}

// Used for JSON based files
export async function parseDataJSON(dsName: string, dsURL: string, parseFunction: (res: any) => Promise<number>) {
  return await parse({
    headers: {
      "User-Agent": fakeUa(),
    },
    json: true,
    uri: dsURL,
  }, dsName, dsURL, parseFunction);
}

// Used for excel based files
export async function parseDataBinary(dsName: string, dsURL: string,
  parseFunction: (res: Uint8Array) => Promise<number>) {
  return await parse({
    encoding: null,
    headers: {
      "User-Agent": fakeUa(),
    },
    uri: dsURL,
  }, dsName, dsURL, parseFunction);
}

export async function parseDataArcGIS(dsName: string, gisLayerURL: string, where: string = "1=1", outFields: string = "*", maxRecCount: number = 1000,
  parseFunction: (res: any[]) => Promise<number>) {
  try {
    // Open Connection
    console.log("Connecting to MongoDB...");
    Mongoose.set("useCreateIndex", true);
    await Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true });

    // Download Data
    console.log("Downloading from " + gisLayerURL + "...");
    let offset = 0;
    const data = [];
    while (true) {
      const body = await Request({
        headers: {
          "User-Agent": fakeUa(),
        },
        json: true,
        uri: gisLayerURL + "/query?where=" + where +
          "&outFields=" + outFields +
          "&resultOffset=" + (offset === 0 ? "" : offset) + // This is important for servers without pagination support.
          "&returnGeometry=true&outSR=4326&f=json",
      });
      // Add our new data
      for (const feature of body.features) {
        data.push(feature);
      }
      if (data.length - offset < maxRecCount || data.length === 0) {
        // No more records
        break;
      }
      offset += maxRecCount;
    }

    // Parse Data
    console.log("Parsing data...");
    const numOps = await parseFunction(data);
    console.log("Performed " + numOps + " database operations!");

    // Close Connection
    console.log("Disconnecting from MongoDB...");
    await Mongoose.disconnect();
    return numOps;
  } catch (error) {
    console.log(error);
    return -1;
  }
}
