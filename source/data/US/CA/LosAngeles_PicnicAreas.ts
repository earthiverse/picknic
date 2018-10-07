import CSVParse = require("csv-parse/lib/sync");
import Striptags = require("striptags");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Los Angeles Geohub";
const dsName = "Picnic Areas";
const humanURL = "http://geohub.lacity.org/datasets/678499fcf0b84e06ac80a37ae7cde7e3_9";
const dsURL = "http://geohub.lacity.org/datasets/678499fcf0b84e06ac80a37ae7cde7e3_9.csv";
const licenseName = "Public Domain";
const licenseURL = "https://creativecommons.org/publicdomain/mark/1.0/";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);

    const ext_id = data.ext_id;

    let comment: string = data.Name.trim();
    if (data.hours.trim()) {
      comment += ". " + Striptags(data.hours).trim();
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": ext_id,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": ext_id,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": humanURL,
          "properties.type": "site",
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
