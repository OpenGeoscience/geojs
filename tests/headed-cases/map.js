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
