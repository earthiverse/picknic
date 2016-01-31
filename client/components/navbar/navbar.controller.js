'use strict';

class NavbarController {
  //start-non-standard
  menu = [{
    'title': 'Picknic',
    'state': 'main'
  }];

  isCollapsed = true;
  //end-non-standard

  constructor(Auth) {
    this.isLoggedIn = Auth.isLoggedIn;
    this.isAdmin = Auth.isAdmin;
    this.getCurrentUser = Auth.getCurrentUser;
  }
}

angular.module('picknicApp')
  .controller('NavbarController', NavbarController);
