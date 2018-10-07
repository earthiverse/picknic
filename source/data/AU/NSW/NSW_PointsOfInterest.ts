// NOTES:
// This script is a little different, because ARCGIS limits the # of returned results to 1000, and I make two passes to
// get them. Improvements could be made to read a tag that gets set in the first result that says it was limited, and
// continue (increment by 1000), but for now this is easier.

import { Picnic } from "../../../models/Picnic";
import { capitalize, parseDataJSON } from "../../Download";

// Important Fields
const sourceName = "NSW Spatial Data Catalogue";
const dsName = "NSW Points of Interest";
const dsHumanURL = "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer";
const dsURL1 = "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer/0/query?where=poitype%3D%27Picnic+Area%27&outFields=poiname,objectid&returnGeometry=true&resultOffset=0&resultRecordCount=1000&f=json";
const dsURL2 = "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_POI/MapServer/0/query?where=poitype%3D%27Picnic+Area%27&outFields=poiname,objectid&returnGeometry=true&resultOffset=1000&resultRecordCount=1000&f=json";
const licenseName = "Creative Commons Attribution 3.0 Australia";
const licenseURL = "https://creativecommons.org/licenses/by/3.0/au/legalcode";

const retrieved = new Date();
const parsingFunction = async (res: any) => {
  let numOps = 0;

  for (const result of res.features) {
    let comment: string;
    const name: string = result.attributes.poiname;
    if (name) {
      comment = "Located in " + capitalize(name) + ".";
    }
    const coordinates: any = [result.geometry.x, result.geometry.y];
    const objectid: any = result.attributes.objectid;

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectid,
      "properties.source.url": dsHumanURL,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objectid,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": dsHumanURL,
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
};

const runSync = async () => {
  await parseDataJSON(dsName, dsURL1, parsingFunction);
  await parseDataJSON(dsName, dsURL2, parsingFunction);
};
runSync();
