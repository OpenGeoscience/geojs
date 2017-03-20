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

describe('two maps', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');
  var $ = require('jquery');

  var map1, map2;

  beforeEach(function () {
    var twomap = $('<div id="twomap"/>').css({width: '320px', height: '480px'});
    $('#map').remove();
    $('body').prepend(twomap);
    twomap.append($('<div id="map1"/>').css({width: '100%', height: '50%'}));
    twomap.append($('<div id="map2"/>').css({width: '100%', height: '50%'}));
  });
  afterEach(function () {
    map1.exit();
    map2.exit();
    $('#twomap').remove();
  });

  it('two maps', function (done) {
    map1 = common.createOsmMap({node: '#map1', center: {x: -70, y: 40}, zoom: 3});
    map2 = common.createOsmMap({node: '#map2', center: {x: 70, y: 40}, zoom: 3});
    map1.draw();
    map2.draw();

    var idle = function (callback) {
      map1.onIdle(function () {
        map2.onIdle(callback);
      });
    };

    imageTest.imageTest('mapTwo', '#twomap', 0.0015, done, idle, 0, 2);
  });
});
