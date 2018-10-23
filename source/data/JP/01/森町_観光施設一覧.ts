import CSVParse = require("csv-parse/lib/sync");
import Conv = require("iconv-lite");

import { Picnic } from "../../../models/Picnic";
import Download = require("../../Download");

// Important Fields
const sourceName = "北海道オープンデータポータル";
const dsName = "観光施設一覧【北海道森町】";
const humanURL = "https://www.harp.lg.jp/opendata/dataset/154.html";
const dsURL = "https://www.harp.lg.jp/opendata/dataset/154/resource/206/013455_tourism.csv";
const licenseName = "Attribution 4.0 International (CC BY 4.0)";
const licenseURL = "https://creativecommons.org/licenses/by/4.0/deed.en";

// NOTE: The file is encoded as Shift_JIS so we can't use the normal parseDataString.
// It's not a big deal, but it's the only reason we have iconv-lite as a dependence right now...
Download.parseDataBinary(dsName, dsURL, async (res: Uint8Array) => {
  let numOps = 0;
  const retrieved = new Date();

  const csv = CSVParse(Conv.decode(Buffer.from(res), "Shift_JIS"), { columns: true, ltrim: true });
  for (const data of csv) {
    const lat = parseFloat(data.緯度);
    const lng = parseFloat(data.経度);

    const notes: string = data.備考.toLowerCase();
    if (notes.search("テーブル付き") === -1) {
      continue;
    }

    await Picnic.updateOne({
      "geometry.coordinates": [lng, lat],
      "properties.source.dataset": dsName,
      "properties.source.name": sourceName,
    }, {
        $set: {
          "geometry.coordinates": [lng, lat],
          "geometry.type": "Point",
          "properties.comment": notes,
          "properties.license.name": licenseName,
          "properties.license.url": licenseURL,
          "properties.source.dataset": dsName,
          "properties.source.name": sourceName,
          "properties.source.retrieved": retrieved,
          "properties.source.url": humanURL,
          "properties.type": "site",
          "type": "Feature",
        },
      }, {
        upsert: true,
      }).lean().exec();
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
