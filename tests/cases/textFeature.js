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
    it('pointSearch', function () {
      var pt;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      text = layer.createFeature('text');
      expect(text.pointSearch({x: 20, y: 10}).index).toEqual([]);
      text.style({
        font: '20px sans-serif',
        textAlign: function (d) { return d.textAlign; },
        textBaseline: function (d) { return d.textBaseline; },
        rotation: function (d) { return d.rotation; },
        rotateWithMap: function (d) { return d.rotateWithMap; },
        textScaled: function (d) { return d.textScaled; },
        offset: function (d) { return d.offset; },
        visible: function (d) { return d.visible; },
        textOpacity: function (d) { return d.textOpacity; }
      }).data([
        {text: 'Centered text', x: 20, y: 10},
        {text: 'Left top text', x: -20, y: 10, textAlign: 'left', textBaseline: 'top'},
        {text: 'Right bottom', x: -20, y: -10, textAlign: 'right', textBaseline: 'bottom'},
        {text: 'Rotated long text', x: 20, y: -10, rotation: Math.PI / 2},
        {text: 'Offset text', x: 0, y: 30, offset: {x: 0, y: 100}},
        {text: 'Invisible', x: 0, y: -30, visible: false},
        {text: 'Transparent', x: 0, y: -30, textOpacity: 0},
        {text: '', x: 0, y: -30},
        {text: 'Scaled text', x: 40, y: -30, textScaled: map.zoom() - 2},
        {text: 'Rotates with the map', x: -40, y: -30, rotateWithMap: true}
      ]);
      /* centered */
      pt = map.gcsToDisplay({x: 20, y: 10});
      expect(text.pointSearch({x: 20, y: 10}).index).toEqual([0]);
      expect(text.pointSearch({x: 20, y: 10}).found[0].text).toBe('Centered text');
      expect(text.pointSearch(map.displayToGcs({x: pt.x - 40, y: pt.y + 5})).index).toEqual([0]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 40, y: pt.y - 5})).index).toEqual([0]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y + 30})).index).toEqual([]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 200, y: pt.y})).index).toEqual([]);
      /* a different gcs */
      expect(text.pointSearch(map.displayToGcs(pt, null), null).index).toEqual([0]);
      /* left, top */
      pt = map.gcsToDisplay({x: -20, y: 10});
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 40, y: pt.y + 8})).index).toEqual([1]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x - 5, y: pt.y + 8})).index).toEqual([]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 40, y: pt.y - 5})).index).toEqual([]);
      /* right, bottom */
      pt = map.gcsToDisplay({x: -20, y: -10});
      expect(text.pointSearch(map.displayToGcs({x: pt.x - 40, y: pt.y - 8})).index).toEqual([2]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 5, y: pt.y - 8})).index).toEqual([]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x - 40, y: pt.y + 5})).index).toEqual([]);
      /* rotated */
      pt = map.gcsToDisplay({x: 20, y: -10});
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y + 50})).index).toEqual([3]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y - 50})).index).toEqual([3]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 50, y: pt.y})).index).toEqual([]);
      /* offset */
      pt = map.gcsToDisplay({x: 0, y: 30});
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y})).index).toEqual([]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y + 100})).index).toEqual([4]);
      /* not rendered */
      expect(text.pointSearch({x: 0, y: -30}).index).toEqual([]);
      /* scaled */
      pt = map.gcsToDisplay({x: 40, y: -30});
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y + 30})).index).toEqual([8]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y + 60})).index).toEqual([]);
      /* rotate with map */
      pt = map.gcsToDisplay({x: -40, y: -30});
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 60, y: pt.y})).index).toEqual([9]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y + 60})).index).toEqual([]);
      map.rotation(Math.PI / 2);
      pt = map.gcsToDisplay({x: -40, y: -30});
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 60, y: pt.y})).index).toEqual([]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y + 60})).index).toEqual([9]);
      /* text that doesn't rotate with the map is still upright */
      pt = map.gcsToDisplay({x: 20, y: 10});
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 40, y: pt.y})).index).toEqual([0]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x, y: pt.y + 40})).index).toEqual([]);
    });
    it('multiline text', function () {
      var count, pt, size = 20, lineHeight = 30,
          font = size + 'px/' + lineHeight + 'px sans-serif';
      mockAnimationFrame();
      logCanvas2D();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      text = layer.createFeature('text').style({
        font: font,
        textBaseline: function (d) { return d.textBaseline; },
        textAlign: function (d) { return d.textAlign; },
        textStrokeColor: function (d) { return d.textStrokeColor; },
        textStrokeWidth: 2
      }).data([
        {text: 'long first line\nshort', x: -10, y: 10, textAlign: 'right'},
        {text: 'short\nlong second line', x: -10, y: 10, textAlign: 'left'},
        {text: 'top\n\nthird', x: 20, y: -10, textBaseline: 'top'},
        {text: 'first\nsecond\nbottom', x: -20, y: -10, textBaseline: 'bottom', textStrokeColor: 'black'},
        {text: 'one line', x: 0, y: -20},
        {text: '\n\n', x: 0, y: 0},
        {text: 5, x: 30, y: 20}
      ]);
      text.draw();
      stepAnimationFrame();
      count = $.extend({}, window._canvasLog.counts);
      text.draw();
      stepAnimationFrame();
      /* two lines each for the first two, two non-empty lines for the third,
       * three for the fourth, one each for the fifth and seventh; the sixth
       * has only empty lines */
      expect(window._canvasLog.counts.fillText - count.fillText).toBe(11);
      expect(window._canvasLog.counts.strokeText - count.strokeText).toBe(3);
      unmockAnimationFrame();
      /* The first two entries share a position and have lines that are next
       * to each other.  The long line of each one extends past the short line
       * of the other, but a search only finds the text whose line contains
       * the point. */
      pt = map.gcsToDisplay({x: -10, y: 10});
      function search(dx, dy) {
        return text.pointSearch(map.displayToGcs({x: pt.x + dx, y: pt.y + dy})).index;
      }
      expect(search(-10, -lineHeight / 2)).toEqual([0]);
      expect(search(-100, -lineHeight / 2)).toEqual([0]);
      expect(search(-10, lineHeight / 2)).toEqual([0]);
      expect(search(-100, lineHeight / 2)).toEqual([]);
      expect(search(10, -lineHeight / 2)).toEqual([1]);
      expect(search(100, -lineHeight / 2)).toEqual([]);
      expect(search(10, lineHeight / 2)).toEqual([1]);
      expect(search(100, lineHeight / 2)).toEqual([1]);
      /* there are no gaps between lines */
      expect(search(-10, -1)).toEqual([0]);
      expect(search(-10, 1)).toEqual([0]);
      /* but the text does not extend above or below its lines */
      expect(search(-10, -lineHeight * 1.5)).toEqual([]);
      expect(search(-10, lineHeight * 1.5)).toEqual([]);
      /* top places the first line at the position and empty lines are not
       * part of the text */
      pt = map.gcsToDisplay({x: 20, y: -10});
      expect(search(0, -5)).toEqual([]);
      expect(search(0, 10)).toEqual([2]);
      expect(search(0, lineHeight + 15)).toEqual([]);
      expect(search(0, lineHeight * 2 + 10)).toEqual([2]);
      expect(search(0, lineHeight * 3 + 10)).toEqual([]);
      /* bottom places the last line at the position */
      pt = map.gcsToDisplay({x: -20, y: -10});
      expect(search(0, 5)).toEqual([]);
      expect(search(0, -10)).toEqual([3]);
      expect(search(0, -lineHeight * 2 - 10)).toEqual([3]);
      expect(search(0, -lineHeight * 3 - 10)).toEqual([]);
      /* text of only empty lines can't be found */
      expect(text.pointSearch({x: 0, y: 0}).index).toEqual([]);
      /* non-string text works */
      expect(text.pointSearch({x: 30, y: 20}).index).toEqual([6]);
      /* polygon searches use each line */
      pt = map.gcsToDisplay({x: -10, y: 10});
      function box(x0, y0, x1, y1) {
        return [
          map.displayToGcs({x: pt.x + x0, y: pt.y + y0}),
          map.displayToGcs({x: pt.x + x1, y: pt.y + y0}),
          map.displayToGcs({x: pt.x + x1, y: pt.y + y1}),
          map.displayToGcs({x: pt.x + x0, y: pt.y + y1})
        ];
      }
      expect(text.polygonSearch(box(-200, -40, 1, 40)).index).toEqual([0]);
      expect(text.polygonSearch(box(-200, -40, 200, 40)).index).toEqual([0, 1]);
      /* only the short line of the second text is in the upper right */
      expect(text.polygonSearch(box(1, -29, 200, -1)).index).toEqual([]);
      expect(text.polygonSearch(box(1, -29, 200, -1), {partial: true}).index).toEqual([1]);
      /* this is in the bounding box of the first text but next to its short
       * second line */
      expect(text.polygonSearch(box(-140, 5, -100, 25), {partial: true}).index).toEqual([]);
      expect(text.polygonSearch(box(-140, -25, -100, -5), {partial: true}).index).toEqual([0]);
      /* center uses the bounds of all of the lines */
      expect(text.polygonSearch(box(-200, -40, -30, 40), {partial: 'center'}).index).toEqual([0]);
      expect(text.polygonSearch(box(-200, -40, -100, 40), {partial: 'center'}).index).toEqual([]);
      /* the line height can come from the font, a percentage, or the font
       * size */
      pt = map.gcsToDisplay({x: 20, y: -10});
      text.style('font', size + 'px/200% sans-serif');
      expect(search(0, size * 4 + 10)).toEqual([2]);
      expect(search(0, size * 2 + 10)).toEqual([]);
      text.style('font', size + 'px sans-serif');
      expect(search(0, size * 4 + 10)).toEqual([]);
      expect(search(0, 10)).toEqual([2]);
      text.style('font', '2em sans-serif');
      expect(search(0, 10)).toEqual([2]);
    });
    it('search without font metrics', function () {
      var measureText = CanvasRenderingContext2D.prototype.measureText,
          pt;
      /* Some browsers only report the width of text.  Use fonts that aren't
       * used in other tests, since measurements are cached. */
      CanvasRenderingContext2D.prototype.measureText = function (text) {
        return {width: measureText.call(this, text).width};
      };
      try {
        map = createMap();
        layer = map.createLayer('feature', {renderer: 'canvas'});
        text = layer.createFeature('text').style({
          font: function (d) { return d.font || '21px sans-serif'; },
          textBaseline: function (d) { return d.textBaseline; }
        }).data([
          {text: 'Middle', x: -30, y: 10},
          {text: 'Top', x: -10, y: 10, textBaseline: 'top'},
          {text: 'Bottom', x: 10, y: 10, textBaseline: 'bottom'},
          {text: 'Alphabetic', x: 30, y: 10, textBaseline: 'alphabetic'},
          {text: 'Size not in pixels', x: -30, y: -10, font: '1.5em sans-serif'},
          {text: 'Two\nlines', x: 30, y: -10}
        ]);
        function search(datum, dx, dy) {
          pt = map.gcsToDisplay(text.data()[datum]);
          return text.pointSearch(map.displayToGcs({x: pt.x + dx, y: pt.y + dy})).index;
        }
        expect(search(0, 0, 8)).toEqual([0]);
        expect(search(0, 0, -8)).toEqual([0]);
        expect(search(0, 0, 16)).toEqual([]);
        expect(search(1, 0, 16)).toEqual([1]);
        expect(search(1, 0, -4)).toEqual([]);
        expect(search(2, 0, -16)).toEqual([2]);
        expect(search(2, 0, 4)).toEqual([]);
        expect(search(3, 0, -14)).toEqual([3]);
        expect(search(3, 0, 3)).toEqual([3]);
        expect(search(3, 0, 10)).toEqual([]);
        expect(search(4, 0, 6)).toEqual([4]);
        expect(search(4, 0, 14)).toEqual([]);
        expect(search(5, 0, 20)).toEqual([5]);
        expect(search(5, 0, -20)).toEqual([5]);
        expect(search(5, 0, 32)).toEqual([]);
      } finally {
        CanvasRenderingContext2D.prototype.measureText = measureText;
      }
    });
    it('long text', function () {
      var words = [], lines = [], i, pt, start, result;
      for (i = 0; i < 3000; i += 1) {
        words.push('word' + i);
      }
      /* 3000 words in 200 lines */
      for (i = 0; i < words.length; i += 15) {
        lines.push(words.slice(i, i + 15).join(' '));
      }
      mockAnimationFrame();
      logCanvas2D();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      text = layer.createFeature('text').style({
        font: '10px/12px sans-serif',
        textAlign: 'left',
        textBaseline: 'top'
      }).data([
        {text: lines.join('\n'), x: 0, y: 0},
        /* all of the words on one line */
        {text: words.join(' '), x: 0, y: 10},
        {text: 'short', x: -10, y: 0, textAlign: 'right'}
      ]);
      text.draw();
      stepAnimationFrame();
      result = $.extend({}, window._canvasLog.counts);
      text.draw();
      stepAnimationFrame();
      expect(window._canvasLog.counts.fillText - result.fillText).toBe(202);
      unmockAnimationFrame();
      pt = map.gcsToDisplay({x: 0, y: 0});
      /* the last line is far below the bottom of the map */
      result = text.pointSearch(map.displayToGcs({x: pt.x + 20, y: pt.y + 12 * 199 + 6}));
      expect(result.index).toEqual([0]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 20, y: pt.y + 12 * 200 + 6})).index).toEqual([]);
      /* the single line is far wider than the map */
      pt = map.gcsToDisplay({x: 0, y: 10});
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 50000, y: pt.y + 6})).index).toEqual([1]);
      expect(text.pointSearch(map.displayToGcs({x: pt.x + 500000, y: pt.y + 6})).index).toEqual([]);
      /* repeated searches use cached measurements and are fast */
      pt = map.gcsToDisplay({x: 0, y: 0});
      start = Date.now();
      for (i = 0; i < 1000; i += 1) {
        result = text.pointSearch(map.displayToGcs({x: pt.x + 20, y: pt.y + (i % 200) * 12 + 6}));
        expect(result.index).toEqual([0]);
      }
      expect(Date.now() - start).toBeLessThan(2000);
      result = text.polygonSearch([
        map.displayToGcs({x: pt.x - 100, y: pt.y - 10}),
        map.displayToGcs({x: pt.x + 2000, y: pt.y - 10}),
        map.displayToGcs({x: pt.x + 2000, y: pt.y + 300}),
        map.displayToGcs({x: pt.x - 100, y: pt.y + 300})
      ], {partial: true});
      expect(result.index).toEqual([0, 2]);
    });
    it('polygonSearch and boxSearch', function () {
      var pt, result;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      text = layer.createFeature('text');
      expect(text.polygonSearch([{x: 0, y: 0}, {x: 30, y: 0}, {x: 30, y: 30}]).index).toEqual([]);
      text.style({font: '20px sans-serif'}).data([
        {text: 'First text', x: 20, y: 10},
        {text: 'Second text', x: -20, y: 10},
        {text: 'Third text', x: -20, y: -10},
        {text: '', x: 20, y: -10}
      ]);
      expect(text.polygonSearch([{x: 0, y: 0}, {x: 30, y: 0}]).index).toEqual([]);
      pt = map.gcsToDisplay({x: 20, y: 10});
      function box(x0, y0, x1, y1) {
        return [
          map.displayToGcs({x: pt.x + x0, y: pt.y + y0}),
          map.displayToGcs({x: pt.x + x1, y: pt.y + y0}),
          map.displayToGcs({x: pt.x + x1, y: pt.y + y1}),
          map.displayToGcs({x: pt.x + x0, y: pt.y + y1})
        ];
      }
      /* fully contained */
      result = text.polygonSearch(box(-100, -30, 100, 30));
      expect(result.index).toEqual([0]);
      expect(result.found[0].text).toBe('First text');
      expect(result.extra[0].partial).toBe(false);
      expect(text.polygonSearch({outer: box(-100, -30, 100, 30)}).index).toEqual([0]);
      /* with a hole that removes part of the text */
      result = {outer: box(-100, -30, 100, 30), inner: [box(-5, -5, 5, 5)]};
      expect(text.polygonSearch(result).index).toEqual([]);
      expect(text.polygonSearch(result, {partial: true}).index).toEqual([0]);
      /* partly contained */
      expect(text.polygonSearch(box(0, -30, 100, 30)).index).toEqual([]);
      result = text.polygonSearch(box(0, -30, 100, 30), {partial: true});
      expect(result.index).toEqual([0]);
      expect(result.extra[0].partial).toBe(true);
      /* center */
      expect(text.polygonSearch(box(-10, -30, 100, 30), {partial: 'center'}).index).toEqual([0]);
      expect(text.polygonSearch(box(10, -30, 100, 30), {partial: 'center'}).index).toEqual([]);
      /* polygon inside of the text */
      expect(text.polygonSearch(box(-2, -2, 2, 2), {partial: true}).index).toEqual([0]);
      expect(text.polygonSearch(box(-2, -2, 2, 2)).index).toEqual([]);
      /* polygon crosses the text without containing any vertices */
      expect(text.polygonSearch(box(-2, -100, 2, 100), {partial: true}).index).toEqual([0]);
      expect(text.polygonSearch(box(-2, -100, 2, 100)).index).toEqual([]);
      /* nowhere close */
      expect(text.polygonSearch(box(200, -30, 300, 30), {partial: true}).index).toEqual([]);
      /* everything */
      expect(text.polygonSearch(box(-600, -400, 600, 400)).index).toEqual([0, 1, 2]);
      /* boxSearch */
      result = box(-100, -30, 100, 30);
      expect(text.boxSearch(result[3], result[1]).index).toEqual([0]);
      /* a different gcs */
      result = box(-100, -30, 100, 30).map(function (p) {
        return geo.transform.transformCoordinates(map.ingcs(), map.gcs(), p);
      });
      expect(text.polygonSearch(result, undefined, null).index).toEqual([0]);
    });
    it('renderThreshold', function () {
      mockAnimationFrame();
      logCanvas2D();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      text = layer.createFeature('text').data(testText);
      text.draw();
      stepAnimationFrame();
      var count1 = $.extend({}, window._canvasLog.counts).fillText;
      text.style({renderThreshold: 0});
      text.draw();
      stepAnimationFrame();
      var count2 = $.extend({}, window._canvasLog.counts).fillText;
      expect(count2 - count1).toBe(14);
      text.style({renderThreshold: 1});
      text.draw();
      stepAnimationFrame();
      var count3 = $.extend({}, window._canvasLog.counts).fillText;
      expect(count3 - count2).toBe(6);
      text.style({renderThreshold: 20});
      text.draw();
      stepAnimationFrame();
      var count4 = $.extend({}, window._canvasLog.counts).fillText;
      expect(count4 - count3).toBe(8);
      text.style({renderThreshold: 0});
      text.draw();
      stepAnimationFrame();
      var count5 = $.extend({}, window._canvasLog.counts).fillText;
      expect(count5 - count4).toBe(14);
      unmockAnimationFrame();
    });
  });
});
