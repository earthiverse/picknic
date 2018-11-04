import Fs = require("fs");
import Request = require("request-promise-native");

import { Downloader } from "./Downloader";

export class ArcGISDownloader extends Downloader {
  constructor(sourceName: string, sourceURL: string, datasetName: string,
    licenseName: string, licenseURL: string) {
    super(sourceName, sourceURL, datasetName, sourceURL, licenseName, licenseURL);

    // We download JSON, so let's append the extension on.
    this.datasetFile = this.datasetFile + ".json";
  }

  public async downloadDataset(where: string = "1=1", outFields: string = "*", maxRecCount: number = 1000) {
    this.datasetRetrieved = new Date();

    // Download the file
    let offset = 0;
    const data = [];
    while (true) {
      const body = await Request({
        json: true,
        uri: this.datasetURL + "/query?where=" + where +
          "&outFields=" + outFields +
          "&resultOffset=" + (offset === 0 ? "" : offset) + // This is important for servers without pagination support.
          "&returnGeometry=true&outSR=4326&f=json",
      });
      // Add our new data
      for (const feature of body.features) {
        data.push(feature);
      }
      if (data.length - offset < maxRecCount || data.length === 0) {
        // No more records
        break;
      }
      offset += maxRecCount;
    }

    Fs.writeFileSync(this.datasetFile, JSON.stringify(data));
  }

  public async parse(parseFunction: (data: any) => Promise<any>,
    cleanFunction?: () => Promise<number>): Promise<number> {
    // Read & parse the JSON file
    const text = Fs.readFileSync(this.datasetFile, "utf8");
    const data = JSON.parse(text);

    return this.parseBase(parseFunction, data, cleanFunction);
  }
}
