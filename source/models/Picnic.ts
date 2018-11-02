import Mongoose = require("mongoose");
import Nconf = require("nconf");
import Path = require("path");
import { DataLicenseSchema, DataSourceSchema, IDataLicenseModel, IDataSourceModel } from "./IDataModel";

// Load Configuration
Nconf.file(Path.join(__dirname, "../../config.json"));
const mongo = Nconf.get("mongo");

export interface IPicnic {
  type?: string;
  properties?: {
    type?: string
    count?: number
    source?: IDataSourceModel
    license?: IDataLicenseModel
    accessible?: boolean
    sheltered?: boolean
    comment?: string
    user?: string,
  };
  geometry?: {
    type?: string
    coordinates?: number[],
  };
}

export interface IPicnicMongoose extends IPicnic, Mongoose.Document { }

export const PicnicSchema = new Mongoose.Schema({
  geometry: {
    coordinates: { type: [Number], required: true },
    type: { type: String, required: true, enum: ["Point"], default: "Point" },
  },
  properties: {
    accessible: { type: Boolean, required: false },
    comment: { type: String, required: false },
    count: { type: Number, min: 1, required: false },
    license: DataLicenseSchema,
    sheltered: { type: Boolean, required: false },
    source: DataSourceSchema,
    type: { type: String, required: true, enum: ["site", "table"], default: "table" },
    user: { type: String, required: false },
  },
  type: { type: String, required: true, default: "Feature" },
}, { collection: mongo.collections.picnic });
PicnicSchema.index({ geometry: "2dsphere" });
PicnicSchema.index({ "properties.source.name": 1, "properties.source.dataset": 1, "properties.source.id": 1 });

export const Picnic = Mongoose.model<IPicnicMongoose>("Picnic", PicnicSchema);
