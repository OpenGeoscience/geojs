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

  it('webgl renderer', function (done) {
    myMap = common.createOsmMap({}, {
      renderer: 'webgl',
      attribution: '&copy; <a href="http://some-unvisited-domain.org">OpenStreetMap</a> contributors'
    });
    myMap.draw();

    imageTest.imageTest('osmLayerVgl', null, 0.0015, done, myMap.onIdle, 0, 2);
  });

  it('lose context and recover', function (done) {
    myMap = common.createOsmMap({center: {x: -78, y: 21}}, {
      renderer: 'webgl',
      attribution: '&copy; <a href="http://some-unvisited-domain.org">OpenStreetMap</a> contributors'
    });
    myMap.draw();
    myMap.center({x: 60, y: 20}).zoom(3);
    const gl = myMap.node().find('canvas')[0].getContext('webgl');
    const ext = gl.getExtension('WEBGL_lose_context');
    // we must wait until the context is available and then until it is lost
    window.setTimeout(() => {
      ext.loseContext();
      window.setTimeout(() => {
        ext.restoreContext();
        myMap.center({x: 0, y: 0}).zoom(2.5);
        imageTest.imageTest('osmLayerVgl', null, 0.0015, done, myMap.onIdle, 0, 2);
      }, 10);
    }, 10);
  });

  it('canvas renderer', function (done) {
    myMap = common.createOsmMap({}, {
      renderer: 'canvas',
      attribution: '&copy; <a href="http://some-unvisited-domain.org">OpenStreetMap</a> contributors'
    });
    myMap.draw();

    imageTest.imageTest('osmLayerCanvas', null, 0.0015, done, myMap.onIdle, 0, 2);
  });

  it('svg renderer', function (done) {
    myMap = common.createOsmMap({}, {
      renderer: 'svg',
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
