describe('d3Lines', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');
  var geo = require('../test-utils').geo;
  var d3 = require('d3');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('line test', function (done) {
    var mapOptions = {center: {x: -105.0, y: 40.0}, zoom: 3.5};
    myMap = common.createOsmMap(mapOptions, {}, true);
    common.loadCitiesData(function (citieslatlon) {
      var layer = myMap.createLayer('feature', {'renderer': 'd3'});

      var color = d3.scale.category20().domain(d3.range(20));

      var vectors = layer.createFeature('vector')
        .data(citieslatlon)
        .origin(function (d) { return { x: d.lon, y: d.lat }; })
        .style('strokeColor', function (d, i) {
          return color(i % 20);
        })
        .style('strokeWidth', 2.5);

      function setDelta() {
        var center = myMap.center();
        vectors.delta(function (d) {
          return {
            x: center.x - d.lon,
            y: center.y - d.lat
          };
        }).draw();
      }

      setDelta();
      layer.geoOn(geo.event.pan, setDelta);
      myMap.draw();

      imageTest.imageTest('d3Vectors', null, 0.0015, done, myMap.onIdle, 0, 2);
    }, 30);
  });
});
