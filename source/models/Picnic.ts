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

/** Follows GeoJSON standards */
export const PicnicSchema = new Mongoose.Schema({
  geometry: {
    coordinates: {
      required: true,
      type: [Number],
      validate: {
        validator: (v: number[]) => {
          // Proper length
          if (v.length < 2 || v.length > 3) {
            return false;
          }
          // No null or undefined
          for (const e of v) {
            if (typeof (e) !== "number") {
              return false;
            }
          }
          // Within range of WGS84
          if (v[0] > 180 || v[0] < -180 || v[1] > 90 || v[1] < -90) {
            return false;
          }
        },
      },
    },
    type: { type: String, required: true, enum: ["Point"], default: "Point" },
  },
  properties: {
    accessible: { type: Boolean, required: false },
    comment: { type: String, required: false },
    count: { type: Number, min: 1, required: false },
    license: DataLicenseSchema,
    sheltered: { type: Boolean, required: false },
    source: DataSourceSchema,
    type: {
      default: "table",
      enum: ["site", "table"],
      required: true,
      type: String,
      validate: {
        validator(v: string) {
          if (v === "table") {
            // Sites can have multiple tables, but tables can't specify more than one table.
            if (this.properties.count && this.properties.count !== 1) {
              return false;
            }
          }
          return true;
        },
      },
    },
    user: { type: String, required: false },
  },
  type: { type: String, required: true, default: "Feature" },
}, { collection: mongo.collections.picnic });
PicnicSchema.index({ geometry: "2dsphere" });
PicnicSchema.index({ "properties.source.name": 1, "properties.source.dataset": 1, "properties.source.id": 1 });

export const Picnic = Mongoose.model<IPicnicMongoose>("Picnic", PicnicSchema);
