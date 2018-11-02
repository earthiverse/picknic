import Proj4 = require("proj4");
import { Picnic } from "../../../models/Picnic";
import { capitalCase, parseDataJSON } from "../../Download";

// Important Fields
const sourceName = "City of White Rock Open Data Portal";
const dsName = "Dedication Items";
const dsHumanURL = "http://data.whiterockcity.ca/dataset/parkitem";
const dsURL = "http://wroms.whiterockcity.ca/opendata/GIS/Data/Spatial/Parks/JSON/ParkItem.json";
const licenseName = "Open Government License - British Columbia";
const licenseURL = "https://www2.gov.bc.ca/gov/content/data/open-data/open-government-license-bc";

parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const parkItem of res.features) {
    const type: string = parkItem.properties.Item_Type;
    const itemID: string = parkItem.properties.Item_Id;
    if (type !== "PICNIC TABLE") {
      continue;
    }
    // The data for this dataset is in EPSG:26910.
    // See: http://spatialreference.org/ref/epsg/nad83-utm-zone-10n/
    const coordinates =
      Proj4("+proj=utm +zone=10 +ellps=GRS80 +datum=NAD83 +units=m +no_defs", "WGS84", parkItem.geometry.coordinates);
    const parkName: string = parkItem.properties.Park_Name.trim();
    let comment: string;
    if (parkName) {
      comment = "Located in " + capitalCase(parkName) + ".";
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": itemID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": itemID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": dsHumanURL,
          "properties.type": "table",
          "type": "Feature",
        },
      }, {
        upsert: true,
      });
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
