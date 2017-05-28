import Mongoose = require('mongoose');
import { DataSourceModel, DataSourceSchema, DataLicenseModel, DataLicenseSchema } from './IDataModel';

export interface ITable extends Mongoose.Document {
  type: string;
  properties: {
    type: string;
    count: number;
    source: DataSourceModel;
    license: DataLicenseModel;
    accessible: boolean;
    sheltered: boolean;
    comment: string;
  };
  geometry: {
    type: string;
    coordinates: number[];
  }
};

export const TableSchema = new Mongoose.Schema({
  type: { type: String, required: true, default: "Point" },
  properties: {
    type: { type: String, required: true, default: "table" },
    count: { type: Number, required: false },
    source: DataSourceSchema,
    license: DataLicenseSchema,
    accessible: { type: Boolean, required: false },
    sheltered: { type: Boolean, required: false },
    comment: { type: String, required: false }
  },
  geometry: {
    type: { type: String, required: true },
    coordinates: { type: [Number], required: true }
  }
}, { collection: 'tables' });

export const Table = Mongoose.model<ITable>('Table', TableSchema);
