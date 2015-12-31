// Test geo.tileLayer

/*global describe, it, expect, geo*/
describe('geo.map', function () {
  'use strict';

  function create_map(opts) {
    var node = $('<div class="#map"/>').css({width: '500px', height: '500px'});
    $('#map').remove();
    $('body').append(node);
    opts = $.extend({}, opts);
    opts.node = node;
    return geo.map(opts);
  }

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

    // add additional tests here
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
      expect(count_events(m.node(), 'geo')).toBeGreaterThan(0);
      m.exit();
      expect(count_events(m.node(), 'geo')).toBe(0);
    });

    // add additional public method tests here
  });
});
