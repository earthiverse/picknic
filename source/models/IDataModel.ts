import Mongoose = require('mongoose');

export interface DataSourceModel {
  retrieved: Date;
  name: string;
  dataset: string;
  url: string;
  id: string;
};

export const DataSourceSchema = new Mongoose.Schema({
  retrieved: { type: Date, required: true },
  name: { type: String, required: true },
  dataset: { type: String, required: false },
  url: { type: String, required: false },
  id: { type: String, required: false }
}, { _id: false });

export interface DataLicenseModel {
  name: string;
  url: string;
};

export const DataLicenseSchema = new Mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: false }
}, { _id: false });
