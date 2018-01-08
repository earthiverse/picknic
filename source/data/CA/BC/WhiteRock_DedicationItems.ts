// http://wroms.whiterockcity.ca/opendata/GIS/Data/Spatial/Parks/JSON/ParkItem.json
import Mongoose = require('mongoose');
import Request = require('request');
import Proj4 = require('proj4');

import { Picnic } from '../../../models/Picnic';

// Setup Mongoose
Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "City of White Rock Open Data Portal"
let dataset_name = "Dedication Items"
let dataset_url_human = "http://data.whiterockcity.ca/dataset/parkitem"
let dataset_url_geojson = "http://wroms.whiterockcity.ca/opendata/GIS/Data/Spatial/Parks/JSON/ParkItem.json"
let license_name = "Open Government License - British Columbia"
let license_url = "https://www2.gov.bc.ca/gov/content/data/open-data/open-government-license-bc"

// Download & Parse!
let retrieved = new Date();
let j = 0;
let success = 0;
let fail = 0;
console.log("Downloading...");
Request(dataset_url_geojson, function (error: boolean, response: any, body: any) {
  console.log("Parsing & Updating Database...");
  let geojson_data = JSON.parse(response.body).features;
  geojson_data.forEach(function (result: any) {
    let type: string = result.properties.Item_Type;
    if (type != "PICNIC TABLE") {
      return;
    }
    // The data for this dataset is in EPSG:26910.
    // See: http://spatialreference.org/ref/epsg/nad83-utm-zone-10n/
    let coordinates: any = Proj4("+proj=utm +zone=10 +ellps=GRS80 +datum=NAD83 +units=m +no_defs", "WGS84", result.geometry.coordinates);

    j += 1;
    Picnic.findOneAndUpdate({
      "geometry.type": "Point",
      "geometry.coordinates": coordinates
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "geometry.type": "Point",
          "geometry.coordinates": coordinates
        }
      }, {
        "upsert": true
      }).exec(function (err, doc) {
        if (err) {
          console.log(err);
          fail = fail + 1;
        } else {
          success = success + 1;
        }

        // Disconnect on last update
        j -= 1;
        if (j == 0) {
          console.log(success + "/" + (success + fail) + " updated/inserted.");
          Mongoose.disconnect();
        }
      });
  });
});