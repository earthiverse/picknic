'use strict';

var app = require('../..');
var request = require('supertest');

var newPlayground;

describe('Playground API:', function() {

  describe('GET /api/playgrounds', function() {
    var playgrounds;

    beforeEach(function(done) {
      request(app)
        .get('/api/playgrounds')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          playgrounds = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(playgrounds).to.be.instanceOf(Array);
    });

  });

  describe('POST /api/playgrounds', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/playgrounds')
        .send({
          name: 'New Playground',
          info: 'This is the brand new playground!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newPlayground = res.body;
          done();
        });
    });

    it('should respond with the newly created playground', function() {
      expect(newPlayground.name).to.equal('New Playground');
      expect(newPlayground.info).to.equal('This is the brand new playground!!!');
    });

  });

  describe('GET /api/playgrounds/:id', function() {
    var playground;

    beforeEach(function(done) {
      request(app)
        .get('/api/playgrounds/' + newPlayground._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          playground = res.body;
          done();
        });
    });

    afterEach(function() {
      playground = {};
    });

    it('should respond with the requested playground', function() {
      expect(playground.name).to.equal('New Playground');
      expect(playground.info).to.equal('This is the brand new playground!!!');
    });

  });

  describe('PUT /api/playgrounds/:id', function() {
    var updatedPlayground

    beforeEach(function(done) {
      request(app)
        .put('/api/playgrounds/' + newPlayground._id)
        .send({
          name: 'Updated Playground',
          info: 'This is the updated playground!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedPlayground = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedPlayground = {};
    });

    it('should respond with the updated playground', function() {
      expect(updatedPlayground.name).to.equal('Updated Playground');
      expect(updatedPlayground.info).to.equal('This is the updated playground!!!');
    });

  });

  describe('DELETE /api/playgrounds/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/playgrounds/' + newPlayground._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when playground does not exist', function(done) {
      request(app)
        .delete('/api/playgrounds/' + newPlayground._id)
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
