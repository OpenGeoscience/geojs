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
      width, height;

  window.gjsmap = myMap;
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

  // create osm base layer
  myMap.createLayer('osm');

  // create two layers
  var fixedLayer = myMap.createLayer('feature', {'renderer' : 'd3Renderer', 'sticky': false}),
      movingLayer = myMap.createLayer('feature', {'renderer': 'd3Renderer', 'sticky': true}),
      fixedSvg = fixedLayer.canvas(),
      movingSvg = movingLayer.canvas();


  // add three circles for different navigation behaviors
  fixedSvg.append('circle')
    .attr('cx', width / 4)
    .attr('cy', height / 2)
    .attr('r', 10)
    .style('fill', 'red');

  movingSvg.append('circle')
    .attr('cx', width / 2)
    .attr('cy', height / 2)
    .attr('r', 10)
    .style('fill', 'black');

  var scaledCircle = movingSvg.append('circle')
    .attr('cx', 3 * width / 4)
    .attr('cy', height / 2)
    .attr('r', 10)
    .style('fill', 'blue');
  
  movingLayer.on(geo.event.d3Rescale, function (arg) {
    scaledCircle.attr('r', 10 / arg.scale);
  });

  myMap.draw();
  
  myMap.onIdle(done);
};
