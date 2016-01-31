'use strict';

angular.module('picknicApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('advanced', {
        url: '/advanced',
        templateUrl: 'app/advanced/advanced.html',
        controller: 'AdvancedCtrl'
      });
  });
