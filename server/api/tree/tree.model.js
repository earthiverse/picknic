'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var Schema = mongoose.Schema;

var TreeSchema = new Schema({
  location_type: String,
  location: [Number],
  condition_percent: Number,
  diameter_breast_height: Number,
  species_common: String
});

module.exports = mongoose.model('Tree', TreeSchema);
