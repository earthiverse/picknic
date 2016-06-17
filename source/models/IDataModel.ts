import Mongoose = require('mongoose');

export interface DataSourceModel {
  retrieved: Date;
  name: string;
  url: string;
};

export const DataSourceSchema = new Mongoose.Schema({
  retrieved: { type: Date, required: true },
  name: { type: String, required: true },
  url: { type: String, required: false }
});

export interface DataLicenseModel {
  name: string;
  url: string;
};

export const DataLicenseSchema = new Mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: false }
});
