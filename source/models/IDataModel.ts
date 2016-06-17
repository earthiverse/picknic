import Mongoose = require('mongoose');

export interface IDataModel {
  source: {
    retrieved: Date;
    name: string;
    url: string;
  };
  license: {
    name: string;
    url: string;
  };
};

export const DataSourceSchema = new Mongoose.Schema({
  retrieved: { type: Date, required: true },
  name: { type: String, required: true },
  url: { type: String, required: false }
});

export const DataLicenseSchema = new Mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: false }
});
