'use strict';

(function () {

  class MainController {

    constructor($http, uiGmapGoogleMapApi) {
      this.$http = $http;
      this.awesomeThings = [];
      this.map = {};
      this.options = {};
      this.browserSupportFlag = Boolean();
      this.initialLocation = {};

      // created after tiles loaded
      this.g_map_obj = {};
      var self = this;

      // Markers go inside this array
      this.markers = [{id: 1, coords: {latitude: 53.5333, longitude: -113.5000}}];

      $http.get('/api/things').then(response => {
        this.awesomeThings = response.data;
      });

      uiGmapGoogleMapApi.then(function (maps) {
        var edmonton = new google.maps.LatLng(53.5333, -113.5000);
        self.map = {center: {latitude: 53.5333, longitude: -113.5000}, zoom: 14,
          events: {
            tilesloaded: function(map) {
              self.g_map_obj = map;
            }
          }
        };
        self.options = {scrollwheel: false};

        // Try W3C Geolocation (Preferred)
        if (navigator.geolocation) {
          self.browserSupportFlag = true;
          navigator.geolocation.getCurrentPosition(function (position) {
            self.initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            self.g_map_obj.setCenter(self.initialLocation);
          }, function () {
            handleNoGeolocation(self.browserSupportFlag);
          });
        }
        // Browser doesn't support Geolocation
        else {
          self.browserSupportFlag = false;
          handleNoGeolocation(self.browserSupportFlag);
        }

        function handleNoGeolocation(errorFlag) {
          if (errorFlag == true) {
            alert("Geolocation service failed. We've placed you in Edmonton.");
            self.initialLocation = edmonton;
          } else {
            alert("Your browser doesn't support geolocation. We've placed you in Edmonton.");
            self.initialLocation = edmonton;
          }
          self.g_map_obj.setCenter(self.initialLocation);
        }

      });
    }

    addThing() {
      if (this.newThing) {
        this.$http.post('/api/things', {name: this.newThing});
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
