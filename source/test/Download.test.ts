import { expect } from "chai";
import "mocha";
import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");

import { downloader as EdmontonDownloader, run as EdmontonRun } from "../data/CA/AB/Edmonton_PicnicTables";
import { Picnic } from "../models/Picnic";

describe("Download Scripts", async () => {
  describe("Alberta", async () => {
    it("Edmonton", async () => {
      // Test that the script reported it inserted stuff
      const numOps = await EdmontonRun();
      expect(numOps).to.be.greaterThan(0);

      // Test that the script actually inserted the amount of stuff that it did
      Nconf.file(Path.join(__dirname, "../../config.json"));
      const mongoConfig = Nconf.get("mongo");
      await Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true });
      Mongoose.set("useCreateIndex", true);
      const numResults = await Picnic.countDocuments({
        "properties.source.dataset": EdmontonDownloader.datasetName,
        "properties.source.name": EdmontonDownloader.sourceName,
      }).lean().exec();
      expect(numOps).to.be.equal(numResults + 1);
      await Mongoose.disconnect();
    }).timeout(60000);
  });
});
