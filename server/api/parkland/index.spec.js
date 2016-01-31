'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var parklandCtrlStub = {
  index: 'parklandCtrl.index',
  show: 'parklandCtrl.show',
  create: 'parklandCtrl.create',
  update: 'parklandCtrl.update',
  destroy: 'parklandCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var parklandIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './parkland.controller': parklandCtrlStub
});

describe('Parkland API Router:', function() {

  it('should return an express router instance', function() {
    expect(parklandIndex).to.equal(routerStub);
  });

  describe('GET /api/parklands', function() {

    it('should route to parkland.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'parklandCtrl.index')
        ).to.have.been.calledOnce;
    });

  });

  describe('GET /api/parklands/:id', function() {

    it('should route to parkland.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'parklandCtrl.show')
        ).to.have.been.calledOnce;
    });

  });

  describe('POST /api/parklands', function() {

    it('should route to parkland.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'parklandCtrl.create')
        ).to.have.been.calledOnce;
    });

  });

  describe('PUT /api/parklands/:id', function() {

    it('should route to parkland.controller.update', function() {
      expect(routerStub.put
        .withArgs('/:id', 'parklandCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('PATCH /api/parklands/:id', function() {

    it('should route to parkland.controller.update', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'parklandCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('DELETE /api/parklands/:id', function() {

    it('should route to parkland.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'parklandCtrl.destroy')
        ).to.have.been.calledOnce;
    });

  });

});
