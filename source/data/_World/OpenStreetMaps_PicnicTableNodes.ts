import Fs = require("fs");
import Xml2js = require("xml2js");

import { Picnic } from "../../models/Picnic";
import { CommentCreator } from "../CommentCreator";
import { Downloader } from "../Downloader";

export class OSMDownloader extends Downloader {
  constructor() {
    super(
      "Open Street Maps",
      "https://wiki.openstreetmap.org/wiki/Overpass_API",
      "Leisure Picnic Table",
      "http://overpass-api.de/api/xapi?node[leisure=picnic_table]",
      "Open Data Commons Open Database License (ODbL)",
      "https://opendatacommons.org/licenses/odbl/");

    // We're going to pull XML.
    this.datasetFile = this.datasetFile + ".xml";
  }

  public async parse(parseFunction: (data: any) => Promise<any>,
    cleanFunction?: () => Promise<number>): Promise<number> {
    // Read & parse the CSV
    const text = Fs.readFileSync(this.datasetFile, "utf8");

    const data = await new Promise<any[]>((resolve) => {
      Xml2js.parseString(text, (error, xmlData) => {
        if (error) {
          throw error;
        }
        resolve(xmlData.osm.node);
      });
    });

    return this.xmlParse(parseFunction, data, cleanFunction);
  }

  protected async xmlParse(parseFunction: (data: any) => Promise<number>, data: any[],
    cleanFunction?: () => Promise<number>) {
    await this.connect();

    // Parse the data
    for (const datum of data) {
      const newDatum: any = {
        id: datum.$.id,
        lat: datum.$.lat,
        lon: datum.$.lon,
      };
      for (const tag of datum.tag) {
        newDatum[tag.$.k] = tag.$.v;
      }
      await parseFunction(newDatum);
      this.numOps += 1;
    }
    if (cleanFunction) {
      this.numOps += await cleanFunction();
    } else {
      this.numOps += await this.defaultCleanFunction();
    }

    await this.disconnect();

    return this.numOps;
  }
}

export const downloader = new OSMDownloader();

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return downloader.parse(
    async (data: any) => {
      const coordinates = [data.lon, data.lat];
      let sheltered;
      if (data.covered === "yes" || data.amenity === "shelter") {
        sheltered = true;
      } else if (data.covered === "no") {
        sheltered = false;
      }
      const id = data.id;
      const comment = new CommentCreator(data.description, data.note);

      // TODO: data.seats
      // TODO: data.material or data["picnic_table:material"]
      // TODO: data.fireplace
      // TODO: data.name
      // TODO: data.colour
      // TODO: data.backrest
      // TODO: data.mapillary
      // TODO: data.bin

      // Look for a table close by, because this dataset will contain duplicates
      const nearTable = await Picnic.findOne({
        "geometry": {
          $near: {
            $geometry: {
              coordinates,
              type: "Point",
            },
            $maxDistance: 50, // We're checking within 50 meters
          },
        },
        "properties.source.name": {
          $ne: downloader.sourceName,
        },
      }).lean().exec();
      if (!nearTable) {
        // There's no nearby table provided by another dataset, so let's add this one.
        return await downloader.addTable({
          geometry: {
            coordinates,
          },
          properties: {
            comment: comment.toString(),
            sheltered,
            source: {
              id,
            },
          },
        });
      }
    });
}

if (require.main === module) {
  run();
}
