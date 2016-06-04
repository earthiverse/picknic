var mongoose = require("mongoose");

var tableSchema = new mongoose.Schema({
  type: String,
  properties: {
    comment: String,
    updated: Number
  },
  geometry: {
    type: String,
    coordinates: [Number]
  }
}, {collection: 'tables'});

// 'within' is GeoJSON
// e.g.: {type: "Polygon", coordinates: [[[-113.49083,53.54337],[-113.49099,53.54446],[-113.48913,53.54457],[-113.48892,53.54347],[-113.49083,53.54337]]]}
tableSchema.statics.within = function(bounds, callback) {
  // So... adding lean magically also allows us to return the geometry field, which is good...
  this.where("geometry.coordinates").within(bounds).lean().find('_id', callback);
}

module.exports = {
  Table: mongoose.model('Table', tableSchema)
};
