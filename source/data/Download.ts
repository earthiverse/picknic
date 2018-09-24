import Mongoose = require('mongoose')
import Nconf = require("nconf")
import Path = require("path")
import Request = require('request-promise-native')

const fakeUa = require('fake-useragent')

// Load Configuration
Nconf.file(Path.join(__dirname, "../../config.json"))
let mongoConfig = Nconf.get("mongo")

export namespace Download {
  async function parse(requestSettings: any, dataset_name: string, dataset_url_data: string, parseFunction: (res: any) => Promise<number>) {
    try {
      // Open Connection
      console.log("Connecting to MongoDB...")
      await Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true })

      // Download Data
      console.log("Downloading " + dataset_url_data + "...")
      let body = await Request(requestSettings)

      // Parse Data
      console.log("Parsing data...")
      let num_db_operations = await parseFunction(body)
      console.log("Performed " + num_db_operations + " database operations!")

      // Close Connection
      console.log("Disconnecting from MongoDB...")
      await Mongoose.disconnect()
    } catch (error) {
      console.log(error)
      process.exit()
    }
  }

  // Used for CSV based files and Raw HTML
  export async function parseDataString(dataset_name: string, dataset_url_data: string, parseFunction: (res: string) => Promise<number>) {
    await parse({
      uri: dataset_url_data,
      headers: {
        'User-Agent': fakeUa()
      }
    }, dataset_name, dataset_url_data, parseFunction)
  }
  export async function parseDataPostString(dataset_name: string, dataset_url_data: string, post_form: any, parseFunction: (res: string) => Promise<number>) {
    await parse({
      uri: dataset_url_data,
      headers: {
        'User-Agent': fakeUa()
      },
      method: "POST",
      form: post_form
    }, dataset_name, dataset_url_data, parseFunction)
  }

  // Used for JSON based files
  export async function parseDataJSON(dataset_name: string, dataset_url_data: string, parseFunction: (res: any) => Promise<number>) {
    await parse({
      uri: dataset_url_data,
      json: true,
      headers: {
        'User-Agent': fakeUa()
      }
    }, dataset_name, dataset_url_data, parseFunction)
  }

  // Used for excel based files
  export async function parseDataBinary(dataset_name: string, dataset_url_data: string, parseFunction: (res: Uint8Array) => Promise<number>) {
    await parse({
      uri: dataset_url_data,
      encoding: null,
      headers: {
        'User-Agent': fakeUa()
      }
    }, dataset_name, dataset_url_data, parseFunction)
  }
}

