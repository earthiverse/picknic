// NOTES:
// * This dataset could be grabbed directly from the ArcGIS server
// * https://rpdgis.sfgov.org/arcgis/rest/services/Production/SFRPD_Assets/FeatureServer/0/query
//     ?where=Asset_Type+%3D+%27Table%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope
//     &inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*
//     &returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=4326&gdbVersion=&returnDistinctValues=false
//     &returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=
//     &outStatistics=&returnZ=false&returnM=false&multipatchOption=&resultOffset=&resultRecordCount=&f=html
// * It looks like there's a few more results on the ArcGIS server, too.

import CSVParse = require("csv-parse/lib/sync");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "SF OpenData";
const dsName = "Assets Maintained by the Recreation and Parks Department";
const humanURL = "https://data.sfgov.org/Culture-and-Recreation/Assets-Maintained-by-the-Recreation-and-Parks-Depa/ays8-rxxc";
const dsURL = "https://data.sfgov.org/api/views/ays8-rxxc/rows.csv?accessType=DOWNLOAD";
const licenseName = "ODC Public Domain Dedication and Licence (PDDL)";
const licenseURL = "http://opendatacommons.org/licenses/pddl/1.0/";

Download.parseDataString(dsName, dsURL, async (res: string) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of CSVParse(res, { columns: true, ltrim: true })) {
    const type: string = data["Asset Type"].toLowerCase();
    if (type !== "table") {
      continue;
    }
    const match: RegExpExecArray = /([\d\.-]+),\s([\d\.-]+)/.exec(data.Geom);
    const lat: number = parseFloat(match[1]);
    const lng: number = parseFloat(match[2]);

    const assetID = data["Asset ID"];
    const subtype: string = data["Asset Subtype"].toLowerCase();
    const mapLabel: string = data["Map Label"];
    const assetName: string = data["Asset Name"];
    const quantity = data.Quantity;

    let comment: string;
    if (subtype === "picnic") {
      comment = "A picnic table.";
    } else if (subtype === "half table") {
      comment = "A half table.";
    } else {
      comment = "A table.";
    }
    comment += " The dataset which this table was obtained from has the following information: \"Label: "
      + mapLabel + ", Asset Name: " + assetName + ", Quantity: " + quantity + "\".";

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": assetID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": assetID,
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
