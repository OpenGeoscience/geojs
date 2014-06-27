window.startTest = function (done) {
  'use strict';

  function processCSVData(csvdata) {
    var table = [];
    var lines = csvdata.split(/\r\n|\n/);

    for (var i = 0; i < lines.length; i += 1) {
      var row = lines[i].split(',');
      table.push(row);
    }
    return table;
  }

  var mapOptions = {
    node: '#map',
    zoom : 3,
    center : [0.0, 0.0]
  };

  var myMap = geo.map(mapOptions),
      table = [],
      citieslatlon = [],
      colors = [];

  function resizeCanvas() {
    $('#map').width('100%');
    $('#map').height('100%');

    myMap.resize(0, 0, $('#map').width(), $('#map').height());
  }

  /// Resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);

  resizeCanvas();

  /// Read city geo-coded data
  $.ajax({
    type : 'GET',
    url : '/data/cities.csv',
    dataType : 'text',
    success : function (data) {
      table = processCSVData(data);
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
            citieslatlon.push(lon, lat, 0.0);
            colors.push(1.0, 1.0, 153.0 / 255.0);
          }
        }
      }


      var layer1 = myMap.createLayer('feature');
      layer1.createFeature('point')
        .positions(citieslatlon);
      layer1.name = 'layer1';

      var layer2 = myMap.createLayer('feature');
      layer2.createFeature('plane')
        .origin(geo.latlng(-10.0, -20.0))
        .upperLeft(geo.latlng(10.0, -20.0))
        .lowerRight(geo.latlng(-10.0, 20.0))
        .style('image', '/data/land_shallow_topo_2048.png');
      layer2.name = 'layer2';

      myMap.draw();
      done();
    }
  });
};
