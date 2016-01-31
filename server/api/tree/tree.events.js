/**
 * Tree model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Tree = require('./tree.model');
var TreeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
TreeEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Tree.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    TreeEvents.emit(event + ':' + doc._id, doc);
    TreeEvents.emit(event, doc);
  }
}

module.exports = TreeEvents;
