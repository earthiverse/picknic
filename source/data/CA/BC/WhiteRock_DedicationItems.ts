import Proj4 = require('proj4');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "City of White Rock Open Data Portal"
let dataset_name = "Dedication Items"
let dataset_url_human = "http://data.whiterockcity.ca/dataset/parkitem"
let dataset_url_geojson = "http://wroms.whiterockcity.ca/opendata/GIS/Data/Spatial/Parks/JSON/ParkItem.json"
let license_name = "Open Government License - British Columbia"
let license_url = "https://www2.gov.bc.ca/gov/content/data/open-data/open-government-license-bc"

Download.parseDataJSON(dataset_name, dataset_url_geojson, function (res: any) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  res.features.forEach(function (result: any) {
    let type: string = result.properties.Item_Type;
    if (type != "PICNIC TABLE") {
      return;
    }
    // The data for this dataset is in EPSG:26910.
    // See: http://spatialreference.org/ref/epsg/nad83-utm-zone-10n/
    let coordinates: any = Proj4("+proj=utm +zone=10 +ellps=GRS80 +datum=NAD83 +units=m +no_defs", "WGS84", result.geometry.coordinates);
    let park_name: string = result.properties.Park_Name;

    database_updates.push(Picnic.findOneAndUpdate({
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
        "upsert": true,
        "new": true
      }).exec());
  });

  return database_updates;
});