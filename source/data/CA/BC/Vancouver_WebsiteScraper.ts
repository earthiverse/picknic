import Cheerio = require('cheerio')
import Request = require('request-promise-native')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "City of Vancouver"
let dataset_name = "Picnics in Vancouver's parks"
let dataset_url_human = "http://vancouver.ca/parks-recreation-culture/picnics.aspx"
let license_name = "Unknown"
let license_url = "Unknown"

// First: Use this URL which gets the parks with designated picnic sites
// http://vancouver.ca/parks-recreation-culture/picnics.aspx

// Second: Go to the URL from the map icon to get the park's site, which will grab the park's location.
// http://vanmapp1.vancouver.ca/gmaps/covmap.htm?map=designated_picnic_locations&zoom=15&id=pn02

Download.parseDataStringAsync(dataset_name, dataset_url_human, async function (body: string) {
  let database_updates: Array<any> = Array<any>(0)
  let retrieved = new Date()

  let $ = Cheerio.load(body)
  let parks: any[] = []
  $("table.collapse").find("tr").each(async function (i) {
    if (i == 0) {
      // Skip the table header
      return;
    }
    let columns = $(this).find("td")
    let siteName = columns.eq(0).text().trim()
    let parkLocationID = columns.eq(1).find("a").attr('href').slice(-4)
    let parkDetails = columns.eq(3).text().trim().replace(/[\n\r]+/g, '. ').replace(/\s+/g, ' ').trim() + "."
    parks.push({ siteName, parkLocationID, parkDetails })
  })

  for (let i = 0; i < parks.length; i++) {
    let siteName = parks[i].siteName
    let parkLocationID = parks[i].parkLocationID
    let parkDetails: string = parks[i].siteName + ". " + parks[i].parkDetails

    // What's the opposite of not sheltered? Sheltered!
    let hasPicnicShelter = !/not\s+sheltered/i.test(parkDetails)

    console.log("Finding location for " + siteName + "...")
    let data = await Request({
      uri: "http://vanmapp1.vancouver.ca/googleKml/designated_picnic_locations/id/" + parkLocationID
    }).then(function (body: string) {
      // Lol, KML...
      let result = /<coordinates>([\-.0-9]+),([\-.0-9]+)/.exec(body)
      let lng = result[1]
      let lat = result[2]
      return [lng, lat]
    })

    let coordinates = data;

    database_updates.push(Picnic.findOneAndUpdate({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": parkLocationID
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": parkLocationID,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.sheltered": hasPicnicShelter,
          "properties.comment": parkDetails,
          "geometry.type": "Point",
          "geometry.coordinates": coordinates
        }
      }, {
        "upsert": true,
        "new": true
      }).exec());
  }



  return database_updates;
});
