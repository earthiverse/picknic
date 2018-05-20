import Mongoose = require('mongoose')

export interface IUser extends Mongoose.Document {
  email: string
  password: string
  joined: Date
  admin: boolean
}

export const UserSchema = new Mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  joined: { type: Date, required: true },
  admin: { type: Boolean, required: false }
}, { collection: 'user' })

export const User = Mongoose.model<IUser>('User', UserSchema)