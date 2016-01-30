'use strict';

(function() {

function routerDecorator($stateProvider) {
  var authDecorator = function(state) {
    var auth = state.authenticate;
    if (auth) {
      state.resolve = state.resolve || {};
      state.resolve.user = function($state, $q, Auth) {
        return Auth.getCurrentUser(true)
          .then(function(user) {
            if ((typeof auth !== 'string' && user._id) ||
              (typeof auth === 'string' && Auth.hasRole(auth))) {
              return user;
            }
            $state.go((user._id) ? 'main' : 'login');
            return $q.reject('not authorized');
          });
      };
    }
  };

  $stateProvider.decorator('authenticate', function(state) {
    authDecorator(state);
    return state.authenticate;
  });
}

angular.module('picknicApp.auth')
  .config(routerDecorator);

})();
