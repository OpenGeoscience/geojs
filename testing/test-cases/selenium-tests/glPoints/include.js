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
    zoom : 2,
    center : [40.0, -150.0]
  };

  var myMap = geo.map(mapOptions),
      table = [],
      citieslatlon = [],
      colors = [];

  function resizeCanvas() {
    $('#map').width('100%');
    $('#map').height('100%');

    myMap.resize(0, 0, $('#map').width(), $('#map').height());
    myMap.draw();
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

      myMap.createLayer('osm');
      myMap.draw();
      var layer = myMap.createLayer('feature');
      layer.createFeature('point')
        .positions(citieslatlon);
      myMap.draw();
      myMap.onIdle(done);
    }
  });
};
