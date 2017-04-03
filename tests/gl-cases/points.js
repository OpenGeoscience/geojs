describe('points', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  function addLayerAndFeature(layerOpts, citieslatlon) {
    var layer = myMap.createLayer('feature', layerOpts);

    var feature = layer.createFeature('point')
      .data(citieslatlon)
      .style('radius', 10.0)
      .style('strokeColor', { r: 0.0, g: 1.0, b: 0.0 })
      .style('strokeWidth', 2)
      .style('fillColor', function (d) {
        if (d.lon < -100) {
          return {r: 1.0, g: 0.0, b: 0.0};
        }
        return {r: 0.0, g: 0.0, b: 1.0};
      })
      .style('fillOpacity', function (d) {
        if (d.lon < -100) {
          return 0.5;
        } else {
          return 0.25;
        }
      })
      .position(function (d) { return {x: d.lon, y: d.lat, z: d.elev}; });
    return feature;
  }

  it('d3Points test', function (done) {
    var mapOptions = {center: {x: -105.0, y: 40.0}};
    myMap = common.createOsmMap(mapOptions, {}, true);
    common.loadCitiesData(function (citieslatlon) {
      addLayerAndFeature({'renderer': 'd3'}, citieslatlon);

      myMap.draw();

      imageTest.imageTest('d3Points', null, 0.0015, done, myMap.onIdle, 0, 2);
    }, 30);  // only load 30 cities
  });

  it('glPoints test', function (done) {
    var mapOptions = {center: {x: -105.0, y: 40.0}};
    myMap = common.createOsmMap(mapOptions, {}, true);
    common.loadCitiesData(function (citieslatlon) {
      addLayerAndFeature({'renderer': 'vgl'}, citieslatlon);

      myMap.draw();

      imageTest.imageTest('glPoints', null, 0.0015, done, myMap.onIdle, 0, 2);
    });  // load all cities
  });

  it('glPoints no fill test', function (done) {
    var mapOptions = {center: {x: -105.0, y: 40.0}};
    myMap = common.createOsmMap(mapOptions, {}, true);
    common.loadCitiesData(function (citieslatlon) {
      var feature = addLayerAndFeature({'renderer': 'vgl'}, citieslatlon);
      feature.style('fill', false);
      myMap.draw();
      imageTest.imageTest('glPointsNoFill', null, 0.0015, done, myMap.onIdle, 0, 2);
    });
  });

  it('glPoints no stroke test', function (done) {
    var mapOptions = {center: {x: -105.0, y: 40.0}};
    myMap = common.createOsmMap(mapOptions, {}, true);
    common.loadCitiesData(function (citieslatlon) {
      var feature = addLayerAndFeature({'renderer': 'vgl'}, citieslatlon);
      feature.style('stroke', false);
      myMap.draw();
      imageTest.imageTest('glPointsNoStroke', null, 0.0015, done, myMap.onIdle, 0, 2);
    });
  });

  it('glPoints transparent test', function (done) {
    var mapOptions = {center: {x: -105.0, y: 40.0}};
    myMap = common.createOsmMap(mapOptions, {}, true);
    common.loadCitiesData(function (citieslatlon) {
      var feature = addLayerAndFeature({'renderer': 'vgl'}, citieslatlon);
      feature.style('fillOpacity', 0.2)
             .style('strokeOpacity', 0.2);
      myMap.draw();
      imageTest.imageTest('glPointsTransparent', null, 0.0015, done, myMap.onIdle, 0, 2);
    });
  });

  it('glPoints with quad test', function (done) {
    var mapOptions = {center: {x: -105.0, y: 40.0}};
    myMap = common.createOsmMap(mapOptions, {}, true);

    var layer2 = myMap.createLayer('feature');
    layer2.createFeature('quad')
      .data([{
        ul: {x: -180, y: 80},
        lr: {x: 180, y: -80},
        image: '/data/land_shallow_topo_2048.png'
      }]);
    layer2.name = 'layer2';

    common.loadCitiesData(function (citieslatlon) {
      var feature = addLayerAndFeature({'renderer': 'vgl'}, citieslatlon);
      feature.style('fillOpacity', 0.2)
             .style('strokeOpacity', 0.2);
      myMap.draw();
      imageTest.imageTest('glPointsWithQuad', null, 0.0015, done, myMap.onIdle, 0, 2);
    }, 1000);
  });

  it('point clustering', function (done) {
    var step1, step2;
    var mapOptions = {center: {x: -99, y: 40.3}, zoom: 2};
    myMap = common.createOsmMap(mapOptions, {}, true);

    step1 = function () {
      imageTest.imageTest('pointClustering', null, 0.0015, step2, myMap.onIdle, 0, 2);
    };

    step2 = function () {
      myMap.zoom(5).center({x: -99, y: 40});
      imageTest.imageTest('pointClusteringZoom', null, 0.0015, done, myMap.onIdle, 0, 2);
    };

    common.loadCitiesData(function (citieslatlon) {
      var layer = myMap.createLayer('feature');
      layer.createFeature('point')
        .clustering(true)
        .data(citieslatlon)
        .style('radius', function (d) {
          if (d.__cluster) {
            return 10.0;
          }
          return 6;
        })
        .style('strokeColor', 'black')
        .style('strokeWidth', function (d) {
          if (d.__cluster) {
            return 2;
          }
          return 0;
        })
        .style('fillColor', function (d) {
          if (d.__cluster) {
            return 'grey';
          }
          return 'red';
        })
        .style('fillOpacity', function (d) {
          if (d.__cluster) {
            return 0.25;
          } else {
            return 1;
          }
        })
        .position(function (d) { return {x: d.lon, y: d.lat, z: d.elev}; });
      myMap.draw();

      step1();
    }, 5000);
  }, 10000);
});
