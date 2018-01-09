// http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer/find?searchText=Picnic+Area&contains=true&searchFields=poitype&sr=&layers=Points_Of_Interest&layerDefs=&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=pjson
import Mongoose = require('mongoose');
import Request = require('request');

import { Picnic } from '../../../models/Picnic';

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase(); });
};

Mongoose.connect('mongodb://localhost/picknic');

// Important Fields
let source_name = "NSW Spatial Data Catalogue"
let dataset_name = "NSW Points of Interest"
let dataset_url_human = "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer"
// This URL is magic. It took me about 2 hours of searching to find it
// This page may help if it stops working: http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer/find
let dataset_url_geojson = "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer/find?searchText=Picnic+Area&contains=true&searchFields=poitype&sr=&layers=Points_Of_Interest&layerDefs=&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=pjson"
let license_name = "Creative Commons Attribution 3.0 Australia"
let license_url = "https://creativecommons.org/licenses/by/3.0/au/legalcode"

// Download & Parse!
let retrieved = new Date();
let j = 0;
let success = 0;
let fail = 0;
console.log("Downloading...");
Request(dataset_url_geojson, function (error: boolean, response: any, body: any) {
  console.log("Parsing & Updating Database...");
  let geojson_data = JSON.parse(response.body);
  geojson_data.results.forEach(function (result: any) {
    let name: string = result.attributes.poiname;
    let coordinates: any = [result.geometry.x, result.geometry.y];

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