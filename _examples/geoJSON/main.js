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
  map.draw();

  // Initialize the json reader.
  var reader = geo.createFileReader('jsonReader', {'layer': layer});

  // At this point we could just attach the reader to the map like
  // this:
  //
  //   map.fileReader(reader);
  //
  // This would allow the user to drop a geojson file onto the
  // map to render it.  For this demo, we are creating an
  // editable text box that will call the reader.

  // Initialize a json string in case the ajax load fails.
  var data = '{}';

  // Load a default json to provide an example of a working
  // demo with styled features.
  $.ajax({
    url: 'data.json',
    dataType: 'text',
    success: function (_data) {
      // On successful load save the data as a string
      data = _data;
    },
    complete: function () {

      // On completion of the ajax request, generate a text editor
      // over the map using CodeMirror.
      var text;
      var config = {
        mode: 'application/json',
        matchBrackets: true,
        gutters: ['CodeMirror-lint-markers', 'CodeMirror-foldgutter'],
        foldGutter: CodeMirror.fold.brace,
        lint: CodeMirror.lint.json
      };
      text = new CodeMirror(document.body, config);

      // Here we listen for changes in the text area content.
      text.on('changes', function () {

        try {

          // Try to parse the json here.  If it fails, then we just exit.
          jsonlint.parse(text.getValue());
        } catch (err) {
          return;
        }

        // The json is valid so we start by clearing all of the current
        // features from the layer.
        layer.clear();

        // Now we call the reader to create the features from the string
        // inside the text box.
        reader.read(
          text.getValue(),
          function (/* features */) {

            // This callback is called after the features are generated.  The
            // feature objects array is given as an argument to this callback
            // for inspection or modification.  In this case, we just want
            // to redraw the map with the new features.
            map.draw();
          }
        );
      });

      // Initialize the text box with the default json data.
      text.setValue(data);
    }
  });
});
