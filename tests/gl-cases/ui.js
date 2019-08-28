describe('ui', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var map;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    map.exit();
  });

  it('ui layers', function (done) {
    map = common.createOsmMap({center: {x: -70, y: 40}}, {}, true);

    // we should see two sliders on a solid blue background
    map.createLayer('osm', {url: '/data/white.jpg', attribution: null});
    map.createLayer('ui').createWidget('slider');
    map.createLayer('osm', {url: '/data/red.jpg', attribution: null});
    map.createLayer('ui').createWidget('slider', {position: {bottom: 0}});
    map.createLayer('osm', {url: '/data/blue.jpg', attribution: null});

    map.draw();
    imageTest.imageTest('uiLayer', null, 0.0015, done, map.onIdle, 0, 2);
  }, 30000);
});
