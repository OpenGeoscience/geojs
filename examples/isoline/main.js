// Create a map object with the OpenStreetMaps base layer.
var map = geo.map({
  node: '#map',
  center: {
    x: -157.965,
    y: 21.482
  },
  zoom: 11
});

// Add a faint osm layer
map.createLayer('osm', {opacity: 0.5});

// Create a feature layer that supports contours
var isolineLayer = map.createLayer('feature', {
  features: ['isoline']
});

// Load the data
$.get('../../data/oahu-dense.json').done(function (data) {
  // Create an isoline feature
  var iso = isolineLayer.createFeature('isoline', {
    isoline: {
      // Specify our grid data
      gridWidth: data.gridWidth,
      gridHeight: data.gridHeight,
      x0: data.x0,
      y0: data.y0,
      dx: data.dx,
      dy: data.dy,
      // Don't plot any values less than zero
      min: 0,
      // Create a contour line every 50 meters
      spacing: 50,
      // Make every 4th line heavier and every 4*5 = 20th line heavier yet
      levels: [4, 5]
    },
    style: {
      // The data uses -9999 to represent no value; modify it to return null
      // instead.
      value: function (d) { return d > -9999 ? d : null; },
      // level relates to the isoline importance, with 0 being the most
      // common and, using the levels specified, a level of 1 being every
      // fourth, and 2 every twentieth line.  Color the lines differently
      // depending on the level
      strokeColor: function (v, vi, d) {
        return ['grey', 'mediumblue', 'blue'][d.level];
      }
    }
  }).data(data.values).draw();

  // Make some values available in the global context to aid exploration and
  // automated tests.
  window.example = {
    ready: true,
    map: map,
    isolineLayer: isolineLayer,
    iso: iso
  };

});
