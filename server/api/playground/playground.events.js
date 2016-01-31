/**
 * Playground model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Playground = require('./playground.model');
var PlaygroundEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
PlaygroundEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Playground.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    PlaygroundEvents.emit(event + ':' + doc._id, doc);
    PlaygroundEvents.emit(event, doc);
  }
}

module.exports = PlaygroundEvents;
