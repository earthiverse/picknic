import { expect } from "chai";
import "mocha";
import Nconf = require("nconf");
import Path = require("path");

import { Picnic } from "../models/Picnic";

Nconf.file(Path.join(__dirname, "../../config.json"));
const mongoConfig = Nconf.get("mongo");

describe("Picnic Model", async () => {
  it("'coordinates' with 2 or 3 terms is valid", async () => {
    const picnic = new Picnic();

    picnic.geometry.coordinates = [10, 20];
    let error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.be.undefined;

    picnic.geometry.coordinates = [10, 20, 30];
    error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.be.undefined;

    picnic.geometry.coordinates = [null, null];
    error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;

    picnic.geometry.coordinates = [undefined, undefined];
    error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;

    picnic.geometry.coordinates = [null, undefined, null];
    error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;
  });

  it("'coordinates' with < 2 or > 3 terms is invalid.", async () => {
    const picnic = new Picnic();

    picnic.geometry.coordinates = [10];
    let error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;

    picnic.geometry.coordinates = [10, 20, 30, 40];
    error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;
  });

  it("'coordinates' not conforming to WGS84 is invalid", async () => {
    const picnic = new Picnic();

    picnic.geometry.coordinates = [-181, 50]; // Invalid longitude
    let error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;

    picnic.geometry.coordinates = [181, 50]; // Invalid longitude
    error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;

    picnic.geometry.coordinates = [50, 91]; // Invalid latitude
    error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;

    picnic.geometry.coordinates = [50, -91]; // Invalid latitude
    error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;

    picnic.geometry.coordinates = [-181, 91]; // Invalid latitude & longitude
    error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;
  });

  it("'table' with count > 1 is invalid", async () => {
    const picnic = new Picnic();

    picnic.geometry.coordinates = [10, 20];
    picnic.properties.type = "table";
    picnic.properties.count = 2;
    const error = picnic.validateSync();
    // tslint:disable-next-line:no-unused-expression
    expect(error).to.not.be.undefined;
  });
});
