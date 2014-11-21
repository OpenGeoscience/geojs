/* global CodeMirror, jsonlint */
// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    zoom: 1
  });

  // Add the osm layer with a custom tile url
  map.createLayer(
    'osm',
    {
      baseUrl: 'http://otile1.mqcdn.com/tiles/1.0.0/map/'
    }
  );

  var layer = map.createLayer('feature');
  var reader = geo.createFileReader('jsonReader', {'layer': layer});

  // Make the map resize with the browser window
  $(window).resize(function () {
    map.resize(0, 0, map.node().width(), map.node().height());
  });

  // Draw the map
  map.draw();

  var text, drawing = false;
  var config = {
    mode: 'application/json',
    lineNumbers: true,
    matchBrackets: true,
    gutters: ['CodeMirror-lint-markers'],
    lint: CodeMirror.lint.json // jshint ignore: line
  };
  text = new CodeMirror(document.body, config);
  text.on('changes', function () {
    layer.clear();
    try {
      reader.read(
        jsonlint.parse(text.getValue()),
        function (/* features */) {
          map.draw();
          drawing = false;
        }
      );
      drawing = true;
    } catch (err) {
    }
  });
});
