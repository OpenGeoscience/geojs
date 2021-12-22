/* globals Blob */

var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;

describe('geo.geojsonReader', function () {
  var obj = {
    features: [{
      geometry: {
        coordinates: [102.0, 0.5],
        type: 'Point'
      },
      properties: {
        // these are deliberately properties that are not used
        color: [1, 0, 0],
        size: [10]
      },
      type: 'Feature'
    }, {
      geometry: {
        coordinates: [
          [102.0, 0.0, 0],
          [103.0, 1.0, 1],
          [104.0, 0.0, 2],
          [105.0, 1.0, 3]
        ],
        type: 'LineString'
      },
      properties: {
        color: [0, 1, 0],
        width: [3]
      },
      type: 'Feature'
    }, {
      geometry: {
        coordinates: [
          [10.0, 0.5],
          [10.0, -0.5]
        ],
        type: 'MultiPoint'
      },
      properties: {
        fillColor: '#0000ff',
        radius: 7
      },
      type: 'Feature'
    }],
    type: 'FeatureCollection'
  };

  describe('create', () => {
    it('create function', () => {
      var map, layer, reader;
      map = createMap();
      layer = map.createLayer('feature');
      reader = geo.geojsonReader({layer: layer});
      expect(reader instanceof geo.geojsonReader).toBe(true);
    });
    it('create by name', () => {
      var map, layer, reader;
      map = createMap();
      layer = map.createLayer('feature');
      reader = geo.createFileReader('geojsonReader', {layer: layer});
      expect(reader instanceof geo.geojsonReader).toBe(true);
      // create by old name
      reader = geo.createFileReader('jsonReader', {layer: layer});
      expect(reader instanceof geo.geojsonReader).toBe(true);
    });

    describe('with styles', () => {
      it('default', done => {
        var map, layer, reader;
        map = createMap();
        layer = map.createLayer('feature', {renderer: 'svg'});
        reader = geo.geojsonReader({layer: layer});
        reader.read(obj).then(result => {
          expect(layer.features()[0].style.get('fillColor')(layer.features()[0].data()[0], 0)).toEqual({r: 1, g: 0x78 / 0xff, b: 0});
          done();
        });
      });
      it('specified', done => {
        var map, layer, reader;
        map = createMap();
        layer = map.createLayer('feature', {renderer: 'svg'});
        reader = geo.geojsonReader({layer: layer, pointStyle: {fillColor: 'lightblue'}});
        reader.read(obj).then(result => {
          expect(layer.features()[0].style.get('fillColor')(layer.features()[0].data()[0], 0)).toEqual({r: 0xad / 0xff, g: 0xd8 / 0xff, b: 0xe6 / 0xff});
          done();
        });
      });
      it('from data', done => {
        var map, layer, reader;
        map = createMap();
        layer = map.createLayer('feature', {renderer: 'svg'});
        reader = geo.geojsonReader({layer: layer, pointStyle: {fillColor: 'lightblue'}});
        obj.features[0].properties.fillColor = 'yellow';
        reader.read(obj).then(result => {
          expect(layer.features()[0].style.get('fillColor')(layer.features()[0].data()[0], 0)).toEqual({r: 1, g: 1, b: 0});
          done();
        });
      });
    });
  });

  describe('Public utility methods', () => {
    it('canRead', () => {
      var map, layer, reader, file;
      map = createMap();
      layer = map.createLayer('feature');
      reader = geo.geojsonReader({layer: layer});
      expect(reader.canRead('')).toBe(false);
      expect(reader.canRead(['not a geojson object'])).toBe(false);
      expect(reader.canRead(obj)).toBe(true);
      // This could be changed to `new File`
      file = new Blob([JSON.stringify(obj)], {type: 'text/plain'});
      file.lastModifiedDate = new Date();
      file.name = 'test.txt';
      expect(reader.canRead(file)).toBe(false);
      file.name = 'test.json';
      expect(reader.canRead(file)).toBe(true);
    });
    // tests all of _readObject as part of the read test
    describe('read', () => {
      var map, layer, reader;
      it('bad object', done => {
        map = createMap();
        layer = map.createLayer('feature', {renderer: 'svg'});
        reader = geo.geojsonReader({layer: layer});

        reader.read(['not geojson object']).catch(err => {
          expect(!!err.message.match(/Invalid json type/)).toBe(true);
          done();
          reader.read(['not geojson object'], result => {
            expect(result).toBe(false);
            done();
          });
        });
      });
      it('non geojson', done => {
        reader.read('not geojson').catch(err => {
          expect(!!err.message.match(/Failed to parse/)).toBe(true);
          reader.read('not geojson', result => {
            expect(result).toBe(false);
            done();
          });
        });
      });
      it('object', done => {
        reader.read(obj).then(result => {
          expect(result.length).toBe(2);
          done();
        });
      });
      it('blob', done => {
        var file = new Blob([JSON.stringify(obj)], {type: 'text/plain'});
        file.lastModifiedDate = new Date();
        file.name = 'test.json';
        reader.read(file).then(result => {
          expect(result.length).toBe(2);
          done();
        });
      });
      it('url', done => {
        reader.read('/testdata/sample.json').then(result => {
          expect(result.length).toBe(2);
          done();
        });
      });
      it('url with non-json data', done => {
        reader.read('/testdata/white.jpg').catch(err => {
          expect(!!err.message.match(/Failed to parse/)).toBe(true);
          done();
        });
      });
    });
  });

  describe('Feature normalization', function () {
    var map, layer, reader;

    beforeEach(function () {
      map = createMap({center: [0, 0], zoom: 3});
      layer = map.createLayer('feature');
      sinon.stub(layer, 'createFeature');
      reader = geo.createFileReader('geojsonReader', {layer: layer});
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

    });

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

  it('read from object', function (done) {
    var map = createMap({center: [0, 0], zoom: 3});
    var layer = map.createLayer('feature', {renderer: 'svg'});
    var reader = geo.createFileReader('geojsonReader', {layer: layer}),
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
