// Test geo.quadFeature, geo.canvas.quadFeature, geo.d3.quadFeature, and
// geo.gl.quadFeature

/* globals Image */

var $ = require('jquery');
var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var destroyMap = require('../test-utils').destroyMap;
var mockVGLRenderer = geo.util.mockVGLRenderer;
var restoreVGLRenderer = geo.util.restoreVGLRenderer;
var vgl = require('vgl');
var waitForIt = require('../test-utils').waitForIt;
var closeToArray = require('../test-utils').closeToArray;
var logCanvas2D = require('../test-utils').logCanvas2D;

describe('geo.quadFeature', function () {
  'use strict';

  var previewImage = new Image();
  var preloadImage = new Image();
  preloadImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12P4zcAAAAL1APz9mbnSAAAAAElFTkSuQmCC';  // red 1x1
  var postloadImage = new Image();
  var testQuads = [{
    ll: {x: -108, y: 29},
    ur: {x: -88, y: 49},
    image: postloadImage
  }, {
    ll: {x: -88, y: 29},
    ur: {x: -58, y: 49},
    image: postloadImage,
    opacity: 0.75
  }, {
    ul: {x: -108, y: 29},
    ur: {x: -58, y: 29},
    ll: {x: -98, y: 9},
    lr: {x: -68, y: 9},
    previewImage: null,
    image: postloadImage
  }, {
    lr: {x: -58, y: 29},
    ur: {x: -58, y: 49},
    ul: {x: -38, y: 54},
    ll: {x: -33, y: 34},
    image: preloadImage,
    opacity: 0.15
  }, {
    ll: {x: -33, y: 34},
    lr: {x: -33, y: 9},
    ur: {x: -68, y: 9},
    ul: {x: -58, y: 29},
    reload: false,
    image: preloadImage
  }, {
    ll: {x: -128, y: 29},
    ur: {x: -108, y: 49},
    image: 'nosuchimage.png'
  }, {
    ul: {x: -128, y: 29},
    ur: {x: -108, y: 29},
    ll: {x: -123, y: 9},
    lr: {x: -98, y: 9},
    previewImage: null,
    image: 'nosuchimage.png'
  }, {
    ul: {x: -148, y: 29},
    ur: {x: -128, y: 29},
    ll: {x: -148, y: 9},
    lr: {x: -123, y: 9},
    previewImage: previewImage,
    image: 'nosuchimage.png'
  }, {
    ll: {x: -138, y: 29},
    ur: {x: -128, y: 39},
    color: '#FF0000'
  }, {
    ll: [-148, 39],
    ur: [-138, 49],
    color: '#FF0000'
  }, {
    ll: {x: -138, y: 39},
    ur: {x: -128, y: 49},
    color: '#00FFFF'
  }, {
    ll: {x: -148, y: 29},
    ur: {x: -138, y: 39},
    opacity: 0.25,
    color: '#0000FF'
  }, {
    ll: {x: -108, y: 49},
    lr: {x: -88, y: 49},
    ur: {x: -108, y: 59},
    ul: {x: -88, y: 59},
    image: postloadImage
  }, {
    ll: {x: -88, y: 49},
    ur: {x: -68, y: 49},
    ul: {x: -88, y: 59},
    lr: {x: -68, y: 59},
    image: postloadImage
  }, {
    image: 'noposition.png'
  }, {
    ll: {x: -118, y: 49},
    ur: {x: -108, y: 59},
    previewImage: null,
    previewColor: null,
    image: postloadImage
  }, {
    ll: {x: -128, y: 49},
    ur: {x: -118, y: 59},
    previewImage: null,
    previewColor: null,
    image: 'nosuchimage.png'
  }, {
    ll: {x: -138, y: 49},
    ur: {x: -128, y: 59},
    previewImage: null,
    previewColor: null,
    reload: false,
    image: postloadImage
  }];
  var testStyle = {
    opacity: function (d) {
      return d.opacity !== undefined ? d.opacity : 1;
    },
    color: function (d) {
      return d.color;
    },
    previewColor: function (d) {
      return d.previewColor !== undefined ? d.previewColor :
          {r: 1, g: 0.75, b: 0.75};
    },
    previewImage: function (d) {
      return d.previewImage !== undefined ? d.previewImage :
          previewImage;
    },
    drawOnAsyncResourceLoaded: function (d) {
      return d.reload !== undefined ? d.reload : true;
    }
  };

  function load_preview_image(done) {
    if (!previewImage.src) {
      previewImage.onload = function () {
        done();
      };
      previewImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12P4DwABAQEAG7buVgAAAABJRU5ErkJggg==';  // white 1x1
    } else {
      done();
    }
  }

  describe('create', function () {
    it('create function', function () {
      mockVGLRenderer();
      var map, layer, quad;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'vgl'});
      quad = geo.quadFeature.create(layer);
      expect(quad instanceof geo.quadFeature).toBe(true);
      destroyMap();
      restoreVGLRenderer();
    });
  });

  describe('Check class accessors', function () {
    var map, layer;
    it('position', function () {
      var pos = {ll: {x: 0, y: 0}, ur: {x: 1, y: 1}}, quad;

      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      quad = geo.quadFeature({layer: layer});
      quad._init();
      expect(quad.position()('a')).toBe('a');
      quad.position(pos);
      expect(quad.position()('a')).toEqual(pos);
      expect(quad.style('position')('a')).toEqual(pos);
      quad.position(function () { return 'b'; });
      expect(quad.position()('a')).toEqual('b');
    });
  });

  describe('Public utility methods', function () {
    describe('pointSearch', function () {
      it('basic usage', function () {
        var map, layer, quad, data, pt;
        map = createMap();
        layer = map.createLayer('feature', {renderer: null});
        quad = geo.quadFeature({layer: layer});
        quad._init();
        data = [{
          ll: [-40, 30], ur: [-60, 10], image: preloadImage
        }, {
          ll: [-90, 10], ur: [-100, 10], image: preloadImage
        }, {
          ll: [-80, 10], lr: [-50, 10], ur: [-70, 30], image: preloadImage
        }];
        quad.data(data);
        pt = quad.pointSearch({x: -45, y: 11});
        expect(pt.index).toEqual([0]);
        expect(pt.found.length).toBe(1);
        expect(pt.found[0].ll).toEqual(data[0].ll);
        expect(pt.extra[0].basis.x).toBeCloseTo(0.25);
        expect(pt.extra[0].basis.y).toBeCloseTo(0.047477);
        pt = quad.pointSearch({x: -55, y: 11});
        expect(pt.index).toEqual([0, 2]);
        expect(pt.found.length).toBe(2);
        expect(pt.extra[0].basis.x).toBeCloseTo(0.75);
        expect(pt.extra[0].basis.y).toBeCloseTo(0.047477);
        expect(pt.extra[2].basis.x).toBeCloseTo(0.833333);
        expect(pt.extra[2].basis.y).toBeCloseTo(0.952523);
        pt = quad.pointSearch({x: -35, y: 11});
        expect(pt.index).toEqual([]);
        expect(pt.found.length).toBe(0);
        /* not in a degenerate quad */
        pt = quad.pointSearch({x: -95, y: 10});
        expect(pt.index).toEqual([]);
        expect(pt.found.length).toBe(0);
        expect(pt.extra[1]).toBe(undefined);
      });
    });
    describe('cacheQuads and cacheUpdate', function () {
      it('cacheQuads unspecified', function () {
        var map, layer, quad, data;
        map = createMap();
        layer = map.createLayer('feature', {renderer: null});
        quad = geo.quadFeature({layer: layer});
        quad._init();
        data = [{
          ll: [-40, 30], ur: [-60, 10], image: preloadImage
        }, {
          ll: [-90, 10], ur: [-100, 10], image: preloadImage
        }, {
          ll: [-80, 10], lr: [-50, 10], ur: [-70, 30], image: preloadImage
        }];
        quad.data(data);
        quad._generateQuads();
        expect(data[0]._cachedQuad).not.toBe(undefined);
        expect(data[1]._cachedQuad).not.toBe(undefined);
        expect(data[2]._cachedQuad).not.toBe(undefined);
        quad.cacheUpdate(data[1]);
        expect(data[0]._cachedQuad).not.toBe(undefined);
        expect(data[1]._cachedQuad).toBe(undefined);
        expect(data[2]._cachedQuad).not.toBe(undefined);
        quad.cacheUpdate(2);
        expect(data[0]._cachedQuad).not.toBe(undefined);
        expect(data[1]._cachedQuad).toBe(undefined);
        expect(data[2]._cachedQuad).toBe(undefined);
        quad.cacheUpdate();
        expect(data[0]._cachedQuad).toBe(undefined);
        expect(data[1]._cachedQuad).toBe(undefined);
        expect(data[2]._cachedQuad).toBe(undefined);
      });
      it('cacheQuads false', function () {
        var map, layer, quad, data;
        map = createMap();
        layer = map.createLayer('feature', {renderer: null});
        quad = geo.quadFeature({layer: layer});
        quad._init({cacheQuads: false});
        data = [{
          ll: [-40, 30], ur: [-60, 10], image: preloadImage
        }, {
          ll: [-90, 10], ur: [-100, 10], image: preloadImage
        }, {
          ll: [-80, 10], lr: [-50, 10], ur: [-70, 30], image: preloadImage
        }];
        quad.data(data);
        quad._generateQuads();
        expect(data[0]._cachedQuad).toBe(undefined);
        expect(data[1]._cachedQuad).toBe(undefined);
        expect(data[2]._cachedQuad).toBe(undefined);
      });
    });
  });

  describe('Private utility methods', function () {
    describe('_object_list methods', function () {
      var map, layer, quad, olist = [];
      it('_objectListStart', function () {
        map = createMap();
        layer = map.createLayer('feature', {renderer: null});
        quad = geo.quadFeature({layer: layer});
        quad._objectListStart(olist);
        expect(olist).toEqual([]);
        olist.push({entry: 1, value: 'a'});
        quad._objectListStart(olist);
        expect(olist).toEqual([{entry: 1, value: 'a', used: false}]);
        olist[0].used = true;
        quad._objectListStart(olist);
        expect(olist).toEqual([{entry: 1, value: 'a', used: false}]);
      });
      it('_objectListGet', function () {
        quad._objectListStart(olist);
        expect(quad._objectListGet(olist, 1)).toEqual('a');
        expect(olist).toEqual([{entry: 1, value: 'a', used: true}]);
        expect(quad._objectListGet(olist, 2)).toBe(undefined);
      });
      it('_objectListAdd', function () {
        expect(quad._objectListGet(olist, 2)).toBe(undefined);
        quad._objectListAdd(olist, 2, 'b');
        expect(olist).toEqual([
            {entry: 1, value: 'a', used: true},
            {entry: 2, value: 'b', used: true}]);
        expect(quad._objectListGet(olist, 2)).toEqual('b');
      });
      it('_objectListEnd', function () {
        quad._objectListEnd(olist);
        expect(olist).toEqual([
            {entry: 1, value: 'a', used: true},
            {entry: 2, value: 'b', used: true}]);
        quad._objectListStart(olist);
        expect(quad._objectListGet(olist, 1)).toEqual('a');
        expect(olist).toEqual([
            {entry: 1, value: 'a', used: true},
            {entry: 2, value: 'b', used: false}]);
        quad._objectListEnd(olist);
        expect(olist).toEqual([{entry: 1, value: 'a', used: true}]);
      });
    });

    describe('_init', function () {
      var map, layer;
      it('arg gets added to style', function () {
        var pos = {ll: {x: 0, y: 0}, ur: {x: 1, y: 1}}, quad;

        map = createMap();
        layer = map.createLayer('feature', {renderer: null});
        quad = geo.quadFeature({layer: layer});
        /* init is not automatically called on the geo.quadFeature (it is on
         * geo.gl.quadFeature). */
        quad._init({
          style: {color: '#FFFFFF'},
          position: pos
        });
        expect(quad.style('color')).toBe('#FFFFFF');
        expect(quad.style('position')()).toEqual(pos);
        expect(quad.position()()).toEqual(pos);
      });
    });

    describe('_generateQuads', function () {
      /* This implicitly tests _positionToQuad, and the testQuads are designed
       * to exercise that thoroughly.  It still might be good to have an
       * explicit unit test of _positionToQuad. */
      var expectedClrQuads = [{
        idx: 2,
        pos: [-98, 9, 0, -68, 9, 0, -108, 29, 0, -58, 29, 0],
        opacity: 1,
        color: {r: 1, g: 0.75, b: 0.75}
      }, {
        idx: 6,
        pos: [-123, 9, 0, -98, 9, 0, -128, 29, 0, -108, 29, 0],
        opacity: 1,
        color: {r: 1, g: 0.75, b: 0.75}
      }, {
        idx: 8,
        pos: [-138, 29, 0, -128, 29, 0, -138, 39, 0, -128, 39, 0],
        opacity: 1,
        color: {r: 1, g: 0, b: 0}
      }, {
        idx: 9,
        pos: [-148, 39, 0, -138, 39, 0, -148, 49, 0, -138, 49, 0],
        opacity: 1,
        color: {r: 1, g: 0, b: 0}
      }, {
        idx: 10,
        pos: [-138, 39, 0, -128, 39, 0, -138, 49, 0, -128, 49, 0],
        opacity: 1,
        color: {r: 0, g: 1, b: 1}
      }, {
        idx: 11,
        pos: [-148, 29, 0, -138, 29, 0, -148, 39, 0, -138, 39, 0],
        opacity: 0.25,
        color: {r: 0, g: 0, b: 1}
      }];
      var expectedImgQuads = [{
        idx: 0,
        pos: [-108, 29, 0, -88, 29, 0, -108, 49, 0, -88, 49, 0],
        opacity: 1,
        image: previewImage,
        postimage: postloadImage
      }, {
        idx: 1,
        pos: [-88, 29, 0, -58, 29, 0, -88, 49, 0, -58, 49, 0],
        opacity: 0.75,
        image: previewImage,
        postimage: postloadImage
      }, {
        idx: 2,
        pos: [-98, 9, 0, -68, 9, 0, -108, 29, 0, -58, 29, 0],
        opacity: 1,
        postimage: postloadImage
      }, {
        idx: 3,
        pos: [-33, 34, 0, -58, 29, 0, -38, 54, 0, -58, 49, 0],
        opacity: 0.15,
        image: preloadImage
      }, {
        idx: 4,
        pos: [-33, 34, 0, -33, 9, 0, -58, 29, 0, -68, 9, 0],
        opacity: 1,
        image: preloadImage
      }, {
        idx: 5,
        pos: [-128, 29, 0, -108, 29, 0, -128, 49, 0, -108, 49, 0],
        opacity: 1,
        image: previewImage
      }, {
        idx: 6,
        pos: [-123, 9, 0, -98, 9, 0, -128, 29, 0, -108, 29, 0],
        opacity: 1
      }, {
        idx: 7,
        pos: [-148, 9, 0, -123, 9, 0, -148, 29, 0, -128, 29, 0],
        opacity: 1,
        image: previewImage
      }, {
        idx: 12,
        pos: [-108, 49, 0, -88, 49, 0, -88, 59, 0, -108, 59, 0],
        opacity: 1,
        image: previewImage,
        postimage: postloadImage
      }, {
        idx: 13,
        pos: [-88, 49, 0, -68, 59, 0, -88, 59, 0, -68, 49, 0],
        opacity: 1,
        image: previewImage,
        postimage: postloadImage
      }, {
        idx: 15,
        pos: [-118, 49, 0, -108, 49, 0, -118, 59, 0, -108, 59, 0],
        opacity: 1,
        postimage: postloadImage
      }, {
        idx: 16,
        pos: [-128, 49, 0, -118, 49, 0, -128, 59, 0, -118, 59, 0],
        opacity: 1
      }];
      var map, layer, quad, gen;

      it('load preview image', load_preview_image);
      it('overall generation', function () {
        map = createMap({gcs: 'EPSG:4326'});
        layer = map.createLayer('feature', {renderer: null});
        quad = geo.quadFeature({layer: layer});
        quad._init({style: testStyle});
        quad.data(testQuads);
        gen = quad._generateQuads();
        expect(gen.clrQuads.length).toBe(6);
        expect(gen.imgQuads.length).toBe(12);
        $.each(expectedClrQuads, function (idx, exq) {
          expect(gen.clrQuads[idx].idx).toBe(exq.idx);
          expect(closeToArray(gen.clrQuads[idx].pos, exq.pos)).toBe(true);
          expect(gen.clrQuads[idx].opacity).toEqual(exq.opacity);
          expect(gen.clrQuads[idx].color).toEqual(exq.color);
        });
        $.each(expectedImgQuads, function (idx, exq) {
          expect(gen.imgQuads[idx].idx).toBe(exq.idx);
          expect(closeToArray(gen.imgQuads[idx].pos, exq.pos)).toBe(true);
          expect(gen.imgQuads[idx].opacity).toEqual(exq.opacity);
          if (exq.image) {
            expect(gen.imgQuads[idx].image.src).toBe(exq.image.src);
          } else {
            expect(gen.imgQuads[idx].image).toBe(undefined);
          }
        });
      });
      it('load postload image', function (done) {
        var oldload = postloadImage.onload;
        postloadImage.onload = function () {
          if (oldload) {
            oldload.apply(this, arguments);
          }
          done();
        };
        postloadImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12Pg+M4AAAIKAQBkG8RkAAAAAElFTkSuQmCC';  // green 1x1
      });
      it('after loading images', function () {
        expect(gen.clrQuads.length).toBe(5);
        expect(gen.imgQuads.length).toBe(12);
        expect(gen.clrQuads[0].idx).toBe(6);
        $.each(expectedImgQuads, function (idx, exq) {
          if (exq.postimage) {
            expect(gen.imgQuads[idx].image.src).toBe(exq.postimage.src);
          } else if (exq.image) {
            expect(gen.imgQuads[idx].image.src).toBe(exq.image.src);
          } else {
            expect(gen.imgQuads[idx].image).toBe(undefined);
          }
        });
      });
      it('regenerate', function () {
        gen = quad._generateQuads();
        expect(gen.clrQuads.length).toBe(5);
        expect(gen.imgQuads.length).toBe(13);
      });
    });
  });

  /* This is a basic integration test of geo.gl.quadFeature. */
  describe('geo.gl.quadFeature', function () {
    var map, layer, quads, glCounts;
    it('load preview image', load_preview_image);
    it('basic usage', function () {
      var buildTime;

      $.each(testQuads, function (idx, quad) {
        delete quad._cachedQuad;
      });
      mockVGLRenderer();
      map = createMap();
      layer = map.createLayer('feature');
      quads = layer.createFeature('quad', {style: testStyle, data: testQuads});
      buildTime = quads.buildTime().getMTime();
      /* Trigger rerendering */
      quads.data(testQuads);
      map.draw();
      expect(buildTime).not.toEqual(quads.buildTime().getMTime());
      glCounts = $.extend({}, vgl.mockCounts());
    });
    waitForIt('next render gl A', function () {
      return vgl.mockCounts().createProgram >= (glCounts.createProgram || 0) + 2;
    });
    it('only img quad', function () {
      glCounts = $.extend({}, vgl.mockCounts());
      var buildTime = quads.buildTime().getMTime();
      quads.data([testQuads[0], testQuads[1]]);
      map.draw();
      expect(buildTime).not.toEqual(quads.buildTime().getMTime());
    });
    waitForIt('next render gl B', function () {
      return vgl.mockCounts().activeTexture >= glCounts.activeTexture + 2 &&
             vgl.mockCounts().uniform3fv >= glCounts.uniform3fv + 1 &&
             vgl.mockCounts().bufferSubData >= (glCounts.bufferSubData || 0) + 1;
    });
    it('only clr quad', function () {
      glCounts = $.extend({}, vgl.mockCounts());
      var buildTime = quads.buildTime().getMTime();
      quads.data([testQuads[8], testQuads[9]]);
      map.draw();
      expect(buildTime).not.toEqual(quads.buildTime().getMTime());
    });
    waitForIt('next render gl C', function () {
      return vgl.mockCounts().activeTexture === glCounts.activeTexture &&
             vgl.mockCounts().uniform3fv >= glCounts.uniform3fv + 2 &&
             vgl.mockCounts().bufferSubData >= glCounts.bufferSubData + 1;
    });
    it('many quads', function () {
      glCounts = $.extend({}, vgl.mockCounts());
      var data = [];
      for (var i = 0; i < 200; i += 1) {
        data.push({ll: [i - 100, 0], ur: [i - 99, 10], color: '#0000FF'});
        data.push({ll: [i - 100, 10], ur: [i - 99, 20], image: preloadImage});
      }
      quads.data(data);
      map.draw();
    });
    waitForIt('next render gl D', function () {
      return vgl.mockCounts().deleteBuffer >= (glCounts.deleteBuffer || 0) + 2 &&
             vgl.mockCounts().uniform3fv >= glCounts.uniform3fv + 2 &&
             vgl.mockCounts().bufferSubData === glCounts.bufferSubData;
    });
    it('_exit', function () {
      var buildTime = quads.buildTime().getMTime();
      layer.deleteFeature(quads);
      quads.data(testQuads);
      map.draw();
      expect(buildTime).toEqual(quads.buildTime().getMTime());
      destroyMap();
      restoreVGLRenderer();
    });
  });

  /* This is a basic integration test of geo.canvas.quadFeature. */
  describe('geo.canvas.quadFeature', function () {
    var map, layer, quads, counts, canvasElement;
    it('load preview image', load_preview_image);
    it('basic usage', function () {
      var buildTime;

      $.each(testQuads, function (idx, quad) {
        delete quad._cachedQuad;
      });
      logCanvas2D();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      quads = layer.createFeature('quad', {style: testStyle, data: testQuads});
      buildTime = quads.buildTime().getMTime();
      /* Trigger rerendering */
      quads.data(testQuads);
      counts = $.extend({}, window._canvasLog.counts);
      map.draw();
      expect(buildTime).not.toEqual(quads.buildTime().getMTime());
    });
    waitForIt('next render canvas A', function () {
      return window._canvasLog.counts.clearRect >= (counts.clearRect || 0) + 1;
    });
    it('only img quad', function () {
      counts = $.extend({}, window._canvasLog.counts);
      var buildTime = quads.buildTime().getMTime();
      quads.data([testQuads[0], testQuads[1]]);
      map.draw();
      expect(buildTime).not.toEqual(quads.buildTime().getMTime());
    });
    waitForIt('next render canvas B', function () {
      return window._canvasLog.counts.drawImage >= counts.drawImage + 2 &&
             window._canvasLog.counts.clearRect >= counts.clearRect + 1;
    });
    /* Add a test for color quads here when they are implemented */
    it('many quads', function () {
      counts = $.extend({}, window._canvasLog.counts);
      var data = [];
      for (var i = 0; i < 200; i += 1) {
        /* Add color quads when implemented */
        data.push({ll: [i - 100, 10], ur: [i - 99, 20], image: preloadImage});
      }
      quads.data(data);
      map.draw();
    });
    waitForIt('next render canvas C', function () {
      return window._canvasLog.counts.drawImage >= counts.drawImage + 200 &&
             window._canvasLog.counts.clearRect >= counts.clearRect + 1;
    });
    it('canvas quads', function () {
      canvasElement = document.createElement('canvas');
      canvasElement.width = 640;
      canvasElement.height = 480;
      var context = canvasElement.getContext('2d');
      context.fillStyle = 'green';
      context.fillRect(0, 0, 640, 480);
      var data = [{
        ul: {x: -98, y: 29},
        ur: {x: -68, y: 29},
        ll: {x: -98, y: 9},
        lr: {x: -68, y: 9},
        previewImage: null,
        image: canvasElement
      }];
      counts = $.extend({}, window._canvasLog.counts);
      logCanvas2D(true);  // enable call logging
      quads.data(data);
      map.draw();
    });
    waitForIt('next render canvas D', function () {
      return window._canvasLog.counts.drawImage >= counts.drawImage + 1 &&
             window._canvasLog.counts.clearRect >= counts.clearRect + 1;
    });
    it('confirm canvas quads', function () {
      var log = window._canvasLog.log, i = log.length - 1;
      while (i > 0 && log[i].func !== 'drawImage') {
        i -= 1;
      }
      expect(log[i].arg[0]).toBe(canvasElement);
      logCanvas2D(false);  // disable call logging
    });
    it('_exit', function () {
      var buildTime = quads.buildTime().getMTime();
      layer.deleteFeature(quads);
      quads.data(testQuads);
      map.draw();
      expect(buildTime).toEqual(quads.buildTime().getMTime());
    });
  });

  /* This is a basic integration test of geo.d3.quadFeature. */
  describe('geo.d3.quadFeature', function () {
    var map, layer, quads;
    it('load preview image', load_preview_image);
    it('basic usage', function () {
      var buildTime;

      $.each(testQuads, function (idx, quad) {
        delete quad._cachedQuad;
      });
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      quads = layer.createFeature('quad', {style: testStyle, data: testQuads});
      buildTime = quads.buildTime().getMTime();
      /* Trigger rerendering */
      quads.data(testQuads);
      map.draw();
      expect(buildTime).not.toEqual(quads.buildTime().getMTime());
      /* Force the quads to render synchronously. */
      layer.renderer()._renderFrame();
      expect($('svg image').length).toBe(11);
      expect($('svg polygon').length).toBe(5);
    });
    it('only img quad', function () {
      var buildTime = quads.buildTime().getMTime();
      quads.data([testQuads[0], testQuads[1]]);
      map.draw();
      expect(buildTime).not.toEqual(quads.buildTime().getMTime());
      /* Force the quads to render synchronously. */
      layer.renderer()._renderFrame();
      expect($('svg image').length).toBe(2);
      expect($('svg polygon').length).toBe(0);
    });
    it('only clr quad', function () {
      var buildTime = quads.buildTime().getMTime();
      quads.data([testQuads[8], testQuads[9]]);
      map.draw();
      expect(buildTime).not.toEqual(quads.buildTime().getMTime());
      /* Force the quads to render synchronously. */
      layer.renderer()._renderFrame();
      expect($('svg image').length).toBe(0);
      expect($('svg polygon').length).toBe(2);
    });
    it('many quads', function () {
      var data = [];
      for (var i = 0; i < 200; i += 1) {
        data.push({ll: [i - 100, 0], ur: [i - 99, 10], color: '#0000FF', reference: 'clr' + i});
        data.push({ll: [i - 100, 10], ur: [i - 99, 20], image: preloadImage, reference: 'img' + i});
      }
      quads.data(data);
      map.draw();
      /* Force the quads to render synchronously. */
      layer.renderer()._renderFrame();
      expect($('svg image').length).toBe(200);
      expect($('svg polygon').length).toBe(200);
    });
    it('_exit', function () {
      var buildTime = quads.buildTime().getMTime();
      layer.deleteFeature(quads);
      quads.data(testQuads);
      map.draw();
      expect(buildTime).toEqual(quads.buildTime().getMTime());
    });
  });
});
