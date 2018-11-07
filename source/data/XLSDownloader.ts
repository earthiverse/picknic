import Fs = require("fs");
import Request = require("request-promise-native");
import Xlsx = require("xlsx");

import { Downloader } from "./Downloader";

export class XLSDownloader extends Downloader {
  constructor(sourceName: string, sourceURL: string, datasetName: string, datasetURL: string,
    licenseName: string, licenseURL: string) {
    super(sourceName, sourceURL, datasetName, datasetURL, licenseName, licenseURL);

    // We're an XLS downloader, so let's append the extension on.
    this.datasetFile = this.datasetFile + ".xls";
  }

  public async downloadDataset() {
    if (this.checkDownload()) {
      // It's already good to go.
      return;
    }

    // TODO: Error checking for the Request. If it fails, don't save the file.

    // Download the file
    const data = await Request(this.datasetURL, { encoding: null });
    this.datasetRetrieved = new Date();
    // Save the file
    Fs.writeFileSync(this.datasetFile, data);
  }

  public async parse(parseFunction: (data: any) => Promise<any>,
    cleanFunction?: () => Promise<number>): Promise<number> {
    // Read & parse the XLS
    const workbook = Xlsx.readFile(this.datasetFile);

    let numOps = 0;
    for (const sheetName of workbook.SheetNames) {
      const data: any[] = Xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      numOps += await this.parseBase(parseFunction, data, cleanFunction);
    }
    return numOps;
  }
}
