'use strict';

angular.module('picknicApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('map', {
        url: '/map',
        templateUrl: 'app/map/map.html',
        controller: 'MapCtrl',
        controllerAs: 'MapCtrl'
      });
  });
