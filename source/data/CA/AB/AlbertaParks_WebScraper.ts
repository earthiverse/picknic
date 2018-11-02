import Fs = require("fs");
import Request = require("request-promise-native");

import { Downloader } from "../../Downloader";

export class AlbertaParksWebScraper extends Downloader {
  constructor() {
    super(
      "Alberta Parks",
      "https://www.albertaparks.ca/albertaparksca/visit-our-parks/camping/by-activity-map/",
      "By Activity Map",
      "https://www.albertaparks.ca/albertaparksca/visit-our-parks/camping/by-activity-map/",
      "Government of Alberta Terms of Use",
      "https://www.alberta.ca/disclaimer.aspx");

    // We're going to pull JSON.
    this.datasetFile = this.datasetFile + ".json";
  }

  public async downloadDataset() {
    // There is a variable that contains a JSON object for every park. We're going to get that information.
    this.datasetRetrieved = new Date();
    let html: string = await Request(this.datasetURL);
    // NOTE: There is a bug on the website where a variable contains improper JSON. We're going to fix it.
    html = html.replace(/"long"\s*:\s*-\s+([\d\.]+)/g, "\"long\":-$1");
    const regexData: RegExpExecArray = /var\s*sites\s*=\s*(\[[\s\S]+\]\s*);/.exec(html);
    let sitesData: any[] = JSON.parse(regexData[1]);

    /* TODO: If you go to the sub url for every parks page, sometimes there's comments about picnic tables existing
             or not existing. This script could be improved to look for that text. Look at the commit history for
             this file to see what was pulled before. */

    // If the park doesn't specify that it's okay for picnics, skip it.
    sitesData = sitesData.filter((datum) => datum.type.search(/picnic/i) !== -1);

    // Save the file
    Fs.writeFileSync(this.datasetFile, JSON.stringify(sitesData));
  }

  public parse(parseFunction: (data: any) => Promise<any>, cleanFunction?: () => Promise<number>): Promise<number> {
    // Read & parse the JSON file
    const text = Fs.readFileSync(this.datasetFile, "utf8");
    const data = JSON.parse(text);

    return this.parseBase(parseFunction, data, cleanFunction);
  }
}

export const downloader = new AlbertaParksWebScraper();

export async function run(): Promise<number> {
  await downloader.downloadDataset();
  return downloader.parse(
    async (data: any) => {
      const parkName = `${data.label.substring(0, data.label.lastIndexOf(" "))} ${data.subTitle}`;
      const comment = `${parkName}. There may be no picnic tables at this site.`;
      const coordinates = [data.long, data.lat];

      return await downloader.addTable({
        geometry: {
          coordinates,
        },
        properties: {
          comment,
          type: "site",
        },
      });
    });
}

if (require.main === module) {
  run();
}
