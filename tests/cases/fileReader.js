/* globals Blob */

var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;

describe('geo.fileReader', function () {
  'use strict';

  describe('create', function () {
    it('create function', function () {
      var map, layer, reader;
      map = createMap();
      layer = map.createLayer('feature');
      reader = geo.fileReader({layer: layer});
      expect(reader instanceof geo.fileReader).toBe(true);
      expect(function () {
        geo.fileReader();
      }).toThrow(new Error('fileReader must be given a feature layer'));
    });
  });

  describe('Check class accessors', function () {
    it('layer', function () {
      var map, layer, reader;
      map = createMap();
      layer = map.createLayer('feature');
      reader = geo.fileReader({layer: layer});
      expect(reader.layer()).toBe(layer);
    });
  });

  describe('Public utility methods', function () {
    it('canRead', function () {
      var map, layer, reader;
      map = createMap();
      layer = map.createLayer('feature');
      reader = geo.fileReader({layer: layer});
      // the default canRead implementation returns false
      expect(reader.canRead('')).toBe(false);
    });
    it('read', function (done) {
      var map, layer, reader;
      map = createMap();
      layer = map.createLayer('feature');
      reader = geo.fileReader({layer: layer});
      expect(reader.read('', function (result) {
        expect(result).toBe(false);
        done();
      }) instanceof Promise);
    });
  });

  describe('Private utility methods', function () {
    it('_getString', function (done) {
      var map, layer, reader, file, progress;
      map = createMap();
      layer = map.createLayer('feature');
      reader = geo.fileReader({layer: layer});
      // This could be changed to `new File`
      file = new Blob(['This is ', 'a test'], {type: 'text/plain'});
      file.lastModifiedDate = new Date();
      file.name = 'test.txt';
      reader._getString(file, function (result) {
        expect(progress.loaded).toBe(14);
        expect(progress.total).toBe(14);
        expect(result).toBe('This is a test');
        done();
      }, function (evt) {
        progress = evt;
      });
    });
  });
});
