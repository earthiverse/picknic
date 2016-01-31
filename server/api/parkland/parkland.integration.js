'use strict';

var app = require('../..');
var request = require('supertest');

var newParkland;

describe('Parkland API:', function() {

  describe('GET /api/parklands', function() {
    var parklands;

    beforeEach(function(done) {
      request(app)
        .get('/api/parklands')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          parklands = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(parklands).to.be.instanceOf(Array);
    });

  });

  describe('POST /api/parklands', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/parklands')
        .send({
          name: 'New Parkland',
          info: 'This is the brand new parkland!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newParkland = res.body;
          done();
        });
    });

    it('should respond with the newly created parkland', function() {
      expect(newParkland.name).to.equal('New Parkland');
      expect(newParkland.info).to.equal('This is the brand new parkland!!!');
    });

  });

  describe('GET /api/parklands/:id', function() {
    var parkland;

    beforeEach(function(done) {
      request(app)
        .get('/api/parklands/' + newParkland._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          parkland = res.body;
          done();
        });
    });

    afterEach(function() {
      parkland = {};
    });

    it('should respond with the requested parkland', function() {
      expect(parkland.name).to.equal('New Parkland');
      expect(parkland.info).to.equal('This is the brand new parkland!!!');
    });

  });

  describe('PUT /api/parklands/:id', function() {
    var updatedParkland

    beforeEach(function(done) {
      request(app)
        .put('/api/parklands/' + newParkland._id)
        .send({
          name: 'Updated Parkland',
          info: 'This is the updated parkland!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedParkland = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedParkland = {};
    });

    it('should respond with the updated parkland', function() {
      expect(updatedParkland.name).to.equal('Updated Parkland');
      expect(updatedParkland.info).to.equal('This is the updated parkland!!!');
    });

  });

  describe('DELETE /api/parklands/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/parklands/' + newParkland._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when parkland does not exist', function(done) {
      request(app)
        .delete('/api/parklands/' + newParkland._id)
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
