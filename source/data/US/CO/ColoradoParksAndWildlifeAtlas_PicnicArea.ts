import { Picnic } from "../../../models/Picnic";
import { parseDataArcGIS } from "../../Download";

// Important Fields
const sourceName = "Colorado Parks and Wildlife Atlas";
const dsName = "Picnic Area";
const gisURL = "http://ndismaps.nrel.colostate.edu/arcgis/rest/services/FishingAtlas/CFA_AnglerBase_Map/MapServer/49";
const licenseName = "Copyright CPW Technicians and GIS staff, Chris Johnson, Eric Drummond, Bill Gaertner, and Matt Schulz.";
const licenseURL = "Unknwon";

parseDataArcGIS(dsName, gisURL, "1=1", "*", 1000, async (res: any[]) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res) {
    const coordinates: any = [data.geometry.x, data.geometry.y];
    const objID = data.attributes.GlobalID;

    let accessible: boolean;
    if (data.attributes.HANDI_ACCESS === "Yes") {
      accessible = true;
    }

    let comment: string = "";
    if (data.attributes.COMMENTS) {
      comment = data.attributes.COMMENTS;
    }
    const propname: string = data.attributes.PROPNAME;
    if (propname) {
      comment += " Located in " + propname + ".";
    }
    const facName: string = data.attributes.FAC_NAME;
    if (facName && facName.trim()) {
      comment += " Located at " + facName + ".";
    }
    const material = data.attributes.MATERIAL;
    if (material === "1") {
      comment += " The table is made of metal.";
    } else if (material === "2") {
      comment += " The table is made of wood.";
    }
    const count = data.attributes.SITE_COUNT;
    if (count === 0) {
      // No tables at this location, skip it.
      continue;
    } else if (count > 0) {
      comment += " There are " + count + " tables.";
    }
    comment = comment.trimLeft();

    let sheltered: boolean;
    if (data.attributes.TYPE_DETAIL === "Sheltered" || (facName && facName.search("Sheltered") !== -1)) {
      sheltered = true;
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
          "properties.sheltered": sheltered,
          "properties.source.dataset": dsName,
          "properties.source.id": objID,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": gisURL,
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
