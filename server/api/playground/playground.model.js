'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var Schema = mongoose.Schema;

var PlaygroundSchema = new Schema({
  name: String,
  location: [Number]
});

module.exports = mongoose.model('Playground', PlaygroundSchema);
