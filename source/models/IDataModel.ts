import Mongoose = require("mongoose");

export interface IDataSourceModel {
  retrieved: Date;
  name: string;
  dataset: string;
  url: string;
  id: string;
}

export const DataSourceSchema = new Mongoose.Schema({
  dataset: { type: String, required: false },
  id: { type: String, required: false },
  name: { type: String, required: true },
  retrieved: { type: Date, required: true },
  url: { type: String, required: false },
}, { _id: false });

export interface IDataLicenseModel {
  name: string;
  url: string;
}

export const DataLicenseSchema = new Mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: false },
}, { _id: false });
