'use strict';

describe('Controller: AdvancedCtrl', function () {

  // load the controller's module
  beforeEach(module('picknicApp'));

  var AdvancedCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AdvancedCtrl = $controller('AdvancedCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).to.equal(1);
  });
});
