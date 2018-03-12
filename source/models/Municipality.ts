import Mongoose = require('mongoose');
import Nconf = require("nconf");
import Path = require("path");
import { DataSourceModel, DataSourceSchema, DataLicenseModel, DataLicenseSchema } from './IDataModel';

// Load Configuration
Nconf.file(Path.join(__dirname, "../../config.json"));
let mongo = Nconf.get("mongo");

export interface IMunicipality extends Mongoose.Document {
  type: string;
  properties: {
    country: string;
    subdivision: string;
    name: string;
    type: string;
    twitter: string[];
  };
  geometry: {
    type: string;
    coordinates: number[];
  }
};

export const MunicipalitySchema = new Mongoose.Schema({
  type: { type: String, required: true, default: "Point" },
  properties: {
    country: { type: String, required: true },
    subdivision: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    twitter: { type: [String], required: false }
  },
  geometry: {
    type: { type: String, required: true },
    coordinates: { type: [Number], required: true }
  }
}, { collection: mongo.collections.municipality });
MunicipalitySchema.index({ geometry: '2dsphere' });

export const Municipality = Mongoose.model<IMunicipality>('Municipality', MunicipalitySchema);