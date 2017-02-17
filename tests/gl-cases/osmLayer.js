describe('osmLayer', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('vgl renderer', function (done) {
    myMap = common.createOsmMap({}, {
      renderer: 'vgl',
      attribution: '&copy; <a href="http://some-unvisited-domain.org">OpenStreetMap</a> contributors'
    });
    myMap.draw();

    imageTest.imageTest('osmLayerVgl', null, 0.0015, done, myMap.onIdle, 0, 2);
  });

  it('canvas renderer', function (done) {
    myMap = common.createOsmMap({}, {
      renderer: 'canvas',
      attribution: '&copy; <a href="http://some-unvisited-domain.org">OpenStreetMap</a> contributors'
    });
    myMap.draw();

    imageTest.imageTest('osmLayerCanvas', null, 0.0015, done, myMap.onIdle, 0, 2);
  });

  it('d3 renderer', function (done) {
    myMap = common.createOsmMap({}, {
      renderer: 'd3',
      attribution: '&copy; <a href="http://some-unvisited-domain.org">OpenStreetMap</a> contributors'
    });
    myMap.draw();

    imageTest.imageTest('osmLayerD3', null, 0.0015, done, myMap.onIdle, 0, 2);
  });

  it('html renderer', function (done) {
    myMap = common.createOsmMap({}, {
      renderer: null,
      attribution: '&copy; <a href="http://some-unvisited-domain.org">OpenStreetMap</a> contributors'
    });
    myMap.draw();

    imageTest.imageTest('osmLayerHTML', null, 0.0015, done, myMap.onIdle, 0, 2);
  });
});
