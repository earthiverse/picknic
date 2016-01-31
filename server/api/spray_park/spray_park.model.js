'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var Schema = mongoose.Schema;

var SprayParkSchema = new Schema({
  name: String,
  location: [Number],
  address: String
});

module.exports = mongoose.model('SprayPark', SprayParkSchema);
