describe('map', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('map bounds', function (done) {
    myMap = common.createOsmMap({
      center: {x: -80, y: 30},
      zoom: 2,
      clampZoom: true,
      clampBoundsX: false,
      clampBoundsY: false,
      maxZoom: 4
    }, {});
    myMap.draw();
    myMap.bounds({left: 113, right: 153, bottom: -45, top: -5});

    imageTest.imageTest('mapBounds', null, 0.0015, done, myMap.onIdle, 0, 2);
  });

  it('map center', function (done) {
    myMap = common.createOsmMap({center: {x: -78, y: 21}}, {});
    myMap.draw();
    myMap.center({x: 60, y: 20});

    imageTest.imageTest('mapCenter', null, 0.0015, done, myMap.onIdle, 0, 2);
  });

  it('map center and zoom', function (done) {
    myMap = common.createOsmMap({center: {x: -78, y: 21}}, {});
    myMap.draw();
    myMap.center({x: 60, y: 20}).zoom(3);

    imageTest.imageTest('mapZoom', null, 0.0015, done, myMap.onIdle, 0, 2);
  });
});
