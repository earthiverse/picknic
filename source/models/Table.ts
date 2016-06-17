/// <reference path="../../typings/index.d.ts" />
import Mongoose = require('mongoose');
import { DataSourceModel, DataSourceSchema, DataLicenseModel, DataLicenseSchema } from './IDataModel';

export interface ITable extends Mongoose.Document {
  properties: {
    source: DataSourceModel;
    license: DataLicenseModel;
    accessible: boolean;
    sheltered: boolean;
    comment: string;
  }
};

export const TableSchema = new Mongoose.Schema({
  source: DataSourceSchema,
  license: DataLicenseSchema,
  accessible: { type: Boolean, required: false },
  sheltered: { type: Boolean, required: false },
  comment: { type: String, required: false }
}, {collection: 'tables'});

export const Table = Mongoose.model<ITable>('Table', TableSchema);
