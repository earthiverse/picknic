'use strict';

var app = require('../..');
var request = require('supertest');

var newTree;

describe('Tree API:', function() {

  describe('GET /api/trees', function() {
    var trees;

    beforeEach(function(done) {
      request(app)
        .get('/api/trees')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          trees = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(trees).to.be.instanceOf(Array);
    });

  });

  describe('POST /api/trees', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/trees')
        .send({
          name: 'New Tree',
          info: 'This is the brand new tree!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newTree = res.body;
          done();
        });
    });
  });

  describe('GET /api/trees/:id', function() {
    var tree;

    beforeEach(function(done) {
      request(app)
        .get('/api/trees/' + newTree._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          tree = res.body;
          done();
        });
    });

    afterEach(function() {
      tree = {};
    });
  });

  describe('PUT /api/trees/:id', function() {
    var updatedTree

    beforeEach(function(done) {
      request(app)
        .put('/api/trees/' + newTree._id)
        .send({
          name: 'Updated Tree',
          info: 'This is the updated tree!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedTree = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedTree = {};
    });
  });

  describe('DELETE /api/trees/:id', function() {

  });

});
