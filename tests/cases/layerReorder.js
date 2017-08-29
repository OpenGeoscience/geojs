var geo = require('../test-utils').geo;

// Generate a new empty map
function createMap() {
  'use strict';

  var $ = require('jquery');
  var node = $('<div id=map/>').css({
    width: '100px',
    height: '100px'
  });

  $('#map').remove();
  $('body').append(node);
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

describe('Test the zIndex property of layers', function () {
  'use strict';

  /**
   * Return the z-index of the layer's node
   */
  function getZIndex(layer) {
    return parseInt(layer.node().css('z-index'), 10);
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
    expect(getZIndex(l2)).toBe(11);
    expect(getZIndex(l3)).toBe(0);
  });

  it('get/set via the zIndex method', function () {
    var map = createMap(),
        l1 = map.createLayer('feature', {zIndex: 10}),
        l2 = map.createLayer('feature'),
        l3 = map.createLayer('feature', {zIndex: 0});

    expect(l1.zIndex()).toBe(10);
    expect(l2.zIndex()).toBe(11);
    expect(l3.zIndex()).toBe(0);

    l1.zIndex(11);
    l2.zIndex(12);
    l3.zIndex(10);

    expect(getZIndex(l1)).toBe(11);
    expect(getZIndex(l2)).toBe(12);
    expect(getZIndex(l3)).toBe(10);
  });

  it('implicitly moves UI layer to top', function () {
    var map = createMap(),
        ui = map.createLayer('ui'),
        l2 = map.createLayer('feature'),
        l3 = map.createLayer('feature', {zIndex: 10});

    expect(l2.zIndex()).toBeLessThan(l3.zIndex());
    expect(ui.zIndex()).toBeGreaterThan(l2.zIndex());
    expect(ui.zIndex()).toBeGreaterThan(l3.zIndex());
  });
});

describe('Test reordering layers', function () {
  'use strict';

  /**
   * Setup the map for each test individually to make sure
   * it is executed in an `it` context.
   */
  function setup() {
    var map = createMap(),
        layers = [
          map.createLayer('feature', {zIndex: 10}),
          map.createLayer('feature', {zIndex: 100}),
          map.createLayer('feature', {zIndex: 0}),
          map.createLayer('feature', {zIndex: 5}),
          map.createLayer('feature', {zIndex: 11}),
          map.createLayer('feature', {zIndex: 15})
        ];
    return layers;
  }

  /**
   * Do a moveUp/moveDown operation on the given layer.
   */
  function doAction(layer, action) {
    if (action.method === 'up') {
      layer.moveUp(action.n);
    } else if (action.method === 'down') {
      layer.moveDown(action.n);
    } else {
      // let's avoid silent errors in the tests
      throw new Error('Invalid action');
    }
  }

  /**
   * Perform an array of actions.
   */
  function doActions(actions, layers) {
    var original;
    layers = layers || setup();
    original = layers.map(function (l) { return l.zIndex(); });
    actions.forEach(function (action) {
      doAction(layers[action.layer], action);
    });
    return {
      original: original,
      result: layers.map(function (l) { return l.zIndex(); }),
      layers: layers
    };
  }

  /**
   * Make a test that runs a sequence of actions
   * and validates that the zIndices are as expectd.
   *
   * Also generates a test that asserts that the negative
   * actions performed backwards results in the inverse
   * operation.
   */
  function makeTests(actions, result) {
    return function () {
      var test = doActions(actions);
      expect(test.result).toEqual(result);
    };
  }

  it('move layer 2 up one', makeTests(
    [
      {method: 'up', layer: 2}
    ],
    [10, 100, 5, 0, 11, 15]
  ));

  it('move layer 2 down one', makeTests(
    [
      {method: 'down', layer: 2}
    ],
    [10, 100, 0, 5, 11, 15]
  ));

  it('move top layer up one', makeTests(
    [
      {method: 'up', layer: 1}
    ],
    [10, 100, 0, 5, 11, 15]
  ));

  it('move first layer up one', makeTests(
    [
      {method: 'up', layer: 0}
    ],
    [11, 100, 0, 5, 10, 15]
  ));

  it('move fourth layer up and back down 2', makeTests(
    [
      {method: 'up', layer: 4, n: 2},
      {method: 'down', layer: 4, n: 2}
    ],
    [10, 100, 0, 5, 11, 15]
  ));

  it('cycle all the layers up', makeTests(
    [
      {method: 'up', layer: 2, n: 5},
      {method: 'up', layer: 3, n: 5},
      {method: 'up', layer: 0, n: 5},
      {method: 'up', layer: 4, n: 5},
      {method: 'up', layer: 5, n: 5},
      {method: 'up', layer: 1, n: 5}
    ],
    [10, 100, 0, 5, 11, 15]
  ));

  it('cycle all the layers down', makeTests(
    [
      {method: 'down', layer: 1, n: 5},
      {method: 'down', layer: 5, n: 5},
      {method: 'down', layer: 4, n: 5},
      {method: 'down', layer: 0, n: 5},
      {method: 'down', layer: 3, n: 5},
      {method: 'down', layer: 2, n: 5}
    ],
    [10, 100, 0, 5, 11, 15]
  ));

  it('move the bottom layer to the top', function () {
    var layers = setup();
    layers[2].moveToTop();
    expect(layers.map(function (l) { return l.zIndex(); }))
      .toEqual([5, 15, 100, 0, 10, 11]);
  });

  it('move the top layer to the bottom', function () {
    var layers = setup();
    layers[1].moveToBottom();
    expect(layers.map(function (l) { return l.zIndex(); }))
      .toEqual([11, 0, 5, 10, 15, 100]);
  });

  it('move one layer to the same z-index of an existing layer', function () {
    var layers = setup();

    layers[1].zIndex(10);
    expect(layers.map(function (l) { return l.zIndex(); }))
      .toEqual([11, 10, 0, 5, 12, 15]);
    // if multiple layers have values that need to be shifted, they should
    // end up with unique values with later layers above earlier ones.
    layers[5].zIndex(11, true);
    layers[4].zIndex(12, true);
    layers[1].zIndex(11);
    expect(layers.map(function (l) { return l.zIndex(); }))
      .toEqual([12, 11, 0, 5, 14, 13]);
  });
});
