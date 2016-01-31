'use strict';

var app = require('../..');
var request = require('supertest');

var newSprayPark;

describe('SprayPark API:', function() {

  describe('GET /api/spray_parks', function() {
    var sprayParks;

    beforeEach(function(done) {
      request(app)
        .get('/api/spray_parks')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          sprayParks = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(sprayParks).to.be.instanceOf(Array);
    });

  });

  describe('POST /api/spray_parks', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/spray_parks')
        .send({
          name: 'New SprayPark',
          info: 'This is the brand new sprayPark!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newSprayPark = res.body;
          done();
        });
    });

    it('should respond with the newly created sprayPark', function() {
      expect(newSprayPark.name).to.equal('New SprayPark');
      expect(newSprayPark.info).to.equal('This is the brand new sprayPark!!!');
    });

  });

  describe('GET /api/spray_parks/:id', function() {
    var sprayPark;

    beforeEach(function(done) {
      request(app)
        .get('/api/spray_parks/' + newSprayPark._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          sprayPark = res.body;
          done();
        });
    });

    afterEach(function() {
      sprayPark = {};
    });

    it('should respond with the requested sprayPark', function() {
      expect(sprayPark.name).to.equal('New SprayPark');
      expect(sprayPark.info).to.equal('This is the brand new sprayPark!!!');
    });

  });

  describe('PUT /api/spray_parks/:id', function() {
    var updatedSprayPark

    beforeEach(function(done) {
      request(app)
        .put('/api/spray_parks/' + newSprayPark._id)
        .send({
          name: 'Updated SprayPark',
          info: 'This is the updated sprayPark!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedSprayPark = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedSprayPark = {};
    });

    it('should respond with the updated sprayPark', function() {
      expect(updatedSprayPark.name).to.equal('Updated SprayPark');
      expect(updatedSprayPark.info).to.equal('This is the updated sprayPark!!!');
    });

  });

  describe('DELETE /api/spray_parks/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/spray_parks/' + newSprayPark._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when sprayPark does not exist', function(done) {
      request(app)
        .delete('/api/spray_parks/' + newSprayPark._id)
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
