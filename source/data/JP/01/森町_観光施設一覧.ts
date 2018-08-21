import CSVParse = require('csv-parse/lib/sync')
import Conv = require('iconv-lite')

import { Download } from '../../Download'
import { Picnic } from '../../../models/Picnic'

// Important Fields
let source_name = "北海道オープンデータポータル"
let dataset_name = "観光施設一覧【北海道森町】"
let dataset_url_human = "https://www.harp.lg.jp/opendata/dataset/154.html"
let dataset_url_csv = "https://www.harp.lg.jp/opendata/dataset/154/resource/206/013455_tourism.csv"
let license_name = "Attribution 4.0 International (CC BY 4.0)"
let license_url = "https://creativecommons.org/licenses/by/4.0/deed.en"

// NOTE: The file is encoded as Shift_JIS so we can't use the normal parseDataString. It's not a big deal, but it's the only reason we have iconv-lite as a dependence right now...
Download.parseDataBinary(dataset_name, dataset_url_csv, async function (res: Uint8Array) {
  let database_updates = 0
  let retrieved = new Date()

  let csv = CSVParse(Conv.decode(Buffer.from(res), "Shift_JIS"), { columns: true, ltrim: true })
  for (let data of csv) {
    let lat = parseFloat(data["緯度"])
    let lng = parseFloat(data["経度"])

    let notes: string = data["備考"].toLowerCase()
    if (notes.search("テーブル付き") == -1) {
      continue
    }

    await Picnic.updateOne({
      "properties.source.name": source_name,
      "properties.source.dataset": dataset_name,
      "geometry.coordinates": [lng, lat]
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
          "properties.comment": notes,
          "geometry.type": "Point",
          "geometry.coordinates": [lng, lat]
        }
      }, {
        upsert: true
      }).lean().exec()
    database_updates += 1
  }

  // Remove old tables from this data source
  await Picnic.deleteMany({
    "properties.source.name": source_name,
    "properties.source.dataset": dataset_name,
    "properties.source.retrieved": { $lt: retrieved }
  }).lean().exec()
  database_updates += 1

  return database_updates
})