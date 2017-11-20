describe('geojsonReader', function () {
  var geo = require('../test-utils').geo;
  var createMap = require('../test-utils').createMap;

  describe('geojsonReader', function () {
    'use strict';

    var obj, map, layer;

    describe('Feature normalization', function () {
      var reader;

      beforeEach(function () {
        map = createMap({center: [0, 0], zoom: 3});
        layer = map.createLayer('feature', {renderer: 'd3'});
        sinon.stub(layer, 'createFeature');
        reader = geo.createFileReader('jsonReader', {'layer': layer});
      });
      afterEach(function () {
        layer.createFeature.restore();
      });

      describe('bare geometry', function () {
        it('Point', function () {
          expect(reader._featureArray({
            type: 'Point',
            coordinates: [1, 2]
          })).toEqual([{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [1, 2]
            }
          }]);
        });
        it('LineString', function () {
          expect(reader._featureArray({
            type: 'LineString',
            coordinates: [[1, 2], [3, 4]]
          })).toEqual([{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [[1, 2], [3, 4]]
            }
          }]);
        });
        it('Polygon', function () {
          expect(reader._featureArray({
            type: 'Polygon',
            coordinates: [[[1, 2], [3, 4], [5, 6]]]
          })).toEqual([{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[[1, 2], [3, 4], [5, 6]]]
            }
          }]);
        });
        it('MultiPoint', function () {
          expect(reader._featureArray({
            type: 'MultiPoint',
            coordinates: [[1, 2], [3, 4]]
          })).toEqual([{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [1, 2]
            }
          }, {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [3, 4]
            }
          }]);
        });
        it('MultiLineString', function () {
          expect(reader._featureArray({
            type: 'MultiLineString',
            coordinates: [[[1, 2], [3, 4]]]
          })).toEqual([{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [[1, 2], [3, 4]]
            }
          }]);
        });
        it('MultiPolygon', function () {
          expect(reader._featureArray({
            type: 'MultiPolygon',
            coordinates: [[[[1, 2], [3, 4], [5, 6]]]]
          })).toEqual([{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[[1, 2], [3, 4], [5, 6]]]
            }
          }]);
        });
      });

      it('GeometryCollection', function () {
        expect(reader._featureArray({
          type: 'GeometryCollection',
          geometries: [
            {
              type: 'Point',
              coordinates: [0, 0]
            }, {
              type: 'MultiPoint',
              coordinates: [[0, 1], [2, 3]]
            }
          ]
        })).toEqual([
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }, {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [0, 1]
            }
          }, {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [2, 3]
            }
          }
        ]);
      });

      it('Feature', function () {
        expect(reader._featureArray({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [1, 2]
          },
          properties: {a: 1}
        })).toEqual([{
          type: 'Feature',
          properties: {a: 1},
          geometry: {
            type: 'Point',
            coordinates: [1, 2]
          }
        }]);
      });

      it('FeatureCollection', function () {
        expect(reader._featureArray({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [1, 2]
            },
            properties: {a: 1}
          }, {
            type: 'Feature',
            geometry: {
              type: 'MultiPoint',
              coordinates: [[0, 0], [1, 1]]
            },
            properties: {b: 2}
          }]
        })).toEqual([{
          type: 'Feature',
          properties: {a: 1},
          geometry: {
            type: 'Point',
            coordinates: [1, 2]
          }
        }, {
          type: 'Feature',
          properties: {b: 2},
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          }
        }, {
          type: 'Feature',
          properties: {b: 2},
          geometry: {
            type: 'Point',
            coordinates: [1, 1]
          }
        }]);

        it('empty geometry', function () {
          expect(reader._featureArray({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: []
              }
            }, {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            }, {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: []
              }
            }]
          })).toEqual([]);
        });
      });

      describe('Errors', function () {
        it('Invalid geometry', function () {
          expect(function () {
            reader._feature({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'pt',
                coordinates: [0, 0]
              }
            });
          }).toThrow();
        });

        it('Invalid feature', function () {
          expect(function () {
            reader._feature({
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [0, 0]
              }
            });
          }).toThrow();
        });
        it('Invalid JSON', function () {
          expect(function () {
            reader._featureArray({
              features: []
            });
          }).toThrow();
        });
      });
    });

    it('Setup map', function () {
      map = createMap({center: [0, 0], zoom: 3});
      layer = map.createLayer('feature', {renderer: 'd3'});

      obj = {
        'features': [
          {
            'geometry': {
              'coordinates': [
                102.0,
                0.5
              ],
              'type': 'Point'
            },
            'properties': {
              'color': [1, 0, 0],
              'size': [10]
            },
            'type': 'Feature'
          },
          {
            'geometry': {
              'coordinates': [
                [
                  102.0,
                  0.0,
                  0
                ],
                [
                  103.0,
                  1.0,
                  1
                ],
                [
                  104.0,
                  0.0,
                  2
                ],
                [
                  105.0,
                  1.0,
                  3
                ]
              ],
              'type': 'LineString'
            },
            'properties': {
              'color': [0, 1, 0],
              'width': [3]
            },
            'type': 'Feature'
          },
          {
            'geometry': {
              'coordinates': [
                [
                  10.0,
                  0.5
                ],
                [
                  10.0,
                  -0.5
                ]
              ],
              'type': 'MultiPoint'
            },
            'properties': {
              'fillColor': '#0000ff',
              'radius': 7
            },
            'type': 'Feature'
          }
        ],
        'type': 'FeatureCollection'
      };
    });
    it('read from object', function (done) {
      var reader = geo.createFileReader('jsonReader', {'layer': layer}),
          data, i;

      expect(reader.canRead(obj)).toBe(true);
      reader.read(obj, function (features) {
        expect(features.length).toEqual(2);

        // Validate that we are getting the correct Z values
        data = features[1].data()[0];
        for (i = 0; i < data.length; i += 1) {
          expect(data[i].z()).toEqual(i);
        }

        done();
      });
    });

  });
});
