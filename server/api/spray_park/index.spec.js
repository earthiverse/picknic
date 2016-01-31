'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var sprayParkCtrlStub = {
  index: 'sprayParkCtrl.index',
  show: 'sprayParkCtrl.show',
  create: 'sprayParkCtrl.create',
  update: 'sprayParkCtrl.update',
  destroy: 'sprayParkCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var sprayParkIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './spray_park.controller': sprayParkCtrlStub
});

describe('SprayPark API Router:', function() {

  it('should return an express router instance', function() {
    expect(sprayParkIndex).to.equal(routerStub);
  });

  describe('GET /api/spray_parks', function() {

    it('should route to sprayPark.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'sprayParkCtrl.index')
        ).to.have.been.calledOnce;
    });

  });

  describe('GET /api/spray_parks/:id', function() {

    it('should route to sprayPark.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'sprayParkCtrl.show')
        ).to.have.been.calledOnce;
    });

  });

  describe('POST /api/spray_parks', function() {

    it('should route to sprayPark.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'sprayParkCtrl.create')
        ).to.have.been.calledOnce;
    });

  });

  describe('PUT /api/spray_parks/:id', function() {

    it('should route to sprayPark.controller.update', function() {
      expect(routerStub.put
        .withArgs('/:id', 'sprayParkCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('PATCH /api/spray_parks/:id', function() {

    it('should route to sprayPark.controller.update', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'sprayParkCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('DELETE /api/spray_parks/:id', function() {

    it('should route to sprayPark.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'sprayParkCtrl.destroy')
        ).to.have.been.calledOnce;
    });

  });

});
