import Mongoose = require('mongoose')
import { DataSourceModel, DataSourceSchema, DataLicenseModel, DataLicenseSchema } from './IDataModel'

export interface IPark extends Mongoose.Document {
  geometry: {
    type: string
    coordinates: number[]
  }
}