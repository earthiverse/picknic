import { expect } from "chai";
import "mocha";
import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");

import Edmonton = require("../data/CA/AB/Edmonton_PicnicTables");
import { Picnic } from "../models/Picnic";

describe("Download Scripts", async () => {
  it("Edmonton", async () => {
    // Test that the script reported it inserted stuff
    const numOps = await Edmonton.run();
    expect(numOps).to.be.greaterThan(0);

    // Test that the script actually inserted the amount of stuff that it did
    Nconf.file(Path.join(__dirname, "../../config.json"));
    const mongoConfig = Nconf.get("mongo");
    await Mongoose.connect(mongoConfig.picknic, { useNewUrlParser: true });
    Mongoose.set("useCreateIndex", true);
    const numResults = await Picnic.countDocuments({
      "properties.source.dataset": Edmonton.datasetName,
      "properties.source.name": Edmonton.sourceName,
    }).lean().exec();
    expect(numOps - numResults).to.be.equal(1);

    await Mongoose.disconnect();
  }).timeout(60000);
});
