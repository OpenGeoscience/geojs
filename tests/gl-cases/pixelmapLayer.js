var $ = require('jquery');
var geo = require('../test-utils').geo;

describe('webglPixelmapLayer', function () {
  var imageTest = require('../image-test');

  var map, layer;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    map.exit();
  });

  /**
   * Create a tiled pixelmap layer.
   *
   * @param {object} layerParams Optional layer parameters.
   */
  function createPixelmap(layerParams) {
    var params = geo.util.pixelCoordinateParams('#map', 4096, 4096, 2048, 2048);
    params.layer.url = '/data/pixelmap_{z}_{x}_{y}.png';
    params.layer.data = new Array(5112).fill(0);
    params.layer.style = {
      color: (d, i) => {
        if (i % 2) {
          return 'yellow';
        }
        i = Math.floor(i / 2);
        switch (i % 3) {
          case 0: return 'red';
          case 1: return 'green';
          case 2: return 'blue';
        }
      }
    };
    if (layerParams) {
      params.layer = $.extend({}, params.layer, layerParams);
    }
    map = geo.map(params.map);
    layer = map.createLayer('pixelmap', params.layer);
    map.draw();
  }

  it('basic', function (done) {
    createPixelmap();
    expect(layer instanceof geo.pixelmapLayer).toBe(true);
    expect(layer.features().length).toBe(2);
    imageTest.imageTest('pixelmapLayer', null, 0.0015, done, map.onIdle, 5000, 2);
  });
  it('color in params', function () {
    createPixelmap({style: undefined, color: 'black'});
    expect(layer.style.get('color')(0, 0)).toEqual({r: 0, b: 0, g: 0});
  });
  it('indexModified', function (done) {
    createPixelmap();
    expect(layer.indexModified()).toBe(undefined);
    layer.indexModified(2);
    expect(layer.indexModified()).toEqual([2, 2]);
    layer.indexModified(4);
    expect(layer.indexModified()).toEqual([2, 4]);
    layer.indexModified(1, 3);
    expect(layer.indexModified()).toEqual([1, 4]);
    layer.indexModified(undefined, 'clear');
    expect(layer.indexModified()).toBe(undefined);
    layer.indexModified(2);
    layer.draw();
    map.onIdle(done);
  });
  it('geoOn and geoOff', function (done) {
    createPixelmap();
    var click = false;
    layer.geoOn(geo.event.feature.mouseclick, () => {
      click = true;
    });
    // wait for the tiles to be available
    map.onIdle(() => {
      expect(click).toBe(false);
      map.interactor().simulateEvent('mousedown', {map: {x: 390, y: 200}});
      map.interactor().simulateEvent('mouseup', {map: {x: 390, y: 200}});
      expect(click).toBe(true);
      click = false;
      layer.geoOff(geo.event.feature.mouseclick);
      map.interactor().simulateEvent('mousedown', {map: {x: 390, y: 200}});
      map.interactor().simulateEvent('mouseup', {map: {x: 390, y: 200}});
      expect(click).toBe(false);
      done();
    });
  });
  it('geoOn and geoOff from array', function (done) {
    createPixelmap();
    var click = 0;
    layer.geoOn([geo.event.feature.mouseclick], () => {
      click += 1;
    });
    // wait for the tiles to be available
    map.onIdle(() => {
      expect(click).toEqual(0);
      map.interactor().simulateEvent('mousedown', {map: {x: 390, y: 200}});
      map.interactor().simulateEvent('mouseup', {map: {x: 390, y: 200}});
      expect(click).toEqual(1);
      layer.geoOff([geo.event.feature.mouseclick]);
      map.interactor().simulateEvent('mousedown', {map: {x: 390, y: 200}});
      map.interactor().simulateEvent('mouseup', {map: {x: 390, y: 200}});
      expect(click).toEqual(1);
      done();
    });
  });
  it('geospatial', function (done) {
    map = geo.map({node: '#map'});
    layer = map.createLayer('pixelmap', {
      url: geo.osmLayer.tileSources.osm.url,
      data: new Array(5112).fill(0),
      color: 'black'
    });
    map.draw();
    map.onIdle(() => {
      expect(layer instanceof geo.pixelmapLayer).toBe(true);
      expect(layer.features().length).toBe(2);
      done();
    });
  });
});
