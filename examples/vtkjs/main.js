// Fetch the dataset from the server
$.ajax({url: '../reprojection/capitals.json'}).done(function (capitals) {
  // Create a map
  var map = geo.map({node: '#map'});
  // Add the map tile layer
  map.createLayer('osm');
  // Create a vtk point feature layer
  var vtkLayer = map.createLayer('feature', {renderer: 'vtkjs'});
  vtkLayer.createFeature('point', {
    selectionAPI: true,
    style: {
      radius: 5,
      fillColor: 'red',
      fillOpacity: 1
    }
  })
  // Bind the dataset to the vtk layer
  .data(capitals)
  .position(function (d) {
    return {x: d.longitude, y: d.latitude};  // position accessor
  })
  .draw();
});
