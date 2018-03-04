import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// From https://stackoverflow.com/a/2332821
function capitalize(s: string) {
  return s.toLowerCase().replace(/\b./g, function (a: string) { return a.toUpperCase(); });
};

// Important Fields
let source_name = "Portail des données ouvertes de la Ville de Montréal"
let dataset_name = "Mobilier urbain dans les grands parcs"
let dataset_url_human = "http://donnees.ville.montreal.qc.ca/dataset/mobilierurbaingp"
let dataset_url_json = "http://donnees.ville.montreal.qc.ca/dataset/fb04fa09-fda1-44df-b575-1d14b2508372/resource/65766e31-f186-4ac9-9595-bfcf47ae9158/download/mobilierurbaingp.geojson"
let license_name = "Creative Commons Attribution 4.0 International"
let license_url = "http://creativecommons.org/licenses/by/4.0/"

Download.parseDataJSON(dataset_name, dataset_url_json, function (res: any) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  for (let feature of res.features) {
    // Check if it's a picnic table first
    if (feature.properties.ElementDes == null || feature.properties.ElementDes.search(/table a pique-nique/i) == -1) {
      continue;
    }
    let coordinates = feature.geometry.coordinates;
    let object_id = feature.properties.OBJECTID;
    let park_name = feature.properties.Nom_parc;
    let comment: string;
    if (feature.properties.Nom_parc != null && feature.properties.Nom_parc != "") {
      comment = capitalize(feature.properties.Nom_parc);
    } else {
      comment = undefined;
    }

    database_updates.push(Picnic.findOneAndUpdate({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "properties.source.id": object_id
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "table",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
          "properties.source.id": object_id,
          "properties.license.name": license_name,
          "properties.license.url": license_url,
          "properties.comment": comment,
          "geometry.type": "Point",
          "geometry.coordinates": coordinates
        }
      }, {
        "upsert": true,
        "new": true
      }).exec());
  }

  return database_updates;
});