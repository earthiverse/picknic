import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "data.seattle.gov";
const datasetName = "Picnic Table";
const humanURL = "https://data.seattle.gov/dataset/Picnic-Table/2kfp-z97k";
const dsURL = "https://data.seattle.gov/api/views/2kfp-z97k/rows.csv?accessType=DOWNLOAD";
const licenseName = "Unspecified (Public Domain?)";
const licenseURL = "https://en.wikipedia.org/wiki/Public_domain";

Download.parseDataString(datasetName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const match: RegExpExecArray = /([\d\.-]+)\s([\d\.-]+)/.exec(data.the_geom);
    const lng: number = parseFloat(match[1]);
    const lat: number = parseFloat(match[2]);
    const tableSize = data.TABLE_SIZE;
    const tablePad = data.TABLE_PAD;

    let comment: string = "";
    if (tableSize) {
      comment = "Table Size (from dataset): '" + tableSize + "'.";
    }
    if (tablePad) {
      comment += " Table pad (from dataset): '" + tablePad + "'.";
    }
    comment = comment.trim();

    let id = data.AMWOID.trim(); // This dataset is missing the ID on a couple tables...
    if (!id) {
      id = undefined;
    }

    await Picnic.updateOne({
      "properties.source.dataset": datasetName,
      "properties.source.id": id,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": datasetName,
          "properties.source.id": id,
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
    "properties.source.dataset": datasetName,
    "properties.source.name": sourceName,
    "properties.source.retrieved": { $lt: retrieved },
  }).lean().exec();
  numOps += 1;

  return numOps;
});
