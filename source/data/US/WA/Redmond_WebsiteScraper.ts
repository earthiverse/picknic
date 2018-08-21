import Cheerio = require('cheerio')
import Nconf = require("nconf")
import Path = require("path")
import Request = require('request-promise-native')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Load configuration
Nconf.file(Path.join(__dirname, "../../../../config.json"))
let keysConfig = Nconf.get("keys")

var googleMapsClient = require('@google/maps').createClient({
  key: keysConfig.public.googleMaps,
  Promise: Promise
})

// Important Fields
let source_name = "City of Redmond"
let dataset_name = "Parks & Trails"
let dataset_url_human = "http://www.redmond.gov/cms/One.aspx?portalId=169&pageId=676"
let license_name = "Unknown"
let license_url = "Unknown"

Download.parseDataString(dataset_name, dataset_url_human, async function (res: string) {
  let database_updates = 0
  let page_grabs: Array<any> = Array<any>(0)
  let retrieved = new Date()

  // TODO: Find park links
  let $ = Cheerio.load(res)
  let urls: string[] = []
  $(".parksListNav").find("a").each(function (i) {
    let e = $(this)
    let href = e.attr('href')
    urls.push("http://www.redmond.gov/cms/" + href)
  })
  for (let url of urls) {
    let parkName: string
    let hasPicnicTable: boolean
    let hasPicnicShelter: boolean

    let failedURL = false
    let noPicnicTables = false
    let googleResponse = await Request({
      "uri": url
    }).then(function (body: string) {
      let $ = Cheerio.load(body)
      // Check if it mentions picnic related ammenities
      parkName = $('#pagetitle').text()
      let mainContent = $('#main-content').text()
      hasPicnicTable = /picnic\s+table/i.test(mainContent)
      hasPicnicShelter = /picnic\s+shelter/i.test(mainContent)

      if (hasPicnicTable || hasPicnicShelter) {
        // Get the location of the park from Google.
        return googleMapsClient.geocode({
          address: parkName + " Redmond, WA, USA"
        }).asPromise()
      } else {
        noPicnicTables = true
      }
    }).catch(function (error) {
      failedURL = true
    })

    if (googleResponse) {
      let result = googleResponse.json.results[0]
      let lat = result.geometry.location.lat
      let lng = result.geometry.location.lng

      console.log(parkName + " was OK!")
      await Picnic.updateOne({
        "properties.source.name": source_name,
        "properties.source.dataset": dataset_name,
        "properties.source.id": parkName
      }, {
          $set: {
            "type": "Feature",
            "properties.type": "site",
            "properties.source.retrieved": retrieved,
            "properties.source.name": source_name,
            "properties.source.dataset": dataset_name,
            "properties.source.url": dataset_url_human,
            "properties.source.id": parkName,
            "properties.license.name": license_name,
            "properties.license.url": license_url,
            "properties.sheltered": hasPicnicShelter,
            "properties.comment": parkName,
            "geometry.type": "Point",
            "geometry.coordinates": [lng, lat]
          }
        }, {
          "upsert": true
        }).exec()
      database_updates += 1
    } else {
      if (noPicnicTables) {
        console.log(parkName + " has no picnic tables.")
      } else if (failedURL) {
        console.log("----- Failure -----")
        console.log("Failed to retrieve " + url)
      } else {
        console.log("----- Failure -----")
        console.log("Failed to parse " + parkName)
        console.log(JSON.stringify(googleResponse, null, 2))
      }
    }
  }

  // Remove old tables from this data source
  await Picnic.deleteMany({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})