'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var playgroundCtrlStub = {
  index: 'playgroundCtrl.index',
  show: 'playgroundCtrl.show',
  create: 'playgroundCtrl.create',
  update: 'playgroundCtrl.update',
  destroy: 'playgroundCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var playgroundIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './playground.controller': playgroundCtrlStub
});

describe('Playground API Router:', function() {

  it('should return an express router instance', function() {
    expect(playgroundIndex).to.equal(routerStub);
  });

  describe('GET /api/playgrounds', function() {

    it('should route to playground.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'playgroundCtrl.index')
        ).to.have.been.calledOnce;
    });

  });

  describe('GET /api/playgrounds/:id', function() {

    it('should route to playground.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'playgroundCtrl.show')
        ).to.have.been.calledOnce;
    });

  });

  describe('POST /api/playgrounds', function() {

    it('should route to playground.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'playgroundCtrl.create')
        ).to.have.been.calledOnce;
    });

  });

  describe('PUT /api/playgrounds/:id', function() {

    it('should route to playground.controller.update', function() {
      expect(routerStub.put
        .withArgs('/:id', 'playgroundCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('PATCH /api/playgrounds/:id', function() {

    it('should route to playground.controller.update', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'playgroundCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('DELETE /api/playgrounds/:id', function() {

    it('should route to playground.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'playgroundCtrl.destroy')
        ).to.have.been.calledOnce;
    });

  });

});
