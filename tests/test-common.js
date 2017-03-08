// General utilities that are made available to tests.

var $ = require('jquery');
var geo = require('../src');

module.exports = {
  createOsmMap: function (mapOpts, osmOpts, notiles) {
    // Generate a default open street maps layer with optional
    // arguments.  If no options present, creates the map
    // in $('#map') with tiles served from the local server.

    'use strict';

    mapOpts = mapOpts || {};
    osmOpts = osmOpts || {};
    notiles = !!notiles;

    var mapDefaults = {
      node: '#map',
      zoom: 2.5,
      center: {
        x: 0,
        y: 0
      },
      wrapX: false,
      clampBoundsX: true
    };
    $.extend(true, mapDefaults, mapOpts);

    var osmDefaults = {
      baseUrl: '/data/tiles/',
      attribution: null
    };

    if (notiles) {
      osmDefaults.url = function () {
        return '/testdata/white.jpg';
      };
      delete osmDefaults.baseUrl;
    }
    $.extend(true, osmDefaults, osmOpts);

    if (osmDefaults.url) {
      delete osmDefaults.baseUrl;
    }

    var map = geo.map(mapDefaults);
    if (!notiles) {
      map.createLayer('osm', osmDefaults);
    }

    map.interactor().options({
      momentum: false,
      throttle: 0
    });

    if (osmDefaults.baseUrl) {
      // change the zoom range to represent the
      // tiles present in the local dataset
      map.zoomRange({
        min: 0,
        max: 3
      });
    }

    return map;
  },

  loadCitiesData: function (done, n) {
    'use strict';

    // Load at most n rows of the cities dataset.
    $.ajax({
      type: 'GET',
      url: '/data/cities.csv',
      dataType: 'text',
      success: function (data) {
        function processCSVData(csvdata) {
          var table = [];
          var lines = csvdata.split(/\r\n|\n/);

          lines.forEach(function (line, i) {
            if (n && i >= n) {
              return;
            }
            if (line.length) {
              table.push(line.split(','));
            }
          });
          return table;
        }

        var table = processCSVData(data);
        var citieslatlon = [];
        var i;
        for (i = 0; i < table.length; i += 1) {
          if (table[i][2] !== undefined) {
            var lat = table[i][2];
            lat = lat.replace(/(^\s+|\s+$|^"|"$)/g, '');
            lat = parseFloat(lat);

            var lon = table[i][3];
            lon = lon.replace(/(^\s+|\s+$|^"|"$)/g, '');
            lon = parseFloat(lon);
            citieslatlon.push({lon: lon, lat: lat, elev: 0.0});
          }
        }
        done(citieslatlon);
      }
    });
  }
};
