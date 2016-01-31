/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/trees              ->  index
 * POST    /api/trees              ->  create
 * GET     /api/trees/:id          ->  show
 * PUT     /api/trees/:id          ->  update
 * DELETE  /api/trees/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Tree = require('./tree.model');

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function saveUpdates(updates) {
  return function (entity) {
    var updated = _.merge(entity, updates);
    return updated.saveAsync()
      .spread(function (updated) {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.removeAsync()
        .then(function () {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of Trees
exports.index = function (req, res) {
  function isInteger(value) {
    return (!isNaN(value) && Math.floor(value) === value);
  }
  var query_dict = req.query;
  var skip_num = 0;
  if ('skip' in query_dict) {
    if (isInteger(Number(query_dict['skip']))) {
      skip_num = Number(query_dict['skip']);
    }
  }
  Tree.find().skip(skip_num).limit(10)
    .execAsync()
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single Tree from the DB
exports.show = function (req, res) {
  Tree.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new Tree in the DB
exports.create = function (req, res) {
  Tree.createAsync(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing Tree in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Tree.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a Tree from the DB
exports.destroy = function (req, res) {
  Tree.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

// Find all trees in the given lat lng
exports.location = function(req, res) {

  var query_dict = req.query;
  var radius = 0.001;
  if ('radius' in query_dict) {
    radius = Number(query_dict['radius']);
  }

  var deg_radius = radius * (1 / 110.574);
  var lat = Number(req.params.lat);
  var lng = Number(req.params.lng);
  var searchSquare = [[
    [lng - deg_radius, lat - deg_radius],
    [lng - deg_radius, lat + deg_radius],
    [lng + deg_radius, lat + deg_radius],
    [lng + deg_radius, lat - deg_radius],
    [lng - deg_radius, lat - deg_radius]
  ]];
  console.log(searchSquare);
  Tree.find().where('location').within().geometry(
    {type: 'Polygon', coordinates: searchSquare}
//  Tree.find().where('coordinates').near(  // this isn't working..
//    { center: [lat, lng], maxDistance: 50 }
    )
    .execAsync()
    .then(responseWithResult(res))
    .catch(handleError(res));
}
