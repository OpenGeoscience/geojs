// Fetch the dataset from the server
$.ajax({url: 'capitals.json'}).done(function (capitals) {
  // Create a map object with reasonable center and zoom level
  var map = geo.map({
    node: '#map',
    center: {x: 0, y: 0},
    zoom: 2.5,
    clampBoundsX: false,
    clampBoundsY: false,
    clampZoom: false,
    discreteZoom: false
  });
  // Add the map tile layer
  map.createLayer('osm', {
    zIndex: 0,
    minLevel: 4,
    keepLower: true,
    wrapX: false,
    wrapY: false
  });
  // Create a vtk point feature layer
  var vtkLayer = map.createLayer('feature', { renderer: 'vtkjs' });
  vtkLayer.createFeature('point', {
    selectionAPI: true,
    style: {
      radius: 100,  // sphere radius (~0.1km)
      fillColor: 'red',
      fillOpacity: Math.random
    }
  })
  // Bind the dataset to the vtk layer
  .data(capitals)
  .position(function (d) {
    return {x: d.longitude, y: d.latitude};  // position accessor
  })
  .draw();
});
