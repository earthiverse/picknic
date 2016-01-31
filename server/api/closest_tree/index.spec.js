'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var closestTreeCtrlStub = {
  index: 'closestTreeCtrl.index',
  show: 'closestTreeCtrl.show',
  create: 'closestTreeCtrl.create',
  update: 'closestTreeCtrl.update',
  destroy: 'closestTreeCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var closestTreeIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './closest_tree.controller': closestTreeCtrlStub
});

describe('ClosestTree API Router:', function() {

  it('should return an express router instance', function() {
    expect(closestTreeIndex).to.equal(routerStub);
  });

  describe('GET /api/closest_trees', function() {

    it('should route to closestTree.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'closestTreeCtrl.index')
        ).to.have.been.calledOnce;
    });

  });

  describe('GET /api/closest_trees/:id', function() {

    it('should route to closestTree.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'closestTreeCtrl.show')
        ).to.have.been.calledOnce;
    });

  });

  describe('POST /api/closest_trees', function() {

    it('should route to closestTree.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'closestTreeCtrl.create')
        ).to.have.been.calledOnce;
    });

  });

  describe('PUT /api/closest_trees/:id', function() {

    it('should route to closestTree.controller.update', function() {
      expect(routerStub.put
        .withArgs('/:id', 'closestTreeCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('PATCH /api/closest_trees/:id', function() {

    it('should route to closestTree.controller.update', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'closestTreeCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('DELETE /api/closest_trees/:id', function() {

    it('should route to closestTree.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'closestTreeCtrl.destroy')
        ).to.have.been.calledOnce;
    });

  });

});
