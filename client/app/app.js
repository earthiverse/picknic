'use strict';

angular.module('picknicApp', [
  'picknicApp.auth',
  'picknicApp.admin',
  'picknicApp.constants',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'validation.match',
  'uiGmapgoogle-maps'
])
  .config(function($urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  })
  .config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      key: 'AIzaSyCphBVBdtZk0AbGNTrDDK7sELY6CaY-WaM',
      v: '3.20',
      libraries: 'weather,geometry,visualization'
    });
  });