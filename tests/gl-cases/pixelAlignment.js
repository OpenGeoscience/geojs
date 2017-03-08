describe('Pixel Alignment', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('pixel alignment', function (done) {
    var mapOptions = {
      center: {x: -105.0, y: 40.0},
      zoom: 8,
      discreteZoom: true
    };
    myMap = common.createOsmMap(mapOptions, {url: '/data/tilefancy.png'});

    myMap.draw();

    imageTest.imageTest('pixelAlignment', null, 0, done, myMap.onIdle, 0, 2);
  });
});
