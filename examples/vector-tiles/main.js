// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    center: {
      x: -125,
      y: 36.5
    },
    zoom: 4
  });

  // Add the osm layer with a custom tile url
  map.createLayer(
    'osm',
    {
      url: 'http://tile.stamen.com/toner-lite/{z}/{x}/{y}.png',
      attribution: ['Map tiles by <a href="http://stamen.com">Stamen Design</a>,',
        'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.',
        'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under',
        '<a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
      ].join(' ')
    }
  );

  // Create a layer to put the features in.  We could need point, line, and
  // polygon features, so ask for a layer that supports all of them.
  var layer = map.createLayer('feature', {features: ['point', 'line', 'polygon']});
  map.geoOn(geo.event.pan, () => {
    // console.log(map)
    // console.log(map.bounds())
  })
  map.draw();

  // Initialize the json reader.
  var vectorTileReader = geo.createFileReader('vectorTile', {'layer': layer});

  // At this point we could just attach the reader to the map like
  // this:
  //
  //   map.fileReader(reader);
  //
  // This would allow the user to drop a geojson file onto the
  // map to render it.  For this demo, we are creating an
  // editable text box that will call the reader.

  // Load a default json to provide an example of a working
  // demo with styled features.
  $.ajax({
    url: 'countries.json',
    dataType: 'json',
    success: function (geojson) {
      // On successful load save the data as a string
      vectorTileReader.read(
        geojson,
        map,
        function (/* features */) {

          // This callback is called after the features are generated.  The
          // feature objects array is given as an argument to this callback
          // for inspection or modification.  In this case, we just want
          // to redraw the map with the new features.
          map.draw();
        }
      );
    }
  });
});
