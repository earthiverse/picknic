import Fs = require("fs");
import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");
import Request = require("request-promise-native");
import { IPicnic, Picnic } from "../models/Picnic";

export abstract class Downloader {
  /** The name of the source of the data. */
  public sourceName: string;
  /** A human friendly URL that is used for attribution to where the data came from / can be obtained. */
  public sourceURL: string;
  /** The name of the dataset from the source. */
  public datasetName: string;
  /** A URL that contains a link to the data. */
  public datasetURL: string;
  /** The license name that applies to the data in the dataset. */
  public licenseName: string;
  /** A URL to go with licenseName that contains all the juicy details. */
  public licenseURL: string;

  /** Number of operations performed on the database. */
  protected numOps: number;
  /** The downloader will download the file to this path. */
  protected datasetFile: string;
  /** The date & time the file was downloaded */
  protected datasetRetrieved: Date;

  constructor(sourceName: string, sourceURL: string, datasetName: string, datasetURL: string,
    licenseName: string, licenseURL: string) {
    this.sourceName = sourceName;
    this.sourceURL = sourceURL;
    this.datasetName = datasetName;
    this.datasetURL = datasetURL;
    this.licenseName = licenseName;
    this.licenseURL = licenseURL;

    this.numOps = 0;
    this.datasetFile = Path.join(__dirname, this.sourceName + "." + this.datasetName);
  }

  /** Connect to Mongo */
  public async connect() {
    // Load Configuration
    Nconf.file(Path.join(__dirname, "../../config.json"));
    const mongoConfig = Nconf.get("mongo");
    await Mongoose.connect(mongoConfig.picknic);
  }

  /** Disconnect from Mongo */
  public async disconnect() {
    await Mongoose.disconnect();
  }

  public async addTable(data?: IPicnic) {
    // Add license & source data
    data.properties.license = {
      name: this.licenseName,
      url: this.licenseURL,
    };
    data.properties.source = {
      dataset: this.datasetName,
      id: data.properties.source.id,
      name: this.sourceName,
      retrieved: this.datasetRetrieved,
      url: this.sourceURL,
    };

    if (data.properties.type !== "site" && (data.properties.count && data.properties.count !== 1)) {
      // TODO: Is this kind of logic checking okay here? Should it be enforced in the database somehow? Or the schema?
      throw new Error("You can only add a 'count' to a 'site'.");
    }

    await Picnic.create(data);
    return 1;
  }

  /** Download the dataset */
  public async downloadDataset() {
    // TODO: Error checking for the Request. If it fails, don't overwrite the file with nothing.
    // TODO: This function could be improved by checking the file date and seeing if we need to download it again.
    // TODO: The above check could be determined by a parameter in the config file specifying an age limit.

    // Download the file
    const data = await Request(this.datasetURL);
    this.datasetRetrieved = new Date();
    // Save the file
    Fs.writeFileSync(this.datasetFile, data);
  }

  public async abstract parse(parseFunction: (data: any) => Promise<any>,
    cleanFunction?: () => Promise<number>): Promise<number>;

  public async defaultCleanFunction() {
    await Picnic.deleteMany({
      "properties.source.dataset": this.datasetName,
      "properties.source.name": this.sourceName,
      "properties.source.retrieved": { $lt: this.datasetRetrieved },
    }).lean().exec();
    return 1;
  }

  /** This is the main loop that all parse functions use. */
  protected async parseBase(parseFunction: (data: any) => Promise<number>, data: any[],
    cleanFunction?: () => Promise<number>) {
    await this.connect();

    // Parse the data
    for (const datum of data) {
      await parseFunction(datum);
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
