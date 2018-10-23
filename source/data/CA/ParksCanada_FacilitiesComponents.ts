// NOTES:
// * Once upon a time 'Component_Type_Composante' became numbers instead of text, and it screwed up the script.

import { Picnic } from "../../models/Picnic";
import Download = require("../Download");

// Important Fields
const sourceName = "Government of Canada Open Government Portal";
const dsName = "Parks Canada Facilities Components";
const humanURL = "http://open.canada.ca/data/en/dataset/78af8288-d785-49e6-8773-e21a707d14ca";
const dsURL = "http://opendata.arcgis.com/datasets/c2bd1dec9aee44ad9403eaff2a7faadd_0.geojson";
const licenseName = "Open Government License - Canada (Version 2.0)";
const licenseURL = "http://open.canada.ca/en/open-government-licence-canada";

Download.parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const feature of res.features) {
    // Check if it's a picnic table first
    if (feature.properties.Component_Type_Composante == null
      || feature.properties.Component_Type_Composante.search(/Picnic/i) === -1) {
      continue;
    }
    const coordinates = feature.geometry.coordinates;
    const objID = feature.properties.OBJECTID;
    let accessible: boolean;
    if (feature.properties.Accessible.search(/Yes/i) !== -1) {
      accessible = true;
    } else if (feature.properties.Accessible) {
      accessible = false;
    }
    let comment: string;
    if (feature.properties.Name_e) {
      comment = feature.properties.Name_e;
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.accessible": accessible,
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objID,
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
