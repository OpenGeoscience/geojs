window.startTest = function (done) {
  'use strict';

  var mapOptions = { center : { y: 40.0, x: -105.0 } };
  var myMap = window.geoTests.createOsmMap(mapOptions);
  var width = myMap.node().width(), height = myMap.node().height();

  // create two layers
  var fixedLayer = myMap.createLayer('feature', {'renderer' : 'd3', 'sticky': false}),
      movingLayer = myMap.createLayer('feature', {'renderer': 'd3', 'sticky': true}),
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

  movingLayer.geoOn(geo.event.d3Rescale, function (arg) {
    scaledCircle.attr('r', 10 / arg.scale);
  });

  myMap.draw();

  myMap.onIdle(done);
};
