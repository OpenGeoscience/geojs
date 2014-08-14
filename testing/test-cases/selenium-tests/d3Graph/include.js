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
      table = [],
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
  table = [
    [ 'NEW YORK', 'NY', '40.757929', '-73.985506'],
    ['LOS ANGELES', 'CA', '34.052187', '-118.243425'],
    ['DENVER', 'CO', '39.755092', '-104.988123'],
    ['PORTLAND', 'OR', '45.523104', '-122.670132'],
    ['HONOLULU', 'HI', '21.291982', '-157.821856'],
    ['ANCHORAGE', 'AK', '61.216583', '-149.899597'],
    ['DALLAS', 'TX', '32.781078', '-96.797111'],
    ['SALT LAKE CITY', 'UT', '40.771592', '-111.888189'],
    ['MIAMI', 'FL', '25.774252', '-80.190262'],
    ['PHOENIX', 'AZ', '33.448263', '-112.073821'],
    ['CHICAGO', 'IL', '41.879535', '-87.624333'],
    ['WASHINGTON', 'DC', '38.892091', '-77.024055'],
    ['SEATTLE', 'WA', '47.620716', '-122.347533'],
    ['NEW ORLEANS', 'LA', '30.042487', '-90.025126'],
    ['SAN FRANCISCO', 'CA', '37.775196', '-122.419204'],
    ['ATLANTA', 'GA', '33.754487', '-84.389663']
  ];

  if (table.length > 0) {
    var i;
    for (i = 0; i < table.length; i += 1) {
      if (table[i][2] !== undefined) {
        var lat = table[i][2];
        lat = lat.replace(/(^\s+|\s+$|^\"|\"$)/g, '');
        lat = parseFloat(lat);

        var lon = table[i][3];
        lon = lon.replace(/(^\s+|\s+$|^\"|\"$)/g, '');
        lon = parseFloat(lon);
        citieslatlon.push(geo.latlng(lat, lon));
      }
    }
  }

  citieslatlon.forEach(function (c, i) {
      c.children = [
        citieslatlon[(i + 1) % citieslatlon.length],
        citieslatlon[(i + 2) % citieslatlon.length]
      ];
    }
  );

  // Load image to be used for drawing dots
  myMap.createLayer('osm');
  var layer = myMap.createLayer('feature', {'renderer' : 'd3Renderer'}),
      style = {
    nodes: {
        color: [1, 0, 0],
        size: [5],
        opacity: 0.5
      },
      links: {
        color: [0, 0, 0],
      },
      linkType: 'path'
    };
  layer.createFeature('graph')
      .style(style)
      .nodes(citieslatlon);
  myMap.draw();

  myMap.onIdle(done);
};
