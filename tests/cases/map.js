// Test geo.core.map

describe('geo.core.map', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var closeToEqual = require('../test-utils').closeToEqual;
  var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
  var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
  var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

  function create_map(opts) {
    var node = $('<div id="map-create-map"/>').css({width: '500px', height: '500px'});
    $('#map-create-map').remove();
    $('body').append(node);
    opts = $.extend({}, opts);
    opts.node = node;
    return geo.map(opts);
  }

  afterEach(function () {
    $('#map-create-map').remove();
    $(window).off('resize');
  });

  describe('Check class accessors', function () {
    it('clampBounds', function () {
      var m = create_map();
      var axes = {'X': false, 'Y': true};
      $.each(axes, function (axis, defaultSetting) {
        var func = m['clampBounds' + axis];
        expect(func()).toBe(defaultSetting);
        func(true);
        expect(func()).toBe(true);
        func(false);
        expect(func()).toBe(false);
        func('truthy');
        expect(func()).toBe(true);
      });
    });
    it('clampZoom and zoomRange', function () {
      var m = create_map(), zr;
      expect(m.clampZoom()).toBe(true);
      zr = m.zoomRange();
      expect(zr.min).toBeCloseTo(Math.log2(500 / 256), 2);
      expect(zr.origMin).toBe(0);
      expect(zr.max).toBe(16);
      m.clampZoom(false);
      expect(m.clampZoom()).toBe(false);
      expect(m.zoomRange().min).toBe(0);
      m.clampZoom(true);
      expect(m.clampZoom()).toBe(true);
      expect(zr.min).toBeCloseTo(Math.log2(500 / 256), 2);
      m.zoomRange({min: 1, max: 2});
      zr = m.zoomRange();
      expect(zr.min).toBe(1);
      expect(zr.origMin).toBe(1);
      expect(zr.max).toBe(2);
      m.zoomRange({min: 0});
      zr = m.zoomRange();
      expect(zr.min).toBeCloseTo(Math.log2(500 / 256), 2);
      expect(zr.origMin).toBe(0);
      expect(zr.max).toBe(2);
    });
    it('allowRotation', function () {
      var m = create_map();
      expect(m.allowRotation()).toBe(true);
      m.rotation(0);
      expect(m.rotation()).toBe(0);
      m.rotation(1);
      expect(m.rotation()).toBe(1);
      m.allowRotation(false);
      expect(m.allowRotation()).toBe(false);
      expect(m.rotation()).toBe(0);
      m.rotation(0);
      expect(m.rotation()).toBe(0);
      m.rotation(1);
      expect(m.rotation()).toBe(0);
      m.allowRotation(true);
      m.rotation(1);
      expect(m.rotation()).toBe(1);
      m.allowRotation(function (rotation) {
        var factor = 180 / Math.PI / 15;
        return Math.round(rotation * factor) / factor;
      });
      expect(typeof m.allowRotation()).toBe('function');
      expect(m.rotation()).toBeCloseTo(60 * Math.PI / 180);
      m.rotation(0);
      expect(m.rotation()).toBe(0);
      m.rotation(17 * Math.PI / 180);
      expect(m.rotation()).toBeCloseTo(15 * Math.PI / 180);
      m.allowRotation(true);
      expect(m.rotation()).toBeCloseTo(15 * Math.PI / 180);
      m.rotation(17 * Math.PI / 180);
      expect(m.rotation()).toBeCloseTo(17 * Math.PI / 180);
    });
    it('size and rotatedSize', function () {
      var m = create_map();
      expect(m.size()).toEqual({width: 500, height: 500});
      expect(m.rotatedSize()).toEqual({width: 500, height: 500});
      m.size({width: 400, height: 300});
      expect(m.size()).toEqual({width: 400, height: 300});
      expect(m.rotatedSize()).toEqual({width: 400, height: 300});
      m.rotation(Math.PI);
      expect(m.size()).toEqual({width: 400, height: 300});
      expect(closeToEqual(m.rotatedSize(), {width: 400, height: 300})).toBe(true);
      m.rotation(Math.PI / 2);
      expect(m.size()).toEqual({width: 400, height: 300});
      expect(closeToEqual(m.rotatedSize(), {width: 300, height: 400})).toBe(true);
      m.rotation(Math.PI / 4);
      expect(m.size()).toEqual({width: 400, height: 300});
      expect(closeToEqual(m.rotatedSize(), {
        width: 700 / Math.sqrt(2), height: 700 / Math.sqrt(2)})).toBe(true);
      m.rotation(Math.PI / 12);
      expect(m.size()).toEqual({width: 400, height: 300});
      expect(closeToEqual(m.rotatedSize(), {
        width: 400 * Math.cos(Math.PI / 12) + 300 * Math.sin(Math.PI / 12),
        height: 400 * Math.sin(Math.PI / 12) + 300 * Math.cos(Math.PI / 12)
      })).toBe(true);
      m.size({width: 300, height: 400});
      expect(m.size()).toEqual({width: 300, height: 400});
      expect(closeToEqual(m.rotatedSize(), {
        width: 300 * Math.cos(Math.PI / 12) + 400 * Math.sin(Math.PI / 12),
        height: 300 * Math.sin(Math.PI / 12) + 400 * Math.cos(Math.PI / 12)
      })).toBe(true);
    });
    it('unitsPerPixel', function () {
      var m = create_map(), circEarth = 6378137 * Math.PI * 2;
      m.createLayer('feature', {renderer: 'd3'});
      expect(m.unitsPerPixel()).toBeCloseTo(circEarth / 256);
      expect(m.unitsPerPixel(0)).toBeCloseTo(circEarth / 256);
      expect(m.unitsPerPixel(1)).toBeCloseTo(circEarth / 256 / 2);
      expect(m.unitsPerPixel(4)).toBeCloseTo(circEarth / 256 / 16);
      m.unitsPerPixel(undefined, 200000);
      expect(m.unitsPerPixel()).toBe(200000);
      expect(m.unitsPerPixel(4)).toBeCloseTo(200000 / 16);
      m.unitsPerPixel(4, 200000);
      expect(m.unitsPerPixel()).toBeCloseTo(200000 * 16);
      expect(m.unitsPerPixel(4)).toBeCloseTo(200000);
    });
    it('scale', function () {
      var m = create_map();
      expect(m.scale()).toEqual({x: 1, y: 1, z: 1});
    });
    it('gcs and ingcs', function () {
      var m = create_map(), units = m.unitsPerPixel(), bounds;
      var error = console.error;
      expect(m.gcs()).toBe('EPSG:3857');
      expect(m.ingcs()).toBe('EPSG:4326');
      m.bounds({left: -180, top: 5, right: 180, bottom: -5});
      expect(closeToEqual(m.bounds(), {
        left: -180, top: 85.05, right: 180, bottom: -85.05,
        width: 256 * units, height: 256 * units})).toBe(true);
      expect(closeToEqual(m.bounds(undefined, null), {
        left: -128 * units, top: 128 * units,
        right: 128 * units, bottom: -128 * units,
        width: 256 * units, height: 256 * units})).toBe(true);
      m.ingcs('EPSG:3857');
      expect(m.ingcs()).toBe('EPSG:3857');
      expect(closeToEqual(m.bounds(), {
        left: -128 * units, top: 128 * units,
        right: 128 * units, bottom: -128 * units,
        width: 256 * units, height: 256 * units})).toBe(true);
      // test with a different non-zero center
      m.ingcs('EPSG:4326');
      m.bounds({left: -180, top: 65, right: -45, bottom: 45});
      bounds = m.bounds();
      // compare left, top, right, bottom separately from width and height to
      // use different precisions in the comparison
      expect(closeToEqual({
        left: bounds.left, top: bounds.top,
        right: bounds.right, bottom: bounds.bottom
      }, {
        left: -180, top: 79.340, right: -45, bottom: 0.906
      })).toBe(true);
      expect(closeToEqual({width: bounds.width, height: bounds.height}, {
        width: 96 * units, height: 96 * units}, -2)).toBe(true);
      expect(closeToEqual(m.bounds(undefined, null), {
        left: -128 * units, top: 96.6444 * units,
        right: -32 * units, bottom: 0.6444 * units,
        width: 96 * units, height: 96 * units}, -2)).toBe(true);
      m.bounds({left: -180, top: 5, right: 180, bottom: -5});
      // test with different projections
      m.unitsPerPixel(0, 1);
      m.gcs('+proj=longlat +axis=enu');
      expect(m.gcs()).toBe('+proj=longlat +axis=enu');
      m.ingcs('+proj=longlat +axis=esu');
      expect(m.ingcs()).toBe('+proj=longlat +axis=esu');
      expect(closeToEqual(m.bounds(), {
        left: -128, top: -128, right: 128, bottom: 128,
        width: 256, height: 256})).toBe(true);
      expect(closeToEqual(m.bounds(undefined, null), {
        left: -128, top: 128, right: 128, bottom: -128,
        width: 256, height: 256})).toBe(true);
      /* when an invalid transform is set, we shouldn't throw any exceptions,
       * even if the computations become strange. */

      // silence errors
      console.error = function () {};
      m.gcs('invalid');
      expect(m.gcs()).toBe('invalid');
      m.ingcs('invalid2');
      expect(m.ingcs()).toBe('invalid2');
      expect(m.bounds({left: -180, top: 5, right: 180, bottom: -5})).not.toBe(
        undefined);
      expect(m.bounds()).not.toBe(undefined);
      console.error = error;
    });
    it('maxBounds', function () {
      var m = create_map();
      expect(closeToEqual(m.maxBounds(), {
        left: -180, top: 85.05, right: 180, bottom: -85.05})).toBe(true);
      m.maxBounds({left: -90, right: 20, top: 40, bottom: -60});
      expect(closeToEqual(m.maxBounds(), {
        left: -90, right: 20, top: 40, bottom: -60})).toBe(true);
    });
    it('zoom and discreteZoom', function () {
      var m = create_map();
      expect(m.zoom()).toBe(4);
      expect(m.discreteZoom()).toBe(false);
      m.zoom(3.5);
      expect(m.zoom()).toBe(3.5);
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.zoom(3, {geo: m.displayToGcs({x: 122, y: 186}),
                 map: {x: 122, y: 186}});
      expect(m.zoom()).toBe(3);
      expect(closeToEqual(m.center(), {x: 6.59, y: -3.293, z: 0})).toBe(true);
      m.discreteZoom(true);
      expect(m.discreteZoom()).toBe(true);
      expect(m.zoom()).toBe(3);
      m.zoom(4.1);
      expect(m.zoom()).toBe(4);
      m.zoom(4.1, undefined, true);
      expect(m.zoom()).toBe(4.1);
      m.discreteZoom(false);
      expect(m.discreteZoom()).toBe(false);
      m.clampZoom(true);
      m.zoom(0);
      expect(m.zoom()).toBeGreaterThan(0.6);
      expect(m.zoom()).toBeLessThan(1);
      m.discreteZoom(true);
      m.zoom(0);
      expect(m.zoom()).toBe(1);
      m.resize(0, 0, 600, 600);
      expect(m.zoom()).toBe(2);
      m.zoom(3);
      expect(m.zoom()).toBe(3);
      m.zoom(0);
      expect(m.zoom()).toBe(2);
    });
    it('rotation', function () {
      var m = create_map();
      expect(m.rotation()).toBe(0);
      m.rotation(1);
      expect(m.rotation()).toBe(1);
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.rotation(0, {geo: m.displayToGcs({x: 122, y: 186}),
                     map: {x: 122, y: 186}});
      expect(m.rotation()).toBe(0);
      expect(m.center().x).toBeGreaterThan(0.4);
      expect(m.center().y).toBeLessThan(-11);
      m.rotation(-1);
      expect(m.rotation()).toBeCloseTo(Math.PI * 2 - 1);
      m.rotation(17);
      expect(m.rotation()).toBeCloseTo(17 - Math.PI * 4);
    });
    it('fileReader', function () {
      var m = create_map();
      expect(m.fileReader()).toBe(null);
      var layerCount = m.layers().length;
      expect(m.fileReader('jsonReader')).toBe(m);
      expect(m.fileReader()).not.toBe(null);
      expect(m.layers().length).toBe(layerCount + 1);
      expect(m.layers()[m.layers().length - 1].renderer().api()).not.toBe('d3');
      expect(m.fileReader('jsonReader', {renderer: 'd3'})).toBe(m);
      expect(m.layers()[m.layers().length - 1].renderer().api()).toBe('d3');
      var r = geo.createFileReader('jsonReader', {layer: m.layers()[m.layers().length - 1]});
      expect(m.fileReader(r)).toBe(m);
      expect(m.fileReader()).toBe(r);
    });
  });

  describe('Public utility methods', function () {
    /* Count the number of jquery events bounds to an element using a
     * particular namespace.
     *
     * @param {jquery element|dom element} elem the element to check.
     * @param {string} namespace the namespace to count.
     * @returns {number} the number of bounds events.
     */
    function count_events(elem, namespace) {
      elem = $(elem)[0];
      var evtCount = 0;
      $.each($._data(elem, 'events'), function (key, evtList) {
        $.each(evtList, function (idx, evt) {
          if (evt.namespace === namespace) {
            evtCount += 1;
          }
        });
      });
      return evtCount;
    }

    it('exit', function () {
      var m = create_map();
      m.updateAttribution('Sample');
      expect(count_events(m.node(), 'geo')).toBeGreaterThan(0);
      m.exit();
      expect(count_events(m.node(), 'geo')).toBe(0);
      expect($('#map-create-map').children().length).toBe(0);
    });
    it('pan, clampBoundsX, and clampBoundsY', function () {
      var m = create_map({
        unitsPerPixel: 16,
        gcs: '+proj=longlat +axis=enu',
        ingcs: '+proj=longlat +axis=esu',
        maxBounds: {left: -2048, right: 2048, top: -2048, bottom: 2048},
        max: 4
      });
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.pan({x: -128, y: 0});
      expect(closeToEqual(m.center(), {x: 128, y: 0, z: 0})).toBe(true);
      m.clampZoom(false);
      expect(m.clampBoundsX()).toBe(false);
      expect(m.clampBoundsY()).toBe(true);
      m.clampBoundsX(false);
      expect(m.clampBoundsX()).toBe(false);
      m.clampBoundsY(false);
      expect(m.clampBoundsY()).toBe(false);
      m.zoom(0);
      m.center({x: 0, y: 0});
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.pan({x: -128, y: 0});
      expect(closeToEqual(m.center(), {x: 2048, y: 0, z: 0})).toBe(true);
      m.pan({x: -128, y: 0});
      expect(closeToEqual(m.center(), {x: 4096, y: 0, z: 0})).toBe(true);
      m.center({x: 0, y: 0});
      m.clampBoundsX(true);
      expect(m.clampBoundsX()).toBe(true);
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.pan({x: -128, y: 0});
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.pan({x: 0, y: 100});
      expect(closeToEqual(m.center(), {x: 0, y: -1600, z: 0})).toBe(true);
      m.center({x: 0, y: 0});
      m.clampBoundsY(true);
      expect(m.clampBoundsY()).toBe(true);
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.pan({x: -128, y: 0});
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.pan({x: 0, y: 100});
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.center({x: 0, y: 0});
      m.clampBoundsX(false);
      expect(closeToEqual(m.center(), {x: 0, y: 0, z: 0})).toBe(true);
      m.pan({x: -128, y: 0});
      expect(closeToEqual(m.center(), {x: 2048, y: 0, z: 0})).toBe(true);
      m.pan({x: 0, y: 100});
      expect(closeToEqual(m.center(), {x: 2048, y: 0, z: 0})).toBe(true);
      m.zoom(2);
      m.clampBoundsX(true);
      m.pan({x: 1000, y: 0});
      expect(closeToEqual(m.center(), {x: -1048, y: 0, z: 0})).toBe(true);
      m.pan({x: -1000, y: 0});
      expect(closeToEqual(m.center(), {x: 1048, y: 0, z: 0})).toBe(true);
      m.pan({x: 262, y: 1000});
      expect(closeToEqual(m.center(), {x: 0, y: -1048, z: 0})).toBe(true);
      m.pan({x: 0, y: -1000});
      expect(closeToEqual(m.center(), {x: 0, y: 1048, z: 0})).toBe(true);
    });
    it('zoomAndCenterFromBounds', function () {
      var zc;
      var m = create_map({
        unitsPerPixel: 16,
        gcs: '+proj=longlat +axis=enu',
        ingcs: '+proj=longlat +axis=esu',
        maxBounds: {left: -2048, right: 2048, top: -2048, bottom: 2048},
        max: 4
      });
      zc = m.zoomAndCenterFromBounds({
        left: -250, top: -250, right: 250, bottom: 250});
      expect(zc.zoom).toBeCloseTo(4);
      expect(closeToEqual(zc.center, {x: 0, y: 0})).toBe(true);
      expect(function () {
        m.zoomAndCenterFromBounds({
          left: -250, top: 250, right: 250, bottom: -250});
      }).toThrow(new Error('Invalid bounds provided'));
      zc = m.zoomAndCenterFromBounds({
        left: 0, top: -500, right: 10, bottom: 500});
      expect(zc.zoom).toBeCloseTo(3);
      expect(closeToEqual(zc.center, {x: 5, y: 0})).toBe(true);
      // check using gcs rather than ingcs
      zc = m.zoomAndCenterFromBounds({
        left: -250, top: 250, right: 250, bottom: -250}, undefined, null);
      expect(zc.zoom).toBeCloseTo(4);
      expect(closeToEqual(zc.center, {x: 0, y: 0})).toBe(true);
      // check rotation
      zc = m.zoomAndCenterFromBounds({
        left: -500, top: -500, right: 500, bottom: 500}, Math.PI / 6);
      expect(zc.zoom).toBeCloseTo(
        3 - Math.log(Math.cos(Math.PI / 6) + Math.sin(Math.PI / 6)) /
        Math.log(2));
      expect(closeToEqual(zc.center, {x: 0, y: 0})).toBe(true);
    });
    it('transition', function () {
      mockAnimationFrame();
      var m = create_map(), start, wasCalled;
      expect(m.transition()).toBe(null);
      start = new Date().getTime();
      m.transition({
        center: {x: 10, y: 0},
        zoom: 2,
        rotation: Math.PI,
        duration: 1000
      });
      expect(m.transition().ease).not.toBe(null);
      expect(m.transition().start.time).toBe(undefined);
      stepAnimationFrame(start);
      expect(m.transition().start.time).toBe(start);
      expect(m.transition().time).toBe(0);
      stepAnimationFrame(start + 500);
      expect(m.transition().time).toBeCloseTo(500);
      expect(m.center().x).toBeCloseTo(5);
      expect(m.zoom()).toBeLessThan(2.9);
      expect(m.rotation()).toBeCloseTo(Math.PI / 2);
      stepAnimationFrame(start + 1000);
      expect(m.transition()).toBe(null);
      expect(m.center().x).toBeCloseTo(10);
      expect(m.zoom()).toBe(2);
      expect(m.rotation()).toBeCloseTo(Math.PI);
      // queue two transitions.  The first transition will end as it starts.
      m.transition({
        center: {x: 20, y: 0},
        rotation: 0,
        duration: 1000
      });
      m.transition({
        center: {x: 20, y: 10},
        rotation: 0,
        duration: 1000
      });
      expect(m.transition().start.time).toBe(undefined);
      stepAnimationFrame(start);
      // the first transition gets cancelled, as the second transition will
      // perform the entire action.
      expect(m.transition().start.time).toBe(start);
      expect(m.transition().time).toBe(0);
      expect(m.center().x).toBeCloseTo(10);
      expect(m.center().y).toBeCloseTo(0);
      stepAnimationFrame(start + 500);
      expect(m.transition().time).toBeCloseTo(500);
      expect(m.center().x).toBeCloseTo(15);
      expect(m.center().y).toBeCloseTo(5, 1);
      stepAnimationFrame(start + 1000);
      expect(m.transition()).toBe(null);
      expect(m.center().x).toBeCloseTo(20);
      expect(m.center().y).toBeCloseTo(10);
      // test without zCoord effect
      m.transition({
        zoom: 4,
        zCoord: false
      });
      stepAnimationFrame(start);
      stepAnimationFrame(start + 500);
      expect(m.zoom()).toBeCloseTo(3);
      stepAnimationFrame(start + 1000);
      expect(m.transition()).toBe(null);
      expect(m.zoom()).toBe(4);
      // test with callback
      m.transition({
        center: {x: 0, y: 0},
        duration: 1000,
        done: function () {
          wasCalled = true;
        }
      });
      stepAnimationFrame(start);
      expect(wasCalled).toBe(undefined);
      stepAnimationFrame(start + 1000);
      expect(wasCalled).toBe(true);
      // test cancelNavigation
      geo.event.cancelNavigation = true;
      m.transition({
        center: {x: -10, y: 0},
        duration: 1000
      });
      expect(m.transition()).toBe(null);
      expect(m.center().x).toBeCloseTo(0);
      expect(m.center().y).toBeCloseTo(0);
      geo.event.cancelNavigation = false;
      // test cancelAnimation
      geo.event.cancelAnimation = true;
      m.transition({
        center: {x: -10, y: 0},
        duration: 1000
      });
      expect(m.transition()).toBe(null);
      expect(m.center().x).toBeCloseTo(-10);
      expect(m.center().y).toBeCloseTo(0);
      geo.event.cancelAnimation = false;
      // test with custom easing
      m.transition({
        center: {x: 0, y: 0},
        ease: function (t) {
          return t * t;
        },
        duration: 1000
      });
      stepAnimationFrame(start);
      stepAnimationFrame(start + 500);
      expect(m.center().x).toBeCloseTo(-7.5);
      expect(m.center().y).toBeCloseTo(0);
      stepAnimationFrame(start + 1000);
      expect(m.center().x).toBeCloseTo(0);
      expect(m.center().y).toBeCloseTo(0);
      // test cancel
      start = new Date().getTime();
      wasCalled = undefined;
      m.transition({
        center: {x: 10, y: 0},
        duration: 1000,
        done: function () {
          wasCalled = true;
        }
      });
      expect(m.transition().start.time).toBe(undefined);
      stepAnimationFrame(start);
      expect(m.transition().start.time).toBe(start);
      expect(m.transition().time).toBe(0);
      expect(m.transitionCancel()).toBe(true);
      expect(m.transition()).not.toBe(null);
      expect(m.transition().cancel).toBe(true);
      expect(m.transitionCancel()).toBe(false);
      expect(wasCalled).toBe(undefined);
      stepAnimationFrame(start + 500);
      expect(m.transition()).toBe(null);
      expect(wasCalled).toBe(true);
      // test cancel with another transition added before the next render
      wasCalled = false;
      m.transition({
        center: {x: -10, y: 0},
        duration: 1000,
        done: function () {
          wasCalled = true;
        }
      });
      stepAnimationFrame(start);
      expect(m.transitionCancel()).toBe(true);
      /* This should never be started or finished */
      m.transition({
        center: {x: 0, y: 0},
        duration: 1000,
        done: function () {
          wasCalled = 'never';
        }
      });
      expect(m.transitionCancel()).toBe(true);
      m.transition({
        center: {x: 10, y: 0},
        duration: 1000
      });
      expect(wasCalled).toBe(false);
      stepAnimationFrame(start + 500);
      expect(m.transition()).not.toBe(null);
      expect(wasCalled).toBe(true);
      unmockAnimationFrame();
    });
    it('node class and data attribute', function () {
      var selector = '#map-create-map';
      var m = create_map();
      expect($(selector).hasClass('geojs-map')).toBe(true);
      expect($(selector).data('data-geojs-map')).toBe(m);
      m.createLayer('feature');
      expect(m.layers().length).toBe(1);
      var m2 = geo.map({node: selector});
      expect($(selector).data('data-geojs-map')).toBe(m2);
      m2.createLayer('feature');
      expect(m.layers().length).toBe(0);
      expect(m2.layers().length).toBe(1);
    });
    it('screenshot', function () {
      var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
      var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
      var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

      mockAnimationFrame();

      var m = create_map({
        width: 64, height: 48, zoom: 2, center: {x: 7.5, y: 7.5}});
      var layer1 = m.createLayer('feature', {renderer: 'canvas'});
      var l1 = layer1.createFeature('line', {
        style: {strokeWidth: 5, strokeColor: 'blue'}});
      l1.data([[{x: 0, y: 0}, {x: 5, y: 0}],
               [{x: 0, y: 10}, {x: 5, y: 12}, {x: 2, y: 15}],
               [{x: 10, y: 0}, {x: 15, y: 2}, {x: 12, y: 5}]]);
      var layer2 = m.createLayer('feature', {renderer: 'canvas'});
      var l2 = layer2.createFeature('line', {
        style: {strokeWidth: 5, strokeColor: 'black'}});
      l2.data([[{x: 10, y: 10}, {x: 15, y: 10}],
               [{x: 0, y: 10}, {x: 5, y: 12}, {x: 2, y: 15}]]);

      m.draw();
      stepAnimationFrame(new Date().getTime());
      var dataUrl, dataUrl2, dataUrl3;
      dataUrl = m.screenshot();
      expect(dataUrl.substr(0, 22)).toBe('data:image/png;base64,');
      dataUrl2 = m.screenshot(null, 'image/jpeg');
      expect(dataUrl2.substr(0, 23)).toBe('data:image/jpeg;base64,');
      expect(dataUrl2.length).toBeLessThan(dataUrl.length);
      dataUrl2 = m.screenshot(layer1);
      expect(dataUrl2.substr(0, 22)).toBe('data:image/png;base64,');
      expect(dataUrl2).not.toEqual(dataUrl);
      dataUrl3 = m.screenshot([layer1]);
      expect(dataUrl3).toEqual(dataUrl2);
      // making a layer transparent is as good as not asking for it
      layer2.opacity(0);
      dataUrl3 = m.screenshot();
      expect(dataUrl3).toEqual(dataUrl2);
      // a partial opacity should get different results than full
      layer2.opacity(0.5);
      dataUrl3 = m.screenshot();
      expect(dataUrl3).not.toEqual(dataUrl);
      expect(dataUrl3).not.toEqual(dataUrl2);
      layer2.opacity(1);
      // asking for layers out of order shouldn't matter
      dataUrl3 = m.screenshot([layer2, layer1]);
      expect(dataUrl3).toEqual(dataUrl);
      layer2.canvas().css('transform', 'translate(10px, 20px) scale(1.2) rotate(5deg)');
      stepAnimationFrame(new Date().getTime());
      dataUrl2 = m.screenshot();
      expect(dataUrl2).not.toEqual(dataUrl);
      unmockAnimationFrame();
    });
  });

  describe('Public non-class methods', function () {
    it('geo.map.create', function () {
      var layerSpec = {type: 'feature', renderer: 'd3', features: []};
      var node = $('<div id="map-non-class-methods"/>').css({width: '500px', height: '500px'});
      $('#map-non-class-methods').remove();
      $('body').append(node);
      var m = geo.map.create({node: node, layers: [layerSpec]});
      expect(m.layers().length).toBe(1);

      m.exit();
      node.remove();

      var warn = sinon.stub(console, 'warn', function () {});
      expect(geo.map.create({})).toBe(null);
      expect(warn.calledTwice).toBe(true);
      expect(warn.calledWith('map creation requires a node')).toBe(true);
      expect(warn.calledWith('Could not create map.')).toBe(true);
      console.warn.restore();
    });
  });

  describe('Internal methods', function () {
    it('resizeSelf', function () {
      var m = create_map();
      expect(m.size()).toEqual({width: 500, height: 500});
      $('#map-create-map').css({width: '400px', height: '400px'});
      expect(m.size()).toEqual({width: 500, height: 500});
      $(window).trigger('resize');
      expect(m.size()).toEqual({width: 400, height: 400});
    });
    it('dragover', function () {
      var m = create_map();
      var evt = $.Event('dragover');
      evt.originalEvent = new window.Event('dragover');
      evt.originalEvent.dataTransfer = {};
      $(m.node()).trigger(evt);
      expect(evt.originalEvent.dataTransfer.dropEffect).not.toBe('copy');
      m.fileReader('jsonReader');
      evt = $.Event('dragover');
      evt.originalEvent = new window.Event('dragover');
      evt.originalEvent.dataTransfer = {};
      $(m.node()).trigger(evt);
      expect(evt.originalEvent.dataTransfer.dropEffect).toBe('copy');
    });
    it('drop', function () {
      var m = create_map();
      m.fileReader('jsonReader', {renderer: 'd3'});
      var evt = $.Event('drop');
      evt.originalEvent = new window.Event('drop');
      evt.originalEvent.dataTransfer = {files: [{
        geometry: {coordinates: [1, 2], type: 'Point'}, type: 'Feature'
      }]};
      $(m.node()).trigger(evt);
      expect(m.layers()[0].features().length).toBe(1);
    });
  });
});
