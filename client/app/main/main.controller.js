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
      this.formData = {children : "no"};
      this.slider = 50;
      this.weather = {};

      // created after tiles loaded
      this.g_map_obj = {};
      var self = this;

      // Markers go inside this array
      //this.markers = [{id: 1, coords: {latitude: 53.5333, longitude: -113.5000}}];
      this.markers = [];

      $http.get('/api/things').then(response => {
        this.awesomeThings = response.data;
      });

      uiGmapGoogleMapApi.then(function (maps) {
        /*
         * Variable definition and initialization
         */
        var edmonton = new google.maps.LatLng(53.5333, -113.5000);
        self.map = {
          center: {latitude: 53.5333, longitude: -113.5000}, zoom: 14,
          events: {
            tilesloaded: function (map) {
              self.g_map_obj = map;
              handleGeoLocation();
            }
          }
        };
        self.options = {scrollwheel: false};

        // Initialize the geoencoder
        var geocoder = new google.maps.Geocoder();
        document.getElementById('submit').addEventListener('click', function () {
          geocodeAddress(geocoder, self.g_map_obj);
        });

        function handleGeoLocation() {
          /**
           * Do Geolocation logic
           * Try W3C Geolocation (Preferred)
           */
          if (navigator.geolocation) {
            self.browserSupportFlag = true;
            navigator.geolocation.getCurrentPosition(function (position) {
              self.initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
              self.g_map_obj.setCenter(self.initialLocation);
              self.markers.push({
                id: 'me',
                coords: {latitude: position.coords.latitude, longitude: position.coords.longitude},
                options: {
                  icon: '/assets/images/logo/logo32.png'
                }
              });
            }, function () {
              handleNoGeolocation(self.browserSupportFlag);
            });
          }
          // Browser doesn't support Geolocation
          else {
            self.browserSupportFlag = false;
            handleNoGeolocation(self.browserSupportFlag);
          }
        }

        /*
         * Nested function definition
         */
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

        function geocodeAddress(geocoder, resultsMap) {
          var address = document.getElementById('address').value;
          geocoder.geocode({'address': address}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              resultsMap.setCenter(results[0].geometry.location);
              /*
               var marker = new google.maps.Marker({
               map: resultsMap,
               position: results[0].geometry.location
               });
               */
              var me_exists = false;
              for (var i = 0; i < self.markers.length; i++) {
                if (self.markers[i].id === 'me') {
                  self.markers[i].coords = {
                    latitude: results[0].geometry.location.G,
                    longitude: results[0].geometry.location.K
                  };
                  me_exists = true;
                  break;
                }
              }
              if (!me_exists) {
                self.markers.push(
                  {
                    id: 'me',
                    coords: {
                      latitude: results[0].geometry.location.G,
                      longitude: results[0].geometry.location.K
                    },
                    options: {
                      icon: '/assets/images/logo/logo32.png'
                    }
                  });
              }
            } else {
              alert('Geocode was not successful for the following reason: ' + status);
            }
          });
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
