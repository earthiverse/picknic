'use strict';

var app = require('../..');
var request = require('supertest');

var newClosestTree;

describe('ClosestTree API:', function() {

  describe('GET /api/closest_trees', function() {
    var closestTrees;

    beforeEach(function(done) {
      request(app)
        .get('/api/closest_trees')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          closestTrees = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(closestTrees).to.be.instanceOf(Array);
    });

  });

  describe('POST /api/closest_trees', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/closest_trees')
        .send({
          name: 'New ClosestTree',
          info: 'This is the brand new closestTree!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newClosestTree = res.body;
          done();
        });
    });

    it('should respond with the newly created closestTree', function() {
      expect(newClosestTree.name).to.equal('New ClosestTree');
      expect(newClosestTree.info).to.equal('This is the brand new closestTree!!!');
    });

  });

  describe('GET /api/closest_trees/:id', function() {
    var closestTree;

    beforeEach(function(done) {
      request(app)
        .get('/api/closest_trees/' + newClosestTree._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          closestTree = res.body;
          done();
        });
    });

    afterEach(function() {
      closestTree = {};
    });

    it('should respond with the requested closestTree', function() {
      expect(closestTree.name).to.equal('New ClosestTree');
      expect(closestTree.info).to.equal('This is the brand new closestTree!!!');
    });

  });

  describe('PUT /api/closest_trees/:id', function() {
    var updatedClosestTree

    beforeEach(function(done) {
      request(app)
        .put('/api/closest_trees/' + newClosestTree._id)
        .send({
          name: 'Updated ClosestTree',
          info: 'This is the updated closestTree!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedClosestTree = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedClosestTree = {};
    });

    it('should respond with the updated closestTree', function() {
      expect(updatedClosestTree.name).to.equal('Updated ClosestTree');
      expect(updatedClosestTree.info).to.equal('This is the updated closestTree!!!');
    });

  });

  describe('DELETE /api/closest_trees/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/closest_trees/' + newClosestTree._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when closestTree does not exist', function(done) {
      request(app)
        .delete('/api/closest_trees/' + newClosestTree._id)
        .expect(404)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
