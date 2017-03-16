describe('ui', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('ui layers', function (done) {
    myMap = common.createOsmMap({center: {x: -70, y: 40}}, {}, true);

    myMap.createLayer('osm', {url: '/data/white.jpg'});
    myMap.createLayer('ui').createWidget('slider');
    myMap.createLayer('osm', {url: '/data/red.jpg'});
    myMap.createLayer('ui').createWidget('slider');
    myMap.createLayer('osm', {url: '/data/blue.jpg'});

    myMap.draw();
    imageTest.imageTest('uiLayer', null, 0.0015, done, myMap.onIdle, 0, 2);
  });
});
