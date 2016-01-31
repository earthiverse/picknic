'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var treeCtrlStub = {
  index: 'treeCtrl.index',
  show: 'treeCtrl.show',
  create: 'treeCtrl.create',
  update: 'treeCtrl.update',
  destroy: 'treeCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var treeIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './tree.controller': treeCtrlStub
});

describe('Tree API Router:', function() {

  it('should return an express router instance', function() {
    expect(treeIndex).to.equal(routerStub);
  });

  describe('GET /api/trees', function() {

    it('should route to tree.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'treeCtrl.index')
        ).to.have.been.calledOnce;
    });

  });

  describe('GET /api/trees/:id', function() {

    it('should route to tree.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'treeCtrl.show')
        ).to.have.been.calledOnce;
    });

  });

  describe('POST /api/trees', function() {

    it('should route to tree.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'treeCtrl.create')
        ).to.have.been.calledOnce;
    });

  });

  describe('PUT /api/trees/:id', function() {

    it('should route to tree.controller.update', function() {
      expect(routerStub.put
        .withArgs('/:id', 'treeCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('PATCH /api/trees/:id', function() {

    it('should route to tree.controller.update', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'treeCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('DELETE /api/trees/:id', function() {

    it('should route to tree.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'treeCtrl.destroy')
        ).to.have.been.calledOnce;
    });

  });

});
