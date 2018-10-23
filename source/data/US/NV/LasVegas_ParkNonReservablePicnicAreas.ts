import CSVParse = require("csv-parse/lib/sync");
import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Las Vegas Office of GIS";
const dsName = "Park Non-Reservable Picnic Areas";
const humanURL = "https://opendata.arcgis.com/datasets/734ec0e1dd374271ab36f9073d3e1dc7_2";
const dsURL = "https://opendata.arcgis.com/datasets/734ec0e1dd374271ab36f9073d3e1dc7_2.csv";
const licenseName = "Unknown";
const licenseURL = "";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const lat: number = parseFloat(data.Y);
    const lng: number = parseFloat(data.X);

    const type = data.TYPE.trim();
    let sheltered: boolean;
    if (type === "Eating Area Uncovered") {
      sheltered = false;
    } else if (type === "Eating Area Covered") {
      sheltered = true;
    }

    const notes: string = data.NOTES;
    const park: string = data.FAC_NME;
    const condition: string = data.COND;
    const bbq: string = data.BARBQ_GRILL;
    const objectID: string = data.OBJECTID;

    let comment: string = "";
    if (notes) {
      comment = "Notes: " + notes + ".";
    }
    if (bbq === "Yes") {
      comment += " Has a BBQ grill.";
      comment = comment.trimLeft();
    }
    if (condition) {
      comment += " In " + condition.toLowerCase() + " condition.";
      comment = comment.trimLeft();
    }
    if (park) {
      comment += " Located in " + park + ".";
      comment = comment.trimLeft();
    }

    await Picnic.updateOne({
      "geometry.coordinates": [lng, lat],
      "geometry.type": "Point",
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": humanURL,
          "properties.type": "table",
          "type": "Feature",
        },
      }, {
        upsert: true,
      }).exec();
    numOps += 1;
  }

  // Remove old tables from this data source
  await Picnic.deleteMany({
    "properties.source.dataset": dsName,
    "properties.source.name": sourceName,
    "properties.source.retrieved": { $lt: retrieved },
  }).lean().exec();
  numOps += 1;

  return numOps;
});
