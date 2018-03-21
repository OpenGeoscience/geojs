// Test geo.textFeature and geo.canvas.textFeature

var $ = require('jquery');
var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;
var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var logCanvas2D = require('../test-utils').logCanvas2D;

describe('geo.textFeature', function () {
  'use strict';

  var testText = [
    {
      text: 'First - Basic',
      x: 20,
      y: 10
    }, {
      text: 'Second - invisible',
      x: 20,
      y: 11,
      visible: false
    }, {
      text: 'Third - font',
      x: 20,
      y: 12,
      font: '40px serif'
    }, {
      text: 'Fourth - font by sub-properties',
      x: 20,
      y: 13,
      fontSize: '40px',
      fontFamily: 'serif',
      fontStyle: 'italic',
      fontVariant: 'small-caps',
      fontWeight: 'bold',
      fontStretch: 'condensed',
      lineHeight: '60px'
    }, {
      text: 'Fifth - clear',
      x: 20,
      y: 14,
      color: 'rgba(120, 120, 120, 0)'
    }, {
      text: 'Sixth - color and opacity',
      x: 20,
      y: 15,
      color: 'pink',
      textOpacity: 0.8
    }, {
      text: 'Seventh - rotation',
      x: 20,
      y: 16,
      rotation: 6 * Math.PI / 180,
      rotateWithMap: true
    }, {
      text: 'Eighth - scale',
      x: 20,
      y: 17,
      textScaled: 8
    }, {
      text: 'Ninth - offset',
      x: 20,
      y: 18,
      offset: {x: 10, y: 14}
    }, {
      text: 'Tenth - shadow',
      x: 20,
      y: 19,
      shadowColor: '#00F8',
      shadowOffset: {x: 2, y: -3},
      shadowBlur: 3,
      shadowRotate: true,
      rotation: Math.PI / 2
    }, {
      text: 'Eleventh - stroke',
      x: 20,
      y: 20,
      color: 'transparent',
      textStrokeColor: 'black',
      textStrokeWidth: 1
    }, {
      text: 'Twelfth - invalid main font property',
      x: 20,
      y: 21,
      font: 'not a css font string',
      lineHeight: '60px'
    }, {
      text: 'Thirteenth - \u0646\u0635 \u0628\u0633\u064a\u0637 - mixed direction and unicode - \ud83d\ude03',
      x: 20,
      y: 22
    }, {
      text: 'Fourteenth - stroke and fill',
      x: 20,
      y: 23,
      color: 'yellow',
      textStrokeColor: 'black',
      textStrokeWidth: 4
    }
  ];

  describe('create', function () {
    it('create function', function () {
      var map, layer, text;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      text = geo.textFeature.create(layer);
      expect(text instanceof geo.textFeature).toBe(true);
    });
  });

  describe('Check private class methods', function () {
    var map, layer, text;
    it('_init', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      text = geo.textFeature({layer: layer});
      expect(text.style('font')).toBe('bold 16px sans-serif');
      text._init({style: {font: 'serif'}});
      expect(text.style('font')).toBe('serif');
      text._init({position: 'a', text: 'b'});
      expect(text.position()).toBe('a');
      expect(text.text()).toBe('b');
      text._init({style: {position: 'c', text: 'd'}});
      expect(text.position()).toBe('c');
      expect(text.text()).toBe('d');
    });
  });

  describe('Check class accessors', function () {
    var map, layer, text;
    var pos = [[[0, 0], [10, 5], [5, 10]]];
    it('position', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      text = geo.textFeature({layer: layer});
      expect(text.position()('a')).toBe('a');
      text.position(pos);
      expect(text.position()).toEqual(pos);
      text.position(function () { return 'b'; });
      expect(text.position()('a')).toEqual('b');

      text = geo.textFeature({layer: layer, position: pos});
      expect(text.position()).toEqual(pos);
    });

    it('text', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      text = geo.textFeature({layer: layer});
      expect(text.text()({text: 'a'})).toBe('a');
      text.text(pos);
      expect(text.text()).toEqual(pos);
      text.text(function () { return 'b'; });
      expect(text.text()('a')).toEqual('b');

      text = geo.textFeature({layer: layer, text: pos});
      expect(text.text()).toEqual(pos);
    });
  });

  /* This is a basic integration test of geo.canvas.textFeature. */
  describe('geo.canvas.textFeature', function () {
    var map, layer, text, counts, style = {};
    it('basic usage', function () {
      mockAnimationFrame();
      logCanvas2D();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      geo.textFeature.usedStyles.forEach(function (key) {
        style[key] = function (d, i) {
          return d[key];
        };
      });
      text = layer.createFeature('text', {style: style}).data(testText);
      text.draw();
      stepAnimationFrame();
      counts = $.extend({}, window._canvasLog.counts);
      expect(counts.fillText).not.toBeLessThan(12);
      expect(counts.strokeText).not.toBeLessThan(2);
      map.rotation(5 * Math.PI / 180);
      stepAnimationFrame();
      counts = $.extend({}, window._canvasLog.counts);
      expect(counts.fillText).not.toBeLessThan(24);
      expect(counts.strokeText).not.toBeLessThan(4);
      unmockAnimationFrame();
    });
    it('getFontFromStyles', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      geo.textFeature.usedStyles.forEach(function (key) {
        style[key] = function (d, i) {
          return d[key];
        };
      });
      text = layer.createFeature('text', {style: style}).data(testText);
      expect(text.getFontFromStyles(true, text.data()[3], 3)).toBe('italic small-caps bold condensed 40px/60px serif');
      expect(text.getFontFromStyles(true, text.data()[11], 11)).toBe('bold 16px/60px sans-serif');
    });
  });
});
