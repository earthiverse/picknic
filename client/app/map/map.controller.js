'use strict';

angular.module('picknicApp')
  .controller('MapCtrl', function ($scope, uiGmapGoogleMapApi) {
    $scope.message = 'Hello';

    uiGmapGoogleMapApi.then(function (maps) {
      console.log("Map instantiated");
      $scope.map = {center: {latitude: 51.219053, longitude: 4.404418}, zoom: 14};
      $scope.options = {scrollwheel: false};
      console.log(maps);
    });
  });
