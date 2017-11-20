// Test geo.pixelmapFeature and geo.canvas.pixelmapFeature

/* globals Image */

var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var $ = require('jquery');
var waitForIt = require('../test-utils').waitForIt;
var logCanvas2D = require('../test-utils').logCanvas2D;

describe('geo.pixelmapFeature', function () {
  'use strict';

  var position = {ul: {x: -140, y: 70}, lr: {x: -60, y: 10}};

  var testImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAG' +
                     'CAIAAABxZ0isAAAAKklEQVQI13XLoREAMAwDMTkg+2/ckrKkRMC+Tw' +
                     'iGWdfnXvgU1eAMC+t3AZSjBh9ho6CUAAAAAElFTkSuQmCC';
  var testImage = new Image();

  function load_test_image(done) {
    if (!testImage.src) {
      testImage.onload = function () {
        done();
      };
      testImage.src = testImageSrc;
    } else {
      done();
    }
  }

  describe('create', function () {
    var map, layer, pixelmap;
    it('create function', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      pixelmap = geo.pixelmapFeature.create(layer);
      expect(pixelmap instanceof geo.pixelmapFeature).toBe(true);
    });
    it('direct create', function () {
      var pixelmap = geo.pixelmapFeature({layer: layer});
      expect(pixelmap instanceof geo.pixelmapFeature).toBe(true);
    });
  });

  describe('Private utility methods', function () {
    it('load test image', load_test_image);
    describe('_init', function () {
      var map, layer, pixelmap;
      it('defaults', function () {
        map = createMap();
        layer = map.createLayer('feature', {renderer: null});
        pixelmap = geo.pixelmapFeature({layer: layer});
        pixelmap._init();
        expect(pixelmap.color()(0, 0)).toEqual({r: 0, g: 0, b: 0, a: 1});
      });
      it('arg gets added to style', function () {
        pixelmap = geo.pixelmapFeature({layer: layer});
        /* init is not automatically called on the geo.pixelmapFeature (it is
         * on geo.canvas.pixelmapFeature). */
        pixelmap._init({
          color: 'red',
          position: position,
          url: testImageSrc,
          style: {position: {ul: {x: 1}}}
        });
        expect(pixelmap.style('position').ul.x).toBe(-140);
        expect(pixelmap.style('url').slice(0, 4)).toBe('data');
        expect(pixelmap.style('color')).toBe('red');
      });
    });
    it('_exit', function () {
      var map, layer, pixelmap;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      pixelmap = geo.pixelmapFeature({layer: layer});
      pixelmap._init({
        position: position,
        url: testImage
      });
      pixelmap._build();
      expect(pixelmap.dependentFeatures().length).toBe(1);
      pixelmap._exit();
      expect(pixelmap.dependentFeatures().length).toBe(0);
    });
    it('_preparePixelmap', function () {
      var map, layer, pixelmap;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      pixelmap = geo.pixelmapFeature({layer: layer});
      pixelmap._init({
        position: position,
        url: testImage
      });
      expect(pixelmap.maxIndex()).toBe(undefined);
      expect(pixelmap._preparePixelmap()).toBe(undefined);
      /* We have to call _build to be able to set the source image and
       * successfully call _preparePixelmap. */
      pixelmap._build();
      var info = pixelmap._preparePixelmap();
      expect(pixelmap.maxIndex()).toBe(6);
      expect(info.width).toBe(8);
      expect(info.height).toBe(6);
      expect(info.area).toBe(info.width * info.height);
      expect(info.indices.length).toBe(info.area);
      expect(info.mappedColors[0]).toEqual({first: 16, last: 43});
      expect(info.mappedColors[6]).toEqual({first: 32, last: 41});
    });
    it('_computePixelmap', function () {
      var map, layer, pixelmap, prepared = 0;

      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      pixelmap = geo.pixelmapFeature({layer: layer});
      pixelmap._init({
        position: position,
        url: testImage
      });
      expect(pixelmap.maxIndex()).toBe(undefined);
      expect(pixelmap.dependentFeatures().length).toBe(0);

      pixelmap.geoOn(geo.event.pixelmap.prepared, function () {
        prepared += 1;
      });

      /* We shouldn't be able to compute it without building */
      pixelmap._computePixelmap();
      expect(prepared).toBe(0);
      /* We have to call _build to be able to set the source image and
       * successfully call _computePixelmap. */
      pixelmap._build();
      expect(pixelmap.maxIndex()).toBe(6);
      expect(pixelmap.dependentFeatures().length).toBe(1);
      expect(prepared).toBe(1);
      // we shouldn't get another prepared event when we call it again*/
      pixelmap._computePixelmap();
      expect(prepared).toBe(1);
    });
    describe('_build', function () {
      var map, layer, pixelmap, buildTime;

      it('loading image', function (done) {
        map = createMap();
        layer = map.createLayer('feature', {renderer: 'canvas'});
        pixelmap = layer.createFeature('pixelmap', {
          position: position,
          url: testImageSrc
        });
        buildTime = pixelmap.buildTime().getMTime();
        pixelmap._build().then(function () {
          expect(pixelmap.buildTime().getMTime()).toBeGreaterThan(buildTime);
          expect(pixelmap.maxIndex()).toBe(6);
          done();
        });
      });
      it('built', function () {
        buildTime = pixelmap.buildTime().getMTime();
        expect(pixelmap._build()).toBe(pixelmap);
        expect(pixelmap.buildTime().getMTime()).toBeGreaterThan(buildTime);
      });
      it('unloaded image', function (done) {
        var img = new Image(), loaded;
        img.onload = function () {
          loaded = true;
        };
        pixelmap.url(img);
        pixelmap._build().then(function () {
          expect(loaded).toBe(true);
          done();
        });
        img.src = testImageSrc;
      });
      it('bad unloaded image', function (done) {
        var img = new Image(), errored;
        img.onerror = function () {
          errored = true;
        };
        pixelmap.url(img);
        pixelmap._build().fail(function () {
          expect(errored).toBe(true);
          done();
        });
        img.src = 'data:image/png;base64,notanimage';
      });
      it('bad url', function (done) {
        pixelmap.url('noprotocol://127.0.0.1/notanimage');
        pixelmap._build().fail(function () {
          done();
        });
      });
    });
    describe('_update', function () {
      var map, layer, pixelmap, buildTime, updateTime;

      it('loading image', function (done) {
        map = createMap();
        layer = map.createLayer('feature', {renderer: 'canvas'});
        pixelmap = layer.createFeature('pixelmap', {
          position: position,
          url: testImageSrc
        });
        buildTime = pixelmap.buildTime().getMTime();
        updateTime = pixelmap.updateTime().getMTime();
        pixelmap._update().then(function () {
          expect(pixelmap.buildTime().getMTime()).toBeGreaterThan(buildTime);
          expect(pixelmap.updateTime().getMTime()).toBeGreaterThan(updateTime);
          expect(pixelmap.maxIndex()).toBe(6);
          done();
        });
      });
      it('updated', function (done) {
        buildTime = pixelmap.buildTime().getMTime();
        updateTime = pixelmap.updateTime().getMTime();
        pixelmap._update().then(function () {
          expect(pixelmap.buildTime().getMTime()).toBe(buildTime);
          expect(pixelmap.updateTime().getMTime()).toBeGreaterThan(updateTime);
          done();
        });
      });
    });
  });

  describe('Check class accessors', function () {
    var map, layer, pixelmap;

    it('position', function () {
      var pos = {lr: {x: 0, y: 0}, ul: {x: 10, y: 5}};
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      pixelmap = layer.createFeature('pixelmap', {
        url: testImageSrc
      });
      expect(pixelmap.position()('a')).toBe('a');
      pixelmap.position(pos);
      expect(pixelmap.position()).toEqual(pos);
      pixelmap.position(function () { return 'b'; });
      expect(pixelmap.position()('a')).toEqual('b');
      pixelmap.position(position);
      expect(pixelmap.position()).toEqual(position);
    });
    it('url', function () {
      expect(pixelmap.url()).toEqual(testImageSrc);
      expect(pixelmap.url(testImage)).toBe(pixelmap);
      expect(pixelmap.url()).toEqual(testImage);
    });
    it('maxIndex', function () {
      expect(pixelmap.maxIndex()).toBe(undefined);
      pixelmap._update();
      expect(pixelmap.maxIndex()).toBe(6);
    });
    it('color', function () {
      var colorFunc = function (d, i) {
        return i & 1 ? 'red' : 'blue';
      };
      expect(pixelmap.color()(0, 2)).toEqual({r: 2 / 255, g: 0, b: 0, a: 1});
      expect(pixelmap.color(colorFunc)).toBe(pixelmap);
      expect(pixelmap.color()(0, 2)).toEqual('blue');
      expect(pixelmap.color()(0, 3)).toEqual('red');
    });
  });

  describe('Public utility methods', function () {
    describe('pointSearch', function () {
      it('basic usage', function () {
        var map, layer, pixelmap, pt;

        map = createMap();
        layer = map.createLayer('feature', {renderer: 'canvas'});
        pixelmap = layer.createFeature('pixelmap', {
          position: position,
          url: testImage
        });
        pixelmap.data(['a', 'b', 'c', 'd', 'e', 'f']);
        // var position = {ul: {x: -140, y: 70}, lr: {x: -60, y: 10}};
        pt = pixelmap.pointSearch({x: -135, y: 65});
        expect(pt).toEqual({index: [], found: []});
        pixelmap._update();
        pt = pixelmap.pointSearch({x: -135, y: 65});
        expect(pt).toEqual({index: [1], found: ['b']});
        pt = pixelmap.pointSearch({x: -145, y: 65});
        expect(pt).toEqual({index: [], found: []});
        pt = pixelmap.pointSearch({x: -65, y: 15});
        expect(pt).toEqual({index: [2], found: ['c']});
      });
    });
  });

  /* This is a basic integration test of geo.canvas.pixelmapFeature. */
  describe('geo.canvas.pixelmapFeature', function () {
    var map, layer, pixelmap, buildTime, counts;
    it('basic usage', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      pixelmap = layer.createFeature('pixelmap', {
        position: position,
        url: testImage
      });
      /* Trigger rerendering */
      pixelmap.data(['a', 'b', 'c', 'd', 'e', 'f']);
      buildTime = pixelmap.buildTime().getMTime();
      logCanvas2D();
      counts = $.extend({}, window._canvasLog.counts);
      map.draw();
      expect(buildTime).not.toEqual(pixelmap.buildTime().getMTime());
    });
    waitForIt('next render canvas A', function () {
      return window._canvasLog.counts.clearRect >= (counts.clearRect || 0) + 1 &&
             window._canvasLog.counts.getImageData >= (counts.getImageData || 0) + 1 &&
             window._canvasLog.counts.drawImage >= (counts.drawImage || 0) + 1;
    });
    it('Minimal update', function () {
      pixelmap.modified();
      counts = $.extend({}, window._canvasLog.counts);
      pixelmap.draw();
    });
    waitForIt('next render canvas B', function () {
      return window._canvasLog.counts.clearRect >= (counts.clearRect || 0) + 1 &&
             window._canvasLog.counts.getImageData === counts.getImageData &&
             window._canvasLog.counts.drawImage >= (counts.drawImage || 0) + 1;
    });
    it('Heavier update', function () {
      var colorFunc = function (d, i) {
        return i & 1 ? 'red' : 'blue';
      };
      pixelmap.color(colorFunc);
      counts = $.extend({}, window._canvasLog.counts);
      pixelmap.draw();
    });
    waitForIt('next render canvas C', function () {
      return window._canvasLog.counts.clearRect >= (counts.clearRect || 0) + 1 &&
             window._canvasLog.counts.getImageData === counts.getImageData &&
             window._canvasLog.counts.drawImage >= (counts.drawImage || 0) + 1;
    });
  });
});
