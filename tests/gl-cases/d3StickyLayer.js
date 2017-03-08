describe('d3StickyLayer', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');
  var geo = require('../test-utils').geo;

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('sticky layer test', function (done) {
    var mapOptions = {center: {x: -105.0, y: 40.0}};
    myMap = common.createOsmMap(mapOptions, {}, true);

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

    movingLayer.geoOn(geo.event.d3.rescale, function (arg) {
      scaledCircle.attr('r', 10 / arg.scale);
    });

    myMap.draw();

    myMap.pan({x: 100, y: 100});
    myMap.zoom(myMap.zoom() + 0.5);

    // the image should be three points that are NOT colinear and are NOT all
    // the same size.  Specifically, the black and blue circles should be lower
    // than the red circle, and the black circle should be larger than the red
    // and blue circles
    imageTest.imageTest('d3StickyLayer', null, 0.0015, done, myMap.onIdle, 0, 2);
  });
});
