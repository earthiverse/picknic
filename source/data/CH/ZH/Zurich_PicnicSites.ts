import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic';

// Important Fields
let source_name = "Stadt Zürich Open Data"
let dataset_name = "Picknickplatz"
let dataset_url_human = "https://data.stadt-zuerich.ch/dataset/picknickplatz"
let dataset_url_json = "https://data.stadt-zuerich.ch/dataset/picknickplatz/resource/b533a584-6cd8-460c-8c3f-5b71cd0207ca/download/picknickplatz.json"
let license_name = "CC0 1.0 Universal"
let license_url = "https://creativecommons.org/publicdomain/zero/1.0/"

Download.parseDataJSON(dataset_name, dataset_url_json, function (res: any) {
  let database_updates: Array<any> = Array<any>(0);
  let retrieved = new Date();

  res.features.forEach(function (feature: any) {
    // Slice, because there's a third coordinate for elevation that is set to zero in this dataset
    let coordinates = feature.geometry.coordinates.slice(0, 2);

    let comment: string = "name: " + feature.properties.name + ". "
    if (feature.properties.anlageelemente) {
      comment += "anlageelemente: " + feature.properties.anlageelemente + ". "
    }
    let infrastruktur = feature.properties.infrastruktur.replace(/;/g, '').replace(/_/g, ',')
    if (infrastruktur) {
      comment += "infrastruktur: " + infrastruktur + ".";
    }
    comment.trimRight();

    database_updates.push(Picnic.findOneAndUpdate({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "geometry.coordinates": coordinates
    }, {
        $set: {
          "type": "Feature",
          "properties.type": "site",
          "properties.source.retrieved": retrieved,
          "properties.source.name": source_name,
          "properties.source.dataset": dataset_name,
          "properties.source.url": dataset_url_human,
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
  });

  return database_updates;
});