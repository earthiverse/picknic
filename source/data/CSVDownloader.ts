import CSVParse = require("csv-parse/lib/sync");
import Fs = require("fs");

import { Downloader } from "./Downloader";

export class CSVDownloader extends Downloader {
  constructor(sourceName: string, sourceURL: string, datasetName: string, datasetURL: string,
    licenseName: string, licenseURL: string) {
    super(sourceName, sourceURL, datasetName, datasetURL, licenseName, licenseURL);

    // We're a CSV downloader, so let's append the extension on.
    this.datasetFile = this.datasetFile + ".csv";
  }

  public async parse(parseFunction: (data: any) => Promise<any>,
    cleanFunction?: () => Promise<number>): Promise<number> {
    // Read & parse the CSV
    const text = Fs.readFileSync(this.datasetFile, "utf8");
    const data = CSVParse(text, { columns: true, ltrim: true });

    return this.parseBase(parseFunction, data, cleanFunction);
  }
}
