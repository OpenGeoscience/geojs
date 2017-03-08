describe('layerReorder', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap, l1, l2, l3, layers;

  beforeEach(function () {
    imageTest.prepareImageTest();

    var mapOptions = {center: {x: -0, y: 0}, zoom: 2};
    myMap = common.createOsmMap(mapOptions, {url: '/testdata/white.jpg'});

    l1 = myMap.children()[0];
    l2 = myMap.createLayer('feature', {renderer: 'vgl'});
    l3 = myMap.createLayer('feature', {renderer: 'd3'});
    layers = [l1, l2, l3];

    l2.createFeature('point')
      .data([{x: -20, y: 0}, {x: 0, y: 0}])
      .style({
        stroke: false,
        fillColor: 'red',
        radius: 15,
        fillOpacity: 1
      });

    l3.createFeature('point')
      .data([{x: 20, y: 0}, {x: 0, y: 0}])
      .style({
        stroke: false,
        fillColor: 'blue',
        radius: 15,
        fillOpacity: 1
      });

  });

  afterEach(function () {
    myMap.exit();
  });

  it('layer order', function (done) {
    var step1, step2, step3, step4;

    myMap.draw();

    function layerOrder(z1, z2, z3) {
      l1.zIndex(z1);
      l2.zIndex(z2);
      l3.zIndex(z3);
    }

    step1 = function () {
      imageTest.imageTest('layerOrder123', null, 0.0015, step2, myMap.onIdle, 0, 2);
    };

    step2 = function () {
      layerOrder(10, 9, 11);
      imageTest.imageTest('layerOrder213', null, 0.0015, step3, myMap.onIdle, 0, 2);
    };

    step3 = function () {
      layerOrder(10, 12, 11);
      imageTest.imageTest('layerOrder132', null, 0.0015, step4, myMap.onIdle, 0, 2);
    };

    step4 = function () {
      layerOrder(15, 14, 13);
      imageTest.imageTest('layerOrder321', null, 0.0015, done, myMap.onIdle, 0, 2);
    };

    step1();
  });

  it('layer move up', function (done) {
    var step1, step2, step3;

    myMap.draw();

    step1 = function () {
      layers[2].moveUp(-1);  // d3 below vgl
      imageTest.imageTest('layerOrderUp2_-1', null, 0.0015, step2, myMap.onIdle, 0, 2);
    };

    step2 = function () {
      layers[0].moveUp(2);  // osm layer to top
      imageTest.imageTest('layerOrderUp0_2', null, 0.0015, step3, myMap.onIdle, 0, 2);
    };

    step3 = function () {
      layers[1].moveUp();  // vgl up one
      imageTest.imageTest('layerOrderUp1_1', null, 0.0015, done, myMap.onIdle, 0, 2);
    };

    step1();
  });

  it('layer move down', function (done) {
    var step1, step2, step3;

    myMap.draw();

    step1 = function () {
      layers[0].moveDown();  // osm layer down (no-op)
      imageTest.imageTest('layerOrderDown0', null, 0.0015, step2, myMap.onIdle, 0, 2);
    };

    step2 = function () {
      layers[2].moveDown(1);  // d3 below vgl
      imageTest.imageTest('layerOrderDown2_1', null, 0.0015, step3, myMap.onIdle, 0, 2);
    };

    step3 = function () {
      layers[0].moveDown(-5);  // osm to top
      imageTest.imageTest('layerOrderDown0_-5', null, 0.0015, done, myMap.onIdle, 0, 2);
    };

    step1();
  });
});
