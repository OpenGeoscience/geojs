// Test geo.choroplethFeature and geo.gl.choroplethFeature

var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var destroyMap = require('../test-utils').destroyMap;
var mockVGLRenderer = geo.util.mockVGLRenderer;
var restoreVGLRenderer = geo.util.restoreVGLRenderer;

describe('geo.choroplethFeature', function () {
  'use strict';

  var mpdata = [{
    'type': 'Feature',
    'geometry': {
      'type': 'MultiPolygon',
      'coordinates': [
        [
          [
            [ -123.123779, 48.227039 ],
            [ -123.318787, 49.000042 ],
            [ -121.742592, 49.000267 ],
            [ -95.157394, 49.000493 ],
            [ -95.157394, 49.390418 ],
            [ -94.795532, 49.357334 ],
            [ -94.482422, 48.857487 ],
            [ -88.36853, 48.314255 ],
            [ -84.126389, 46.531937 ],
            [ -81.331787, 45.344424 ],
            [ -83.034668, 41.910453 ],
            [ -79.013672, 42.867912 ],
            [ -79.299316, 43.590338 ],
            [ -77.305298, 43.761176 ],
            [ -74.849854, 45.058001 ],
            [ -71.586914, 45.1123 ],
            [ -69.213867, 47.480088 ],
            [ -67.758179, 47.271775 ],
            [ -67.719727, 45.813486 ],
            [ -66.780396, 44.785734 ],
            [ -80.628662, 24.417142 ],
            [ -97.058716, 25.730633 ],
            [ -99.283447, 26.382028 ],
            [ -101.480713, 29.678508 ],
            [ -102.612305, 29.716681 ],
            [ -103.117676, 28.88316 ],
            [ -104.699707, 29.649869 ],
            [ -106.44104, 31.737511 ],
            [ -108.187866, 31.760867 ],
            [ -108.193359, 31.325487 ],
            [ -111.08551, 31.325487 ],
            [ -114.930725, 32.521342 ],
            [ -114.724731, 32.711044 ],
            [ -124.892578, 31.952453 ],
            [ -129.067383, 49.047486 ],
            [ -123.123779, 48.227039 ]
          ]
        ],
        [
          [
            [ -163.916016, 71.992578 ],
            [ -140.888672, 70.641769 ],
            [ -140.976562, 60.326948 ],
            [ -135.175781, 60.326948 ],
            [ -129.550781, 55.553495 ],
            [ -131.286621, 54.239551 ],
            [ -179.736328, 51.069017 ],
            [ -172.089844, 63.626745 ],
            [ -163.916016, 71.992578 ]
          ]
        ],
        [
          [
            [ -161.323242, 22.512557 ],
            [ -152.446289, 22.065278 ],
            [ -156.09375, 17.811456 ],
            [ -161.323242, 22.512557 ]
          ]
        ]
      ]
    },
    'properties': {
      'GEO_ID': 0
    }
  }];

  beforeEach(function () {
    mockVGLRenderer();
  });

  afterEach(function () {
    destroyMap();
    restoreVGLRenderer();
  });

  it('create function', function () {
    var map, layer, choropleth;
    map = createMap();
    layer = map.createLayer('feature', {renderer: 'vgl'});
    choropleth = layer.createFeature('choropleth');
    expect(choropleth instanceof geo.choroplethFeature).toBe(true);
  });

  it('direct creation', function () {
    var map, layer, choropleth;
    map = createMap();
    layer = map.createLayer('feature', {renderer: 'vgl'});
    choropleth = geo.choroplethFeature({layer: layer});
    expect(choropleth instanceof geo.choroplethFeature).toBe(true);
  });

  it('multipolygon', function () {
    var map, layer, choropleth, scalarData = [
          {'id': 0, 'value': 10}
        ];

    map = createMap();
    layer = map.createLayer('feature', {renderer: 'vgl'});

    choropleth = layer.createFeature('choropleth')
                   .data(mpdata)
                   .scalar(scalarData);
    choropleth.choropleth('name', 'multipolygon');
    expect(choropleth instanceof geo.choroplethFeature).toBe(true);
    expect(choropleth.choropleth('name')).toBe('multipolygon');
    expect(choropleth.choropleth.get('accessors')()
      .scalarValue(scalarData[0])).toBe(10);
    expect(choropleth.choropleth.get('accessors')()
      .geoId(mpdata[0])).toBe(0);
    expect(Object.keys(choropleth.choropleth.get())).toEqual([
      'colorRange', 'scale', 'accessors', 'scalar',
      'scalarAggregator', 'name']);
  });
});
