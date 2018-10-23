// NOTES:
// * This dataset has no ID field identifying individual picnic tables (as of 2018-05-14)

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Stadt Zürich Open Data";
const dsName = "Picknickplatz";
const humanURL = "https://data.stadt-zuerich.ch/dataset/picknickplatz";
const dsURL = "https://data.stadt-zuerich.ch/dataset/picknickplatz/resource/b533a584-6cd8-460c-8c3f-5b71cd0207ca/download/picknickplatz.json";
const licenseName = "CC0 1.0 Universal";
const licenseURL = "https://creativecommons.org/publicdomain/zero/1.0/";

Download.parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const feature of res.features) {
    // Slice, because there's a third coordinate for elevation that is set to zero in this dataset
    const coordinates = feature.geometry.coordinates.slice(0, 2);

    let comment: string = "name: " + feature.properties.name + ". ";
    if (feature.properties.anlageelemente) {
      comment += "anlageelemente: " + feature.properties.anlageelemente + ". ";
    }
    const infrastruktur = feature.properties.infrastruktur.replace(/;/g, "").replace(/_/g, ",");
    if (infrastruktur) {
      comment += "infrastruktur: " + infrastruktur + ".";
    }
    comment.trimRight();

    await Picnic.updateOne({
      "geometry.coordinates": coordinates,
      "properties.source.dataset": dsName,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
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
