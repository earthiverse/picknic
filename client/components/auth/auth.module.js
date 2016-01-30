'use strict';

angular.module('picknicApp.auth', [
  'picknicApp.constants',
  'picknicApp.util',
  'ngCookies',
  'ui.router'
])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
