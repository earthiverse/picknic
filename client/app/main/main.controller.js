'use strict';

(function() {

class MainController {

  constructor($http, uiGmapGoogleMapApi) {
    this.$http = $http;
    this.awesomeThings = [];
    this.map = {};
    this.options = {};
    var self = this;

    $http.get('/api/things').then(response => {
      this.awesomeThings = response.data;
    });

    uiGmapGoogleMapApi.then(function (maps) {
      console.log("Map instantiated");
      self.map = {center: {latitude: 51.219053, longitude: 4.404418}, zoom: 14};
      self.options = {scrollwheel: false};
      console.log(maps);
    });
  }

  addThing() {
    if (this.newThing) {
      this.$http.post('/api/things', { name: this.newThing });
      this.newThing = '';
    }
  }

  deleteThing(thing) {
    this.$http.delete('/api/things/' + thing._id);
  }
}

angular.module('picknicApp')
  .controller('MainController', MainController);

})();
