/**
 * SprayPark model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var SprayPark = require('./spray_park.model');
var SprayParkEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
SprayParkEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  SprayPark.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    SprayParkEvents.emit(event + ':' + doc._id, doc);
    SprayParkEvents.emit(event, doc);
  }
}

module.exports = SprayParkEvents;
