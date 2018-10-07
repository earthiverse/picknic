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
export function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, (a: string) => a.toUpperCase());
}

async function parse(settings: any, dsName: string, dsURL: string, parseFunction: (res: any) => Promise<number>) {
  try {
    // Open Connection
    console.log("Connecting to MongoDB...");
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
  } catch (error) {
    console.log(error);
    process.exit();
  }
}

// Used for CSV based files and Raw HTML
export async function parseDataString(dsName: string, dsURL: string, parseFunction: (res: string) => Promise<number>) {
  await parse({
    headers: {
      "User-Agent": fakeUa(),
    },
    uri: dsURL,
  }, dsName, dsURL, parseFunction);
}
export async function parseDataPostString(dsName: string, dsURL: string, postForm: any,
  parseFunction: (res: string) => Promise<number>) {
  await parse({
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
  await parse({
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
  await parse({
    encoding: null,
    headers: {
      "User-Agent": fakeUa(),
    },
    uri: dsURL,
  }, dsName, dsURL, parseFunction);
}
