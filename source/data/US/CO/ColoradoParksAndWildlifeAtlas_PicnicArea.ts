import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "Colorado Parks and Wildlife Atlas";
const dsName = "Picnic Area";
const humanURL = "http://ndismaps.nrel.colostate.edu/arcgis/rest/services/FishingAtlas/CFA_AnglerBase_Map/MapServer/49";
const dsURL = "http://ndismaps.nrel.colostate.edu/arcgis/rest/services/FishingAtlas/CFA_AnglerBase_Map/MapServer/49/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json";
const licenseName = "Copyright CPW Technicians and GIS staff, Chris Johnson, Eric Drummond, Bill Gaertner, and Matt Schulz.";
const licenseURL = "Unknwon";

Download.parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const data of res.features) {
    const lat: number = parseFloat(data.geometry.y);
    const lng: number = parseFloat(data.geometry.x);
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
          "geometry.coordinates": [lng, lat],
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
