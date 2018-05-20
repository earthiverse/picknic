import Mongoose = require('mongoose')
import Nconf = require("nconf")
import Path = require("path")
import { DataSourceModel, DataSourceSchema, DataLicenseModel, DataLicenseSchema } from './IDataModel'

// Load Configuration
Nconf.file(Path.join(__dirname, "../../config.json"))
let mongo = Nconf.get("mongo")

export interface IPicnic extends Mongoose.Document {
  type: string
  properties: {
    type: string
    count: number
    source: DataSourceModel
    license: DataLicenseModel
    accessible: boolean
    sheltered: boolean
    comment: string
    user: string
  }
  geometry: {
    type: string
    coordinates: number[]
  }
}

export const PicnicSchema = new Mongoose.Schema({
  type: { type: String, required: true, default: "Point" },
  properties: {
    type: { type: String, required: true, default: "table" },
    count: { type: Number, required: false },
    source: DataSourceSchema,
    license: DataLicenseSchema,
    accessible: { type: Boolean, required: false },
    sheltered: { type: Boolean, required: false },
    comment: { type: String, required: false },
    user: { type: String, required: false }
  },
  geometry: {
    type: { type: String, required: true },
    coordinates: { type: [Number], required: true }
  }
}, { collection: mongo.collections.picnic })
PicnicSchema.index({ geometry: '2dsphere' })
PicnicSchema.index({ "properties.source.name": 1, "properties.source.dataset": 1, "properties.source.id": 1 })

export const Picnic = Mongoose.model<IPicnic>('Picnic', PicnicSchema)
