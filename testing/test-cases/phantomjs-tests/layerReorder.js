/*global describe, it, expect, geo*/

describe('Test the zIndex property of layers', function () {
  'use strict';

  // Generate a new empty map
  function createMap() {
    var map = geo.map({node: '#map', width: 100, height: 100}),
        cl = map.createLayer;
    // inject d3 renderer to let this work in phantom
    map.createLayer = function (type, opts) {
      opts = opts || {};
      opts.renderer = 'd3';
      return cl.call(map, type, opts);
    };
    // over-ride map.displayToGcs to work with no base layer
    map.displayToGcs = function (pt) {
      return pt;
    };
    map.gcsToDisplay = function (pt) {
      return pt;
    };
    return map;
  }

  /**
   * Return the z-index of the layer's node
   */
  function getZIndex(layer) {
    return parseInt(layer.node().css('z-index'));
  }

  it('defaults', function () {
    var map = createMap(),
        l1 = map.createLayer('feature'),
        l2 = map.createLayer('feature'),
        l3 = map.createLayer('feature');

    // check that the display order is the added order
    expect(l1.zIndex()).toBeLessThan(l2.zIndex());
    expect(l2.zIndex()).toBeLessThan(l3.zIndex());
  });

  it('set via the constructor', function () {
    var map = createMap(),
        l1 = map.createLayer('feature', {zIndex: 10}),
        l2 = map.createLayer('feature'),
        l3 = map.createLayer('feature', {zIndex: 0});

    expect(getZIndex(l1)).toBe(10);
    expect(getZIndex(l2)).toBe(1);
    expect(getZIndex(l3)).toBe(0);
  });

  it('get/set via the zIndex method', function () {
    var map = createMap(),
        l1 = map.createLayer('feature', {zIndex: 10}),
        l2 = map.createLayer('feature'),
        l3 = map.createLayer('feature', {zIndex: 0});

    expect(l1.zIndex()).toBe(10);
    expect(l2.zIndex()).toBe(1);
    expect(l3.zIndex()).toBe(0);

    l1.zIndex(11);
    l2.zIndex(12);
    l3.zIndex(10);

    expect(getZIndex(l1)).toBe(11);
    expect(getZIndex(l2)).toBe(12);
    expect(getZIndex(l3)).toBe(10);
  });
});
