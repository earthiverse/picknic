/**
 * ClosestTree model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var ClosestTree = require('./closest_tree.model');
var ClosestTreeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
ClosestTreeEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  ClosestTree.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    ClosestTreeEvents.emit(event + ':' + doc._id, doc);
    ClosestTreeEvents.emit(event, doc);
  }
}

module.exports = ClosestTreeEvents;
