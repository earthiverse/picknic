import { Picnic } from "../../../models/Picnic";
import { capitalize, parseDataJSON } from "../../Download";

// Important Fields
const sourceName = "Portail des données ouvertes de la Ville de Montréal";
const dsName = "Mobilier urbain dans les grands parcs";
const humanURL = "http://donnees.ville.montreal.qc.ca/dataset/mobilierurbaingp";
const dsURL = "http://donnees.ville.montreal.qc.ca/dataset/fb04fa09-fda1-44df-b575-1d14b2508372/resource/65766e31-f186-4ac9-9595-bfcf47ae9158/download/mobilierurbaingp.geojson";
const licenseName = "Creative Commons Attribution 4.0 International";
const licenseURL = "http://creativecommons.org/licenses/by/4.0/";

parseDataJSON(dsName, dsURL, async (res: any) => {
  let numOps = 0;
  const retrieved = new Date();

  for (const feature of res.features) {
    // Check if it's a picnic table first
    if (feature.properties.ElementDes == null || feature.properties.ElementDes.search(/table a pique-nique/i) === -1) {
      continue;
    }
    const coordinates = feature.geometry.coordinates;
    const objectID = feature.properties.OBJECTID;
    let comment: string;
    if (feature.properties.Nom_parc) {
      comment = capitalize(feature.properties.Nom_parc);
    }

    await Picnic.updateOne({
      "properties.source.dataset": dsName,
      "properties.source.id": objectID,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": coordinates,
          "geometry.type": "Point",
          "properties.comment": comment,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.id": objectID,
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
