'use strict';

(function () {

  class MainController {

    constructor($http, uiGmapGoogleMapApi) {
      this.$http = $http;
      this.awesomeThings = [];
      this.parks = [];
      this.trees = [];
      this.tree_options = {
        icon: '/assets/images/tree16.png'
      };
      this.treeslider = 50;
      this.marker = {
        id: 'me',
        coords: {latitude: 53.5, longitude: -113.5},
        options: {icon: '/assets/images/marker32.png'}
      };
      this.options = {};
      this.browserSupportFlag = Boolean();
      this.initialLocation = {};
      this.formData = {children: ""};
      this.weather = {};

      // created after tiles loaded
      this.g_map_obj = {};
      this.map = {
        center: {latitude: 53.5333, longitude: -113.5000}, zoom: 14,
        events: {
          tilesloaded: (map) => {
            this.g_map_obj = map;
          }
        }
      };
      this.options = {scrollwheel: false};
      //Range Slider
      this.slider = 1000;
      this.circles = [
        {
          id: 1,
          center: {
            latitude: 53.5, longitude: -113.5
          },
          radius: 1, stroke: {color: '#ffcccc', weight: 3, opacity: 1},
          fill: {
            color: '#ffcccc', opacity: 0.25
          }
        }
      ];

      $http.get('/api/things').then(response => {
        this.awesomeThings = response.data;
      });

      $http.get('http://api.openweathermap.org/data/2.5/weather?lat=53.5333&lon=-113.5000&appid=ada399b22b7d2525b330e37f7be56bb5').then(response => {
        this.weather = response.data;
      });

      this.handleParks();

      uiGmapGoogleMapApi.then(maps => {
        // Initialize the geoencoder
        var geocoder = new google.maps.Geocoder();
        document.getElementById('submit').addEventListener('click', () => {
          this.geocodeAddress(geocoder, this.g_map_obj);
        });
        this.handleGeoLocation();
      });
    }

    geocodeAddress(geocoder, resultsMap) {
      var address = document.getElementById('address').value;
      geocoder.geocode({'address': address}, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          resultsMap.setCenter(results[0].geometry.location);
          var me_exists = false;
          for (var i = 0; i < this.markers.length; i++) {
            if (this.markers[i].id === 'me') {
              this.markers[i].coords = {
                latitude: results[0].geometry.location.G,
                longitude: results[0].geometry.location.K
              };
              this.circles[0].center.latitude = results[0].geometry.location.G;
              this.circles[0].center.longitude = results[0].geometry.location.K;
              me_exists = true;
              break;
            }
          }
          if (!me_exists) {
            this.markers.push(
              {
                id: 'me',
                coords: {
                  latitude: results[0].geometry.location.G,
                  longitude: results[0].geometry.location.K
                },
                options: {
                  icon: '/assets/images/marker32.png'
                }
              });
            this.circles[0].center.latitude = results[0].geometry.location.G;
            this.circles[0].center.longitude = results[0].geometry.location.K;
          }
          this.handleParks();
        } else {
          alert('Geocode was not successful for the following reason: ' + status);
        }
      });
    }

    handleGeoLocation() {
      /**
       * Do Geolocation logic
       * Try W3C Geolocation (Preferred)
       */
      if (navigator.geolocation) {
        this.browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(position => {
          this.initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          this.g_map_obj.setCenter(this.initialLocation);
          this.markers.push({
            id: 'me',
            coords: {latitude: position.coords.latitude, longitude: position.coords.longitude},
            options: {
              icon: '/assets/images/marker32.png'
            }
          });
          //Set Circle
          this.circles[0].center.latitude = position.coords.latitude;
          this.circles[0].center.longitude = position.coords.longitude;
          this.circles[0].radius = 1000;
          this.handleParks();
        }, () => {
          this.handleNoGeolocation(this.browserSupportFlag);
        });
      }
      // Browser doesn't support Geolocation
      else {
        this.browserSupportFlag = false;
        this.handleNoGeolocation(this.browserSupportFlag);
      }
    }

    handleNoGeolocation(errorFlag) {
      var edmonton = new google.maps.LatLng(53.5333, -113.5000);
      if (errorFlag == true) {
        alert("Geolocation service failed. We've placed you in Edmonton.");
        this.initialLocation = edmonton;
      } else {
        alert("Your browser doesn't support geolocation. We've placed you in Edmonton.");
        this.initialLocation = edmonton;
      }
      this.g_map_obj.setCenter(this.initialLocation);
    }

    handleEntities() {
      // TODO: LINE 1295 of angular-google-maps.js CHANGE TO ARROW NOTATION, read README
      this.handleParks();
      if (this.trees !== "no") {
        this.handleTrees();
      }
    }

    handleParks() {
      var lat = this.circles[0].center.latitude;
      var lng = this.circles[0].center.longitude;
      var radius = Number(this.circles[0].radius) / 1000;
      this.parks = [];
      this.$http.get('/api/parklands/' + lng.toString() + '/' + lat.toString() + '?radius=' + radius.toString()).then(response => {
        this.parks = response.data;
      });
    }

    handleTrees() {
      var lat = this.circles[0].center.latitude;
      var lng = this.circles[0].center.longitude;
      var radius = Number(this.circles[0].radius) / 1000;
      this.trees = [];
      this.$http.get('/api/trees/' + lng.toString() + '/' + lat.toString() + '?radius=' + radius.toString()).then(response => {
        this.trees = response.data;
      });

    }

    addThing() {
      if (this.newThing) {
        this.$http.post('/api/things', {name: this.newThing});
        this.newThing = '';
      }
    }

    sliderChange() {
      this.circles[0].radius = Number(this.slider);
      this.handleParks();
    }

    deleteThing(thing) {
      this.$http.delete('/api/things/' + thing._id);
    }
  }

  angular.module('picknicApp')
    .controller('MainController', MainController);

})();
