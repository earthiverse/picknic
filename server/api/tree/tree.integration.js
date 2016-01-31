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

    it('should respond with the newly created tree', function() {
      expect(newTree.name).to.equal('New Tree');
      expect(newTree.info).to.equal('This is the brand new tree!!!');
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

    it('should respond with the requested tree', function() {
      expect(tree.name).to.equal('New Tree');
      expect(tree.info).to.equal('This is the brand new tree!!!');
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

    it('should respond with the updated tree', function() {
      expect(updatedTree.name).to.equal('Updated Tree');
      expect(updatedTree.info).to.equal('This is the updated tree!!!');
    });

  });

  describe('DELETE /api/trees/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/trees/' + newTree._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when tree does not exist', function(done) {
      request(app)
        .delete('/api/trees/' + newTree._id)
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
