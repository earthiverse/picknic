// NOTES:
// * I don't know how to license webscraping...

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
let source_name = "City of Richmond"
let dataset_name = "Parks Database and Search"
let dataset_url_human = "https://www.richmond.ca/parks/parks/about/amenities/default.aspx"
let license_name = "Unknown"
let license_url = "Unknown"

// Load the page once to get all the good bits that are required to fulfil the search parameters...
Request(dataset_url_human).then(function (body: string) {
  let $ = Cheerio.load(body)
  let eventArgument = $('#__EVENTARGUMENT').attr('value')
  let eventTarget = $('#__EVENTTARGET').attr('value')
  let eventValidation = $('#__EVENTVALIDATION').attr('value')
  let viewState = $('#__VIEWSTATE').attr('value')
  let viewStateGenerator = $('#__VIEWSTATEGENERATOR').attr('value')

  // Do the search with the attributes we got!
  Download.parseDataPostString(dataset_name, dataset_url_human, {
    "__EVENTARGUMENT": eventArgument,
    "__EVENTTARGET": eventTarget,
    "__EVENTVALIDATION": eventValidation,
    "__VIEWSTATE": viewState,
    "__VIEWSTATEGENERATOR": viewStateGenerator,
    "ctl00$pagecontent$txtParkName": "",
    "ctl00$pagecontent$ddlRecArea": "0",
    "ctl00$pagecontent$ddlAmenities": "7", // 7 is the lucky number for picnic tables!
    "ctl00$pagecontent$ddlSpecFeature": "0",
    "ctl00$pagecontent$btnSearch": "Search"
  }, async function (body: string) {
    let database_updates = 0
    let retrieved = new Date()

    // Get the links to all the parks that contain picnic tables
    let $ = Cheerio.load(body)
    let parks: any[] = []
    $('.subtitle').each(function (i) {
      let e = $(this)
      let parkName = e.text()
      let parkURL = e.find("a").attr('href')
      parks.push({ parkName, parkURL })
    })

    for (let park of parks) {
      // There's a park name with two spaces in the name for some reason, let's fix that...
      let parkName = park.parkName.replace(/\s+/, ' ')
      let parkURL = park.parkURL

      console.log("Parsing " + parkName + "...")
      let data = await Request("https://www.richmond.ca/parks/parks/about/amenities/" + parkURL).then(function (body: string) {
        // Find the number of picnic tables at this park.
        let numPicnicTables = /class="subtitle">Picnic Tables[\s\S]+AmenitiesNumber">([0-9]+)/i.exec(body)[1]
        let address = /maps\.google\.com\/maps\?q=(.+?)&/i.exec(body)[1]

        return ({ numPicnicTables, address })
      })

      let numPicnicTables = data.numPicnicTables
      let address = data.address

      let comment = parkName + "."
      if (numPicnicTables == "1") {
        comment += " " + numPicnicTables + " picnic table."
      } else if (numPicnicTables) {
        comment += " " + numPicnicTables + " picnic tables."
      }

      let googleData = await googleMapsClient.geocode({
        address: address
      }).asPromise()
      googleData = googleData.json.results[0]
      if (googleData) {
        let lat = googleData.geometry.location.lat
        let lng = googleData.geometry.location.lng

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
              "properties.source.id": parkName,
              "properties.source.url": dataset_url_human,
              "properties.license.name": license_name,
              "properties.license.url": license_url,
              "properties.comment": comment,
              "geometry.type": "Point",
              "geometry.coordinates": [lng, lat]
            }
          }, {
            upsert: true
          }).lean().exec()
        database_updates += 1
      } else {
        console.log("Couldn't get a location from Google for " + parkName + "!")
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
})
