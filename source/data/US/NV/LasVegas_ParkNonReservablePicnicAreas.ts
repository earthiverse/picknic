import CSVParse = require('csv-parse/lib/sync');

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "Las Vegas Office of GIS"
let dataset_name = "Park Non-Reservable Picnic Areas"
let dataset_url_human = "https://opendata.arcgis.com/datasets/734ec0e1dd374271ab36f9073d3e1dc7_2"
let dataset_url_csv = "https://opendata.arcgis.com/datasets/734ec0e1dd374271ab36f9073d3e1dc7_2.csv"
// TODO: Find out
let license_name = "Unknown"
let license_url = ""

Download.parseDataString(dataset_name, dataset_url_csv, function (res: string) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  CSVParse(res, { columns: true, ltrim: true }).forEach(function (data: any) {
    let lat: Number = parseFloat(data["Y"]);
    let lng: Number = parseFloat(data["X"]);

    let type = data["TYPE"].trim()
    let sheltered: boolean;
    if (type == "Eating Area Uncovered") {
      sheltered = false;
    } else if (type == "Eating Area Covered") {
      sheltered = true;
    } else {
      sheltered = undefined;
    }

    let notes: string = data["NOTES"]
    let park: string = data["FAC_NME"]
    let condition: string = data["COND"]
    let bbq: string = data["BARBQ_GRILL"]
    let objectID: string = data["OBJECTID"]

    let comment: string = "";
    if (notes) {
      comment = "Notes: " + notes + ".";
    }
    if (bbq == "Yes") {
      comment += " Has a BBQ grill."
      comment = comment.trimLeft();
    }
    if (condition) {
      comment += " In " + condition.toLowerCase() + " condition."
      comment = comment.trimLeft();
    }
    if (park) {
      comment += " Located in " + park + "."
      comment = comment.trimLeft();
    }

    database_updates.push(Picnic.findOneAndUpdate({
      "geometry.type": "Point",
      "geometry.coordinates": [lng, lat]
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
          "properties.comment": comment,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat]
        }
      }, {
        "upsert": true,
        "new": true
      }).exec());
  })

  return database_updates;
});