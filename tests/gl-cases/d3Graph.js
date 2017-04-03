describe('d3Graph', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('graph test', function (done) {
    var mapOptions = {center: {x: -105.0, y: 40.0}, zoom: 3.5};
    myMap = common.createOsmMap(mapOptions, {}, true);
    common.loadCitiesData(function (citieslatlon) {
      citieslatlon.forEach(function (c, i) {
        c.children = [
          citieslatlon[(i + 1) % citieslatlon.length],
          citieslatlon[(i + 2) % citieslatlon.length]
        ];
        c.x = c.lon;
        c.y = c.lat;
      });

      var layer = myMap.createLayer('feature', {'renderer' : 'd3'});
      layer.createFeature('graph')
          .data(citieslatlon)
          .style({
            nodes: {
              stroke: false,
              fillOpacity: 0.5
            },
            linkType: 'path'
          });
      myMap.draw();

      imageTest.imageTest('d3Graph', null, 0.0015, done, myMap.onIdle, 0, 2);
    }, 10);  // just load 10 cities
  });
});
