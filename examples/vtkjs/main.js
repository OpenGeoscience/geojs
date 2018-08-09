var exampleDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  var capitals;
  $.when(
    /* Fetch capitals */
    $.ajax({url: 'capitals.json'}).done(function (resp) {
      capitals = resp;
    })
  ).then(function () {

    // Set map defaults to a reasonable center and zoom level
    var mapParams = {
      node: '#map',
      center: {x: 0, y: 0},
      zoom: 2.5,
      clampBoundsX: false,
      clampBoundsY: false,
      clampZoom: false,
      discreteZoom: false
    };
    // Set the tile layer defaults
    var layerParams = {
      zIndex: 0,
      minLevel: 4,
      keepLower: true,
      wrapX: false,
      wrapY: false
    };
    // Create a map object
    var map = geo.map(mapParams);
    // Add the tile layer with the specified parameters
    var osmLayer = map.createLayer('osm', layerParams);
    // Set the vtk feature layer params
    var vtkLayerParams = {
      renderer: 'vtkjs'
    };
    // Create a vtk point feature layer
    var vtkLayer = map.createLayer('feature', vtkLayerParams);
    var pointFeature = vtkLayer
      .createFeature('point', {
        selectionAPI: true,
        style: {
          radius: 100,                            // sphere radius (~0.1km)
          fillColor: 'red',
          fillOpacity: function () {
            return Math.random();
          }
        }
      })
    .data(capitals)                                               // bind data
    .position(function (d) {
      return {x: d.longitude, y: d.latitude};           // position accessor
    })
    .draw();

    // Make variables available as a global for easier debug
    exampleDebug.map = map;
    exampleDebug.mapParams = mapParams;
    exampleDebug.layerParams = layerParams;
    exampleDebug.osmLayer = osmLayer;
    exampleDebug.vtkLayerParams = vtkLayerParams;
    exampleDebug.vtkLayer = vtkLayer;
    exampleDebug.pointFeature = pointFeature;
  });
});
