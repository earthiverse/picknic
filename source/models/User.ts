import Mongoose = require("mongoose");

export interface IUser extends Mongoose.Document {
  email: string;
  password: string;
  joined: Date;
  admin: boolean;
}

export const UserSchema = new Mongoose.Schema({
  admin: { type: Boolean, required: false },
  email: { type: String, required: true },
  joined: { type: Date, required: true },
  password: { type: String, required: true },
}, { collection: "user" });

export const User = Mongoose.model<IUser>("User", UserSchema);
