window.startTest = function (done) {
  'use strict';

  $('#map').width('100%');
  $('#map').height('100%');

  var mapOptions = {
    node: '#map',
    zoom : 2,
    center : [40, -105]
  };

  var myMap = geo.map(mapOptions),
      data = [],
      citieslatlon = [],
      width, height;

  function resizeCanvas() {
    width = $('#map').width();
    height = $('#map').height();
    updateAndDraw(width, height);
  }

  // Resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);

  function updateAndDraw(width, height) {
    myMap.resize(0, 0, width, height);
    myMap.draw();
  }

  resizeCanvas();
  data = [
    { "type": "Feature", "properties": { "LINEARID": "110685800599", "FULLNAME": "N Midway St", "RTTYP": "M", "MTFCC": "S1200" }, "geometry": { "type": "LineString", "coordinates": [ [ 0, 20 ], [ 100, 20 ] ] } },
    { "type": "Feature", "properties": { "LINEARID": "110685800599", "FULLNAME": "N Midway St", "RTTYP": "M", "MTFCC": "S1200" }, "geometry": { "type": "LineString", "coordinates": [ [ 0, 40 ], [ 100, 40 ] ] } },
  ];

  // Load image to be used for drawing dots
  myMap.createLayer('osm', {m_baseUrl: '/data/tiles/'});
  var layer = myMap.createLayer('feature');
  var style = {
    'strokeColor': function () { return { r: 1, g: 0.6, b: 0 }; },
    'strokeWidth': function () { return 1.0; }
  };
  layer.createFeature('line')
      .data(data)
      .line(function (d) { return d.geometry.coordinates; })
      .position(function (d, index, d2, index2) {
        return {x: d2[0],
                y: d2[1]} })
      .style(style)

  myMap.draw();

  myMap.onIdle(done);
};
