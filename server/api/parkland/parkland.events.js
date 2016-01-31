/**
 * Parkland model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Parkland = require('./parkland.model');
var ParklandEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
ParklandEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Parkland.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    ParklandEvents.emit(event + ':' + doc._id, doc);
    ParklandEvents.emit(event, doc);
  }
}

module.exports = ParklandEvents;
