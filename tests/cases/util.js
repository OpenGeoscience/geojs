/* global $ */

/* Test util functions that aren't tested elsewhere. */

describe('geo.util', function () {
  'use strict';

  var geo = require('../test-utils').geo,
      util = geo.util;

  it('isObject', function () {
    expect(util.isObject({})).toBe(true);
    expect(util.isObject(Function)).toBe(true);
    expect(util.isObject([1, 2, 3])).toBe(true);
    expect(util.isObject(null)).toBe(false);
    expect(util.isObject(undefined)).toBe(false);
    expect(util.isObject(6)).toBe(false);
    expect(util.isObject('abc')).toBe(false);
    expect(util.isObject(true)).toBe(false);
    /* eslint-disable no-new-wrappers */
    expect(util.isObject(new Number(6))).toBe(true);
    expect(util.isObject(new String('abc'))).toBe(true);
    expect(util.isObject(new Boolean(true))).toBe(true);
    /* eslint-enable no-new-wrappers */
    // test that objects from iframes are still objects
    var iframe = $('<iframe>');
    $('body').append(iframe);
    var iframeWindow = iframe[0].contentWindow;
    expect(util.isObject(new iframeWindow.Object())).toBe(true);
    // they aren't using instanceof
    expect((new iframeWindow.Object()) instanceof Object).toBe(false);
    expect(({}) instanceof iframeWindow.Object).toBe(false);
    iframe.remove();
  });

  it('centerFromPerimter', function () {
    expect(util.centerFromPerimeter()).toBe(undefined);
    expect(util.centerFromPerimeter([])).toBe(undefined);
    expect(util.centerFromPerimeter([{x: 1, y: 1}])).toEqual({x: 1, y: 1});
    expect(util.centerFromPerimeter([{x: 1, y: 1}, {x: 1, y: 1}])).toEqual({x: 1, y: 1});
    expect(util.centerFromPerimeter([
        {x: 1, y: 1}, {x: 3, y: 1}, {x: 3, y: 3}, {x: 1, y: 3}
    ])).toEqual({x: 2, y: 2});
    expect(util.centerFromPerimeter([
        {x: 1, y: 1}, {x: 3, y: 1}, {x: 5, y: 1}, {x: 5, y: 3}, {x: 1, y: 3}
    ])).toEqual({x: 3, y: 2});
  });

  it('rdpLineSimplify', function () {
    var dataset1 = [
        {x: 10, y: 10}, {x: 20, y: 11}, {x: 30, y: 13}, {x: 40, y: 10}];
    var dataset2 = [
        {x: 84, y: 1}, {x: 57, y: 0}, {x: 44, y: 4}, {x: 33, y: 10},
        {x: 21, y: 20}, {x: 8, y: 40}, {x: 2, y: 56}, {x: 0, y: 105},
        {x: 5, y: 123}, {x: 15, y: 140}, {x: 26, y: 154}, {x: 40, y: 164},
        {x: 60, y: 169}, {x: 92, y: 168}, {x: 104, y: 165}, {x: 115, y: 161},
        {x: 127, y: 154}, {x: 135, y: 146}, {x: 143, y: 136}, {x: 149, y: 124},
        {x: 152, y: 114}, {x: 155, y: 103}, {x: 156, y: 56}, {x: 151, y: 44},
        {x: 141, y: 24}, {x: 129, y: 8}, {x: 118, y: 3}, {x: 106, y: 1}];
    var dataset3 = [
        {x: 10, y: 5}, {x: 30, y: 3}, {x: 50, y: 5}, {x: 40, y: 30},
        {x: 30, y: 4}, {x: 20, y: 30}];
    var dataset4 = [
        {x: 10, y: 5}, {x: 30, y: 3}, {x: 50, y: 5}, {x: 50, y: 10},
        {x: 40, y: 10}, {x: 40, y: 6}, {x: 30, y: 4}, {x: 20, y: 6},
        {x: 20, y: 10}, {x: 10, y: 10}];
    expect(util.rdpLineSimplify(dataset1, 1)).toEqual([
        {x: 10, y: 10}, {x: 30, y: 13}, {x: 40, y: 10}
    ]);
    expect(util.rdpLineSimplify(dataset1, 0.25)).toEqual([
        {x: 10, y: 10}, {x: 20, y: 11}, {x: 30, y: 13}, {x: 40, y: 10}
    ]);
    expect(util.rdpLineSimplify(dataset1, 3)).toEqual([
        {x: 10, y: 10}, {x: 40, y: 10}
    ]);
    expect(util.rdpLineSimplify(dataset1, 1, true)).toEqual([
        {x: 40, y: 10}, {x: 10, y: 10}, {x: 30, y: 13}
    ]);
    expect(util.rdpLineSimplify(dataset1, 31, true)).toEqual([
        {x: 40, y: 10}
    ]);
    expect(util.rdpLineSimplify(dataset1, 80, true)).toEqual([
        {x: 40, y: 10}
    ]);
    expect(util.rdpLineSimplify(dataset2, 5)).toEqual([
        {x: 84, y: 1}, {x: 57, y: 0}, {x: 33, y: 10}, {x: 2, y: 56},
        {x: 5, y: 123}, {x: 26, y: 154}, {x: 60, y: 169}, {x: 92, y: 168},
        {x: 127, y: 154}, {x: 152, y: 114}, {x: 156, y: 56}, {x: 129, y: 8},
        {x: 106, y: 1}
    ]);
    expect(util.rdpLineSimplify(dataset2, 20, true)).toEqual([
        {x: 60, y: 169}, {x: 149, y: 124}, {x: 156, y: 56}, {x: 118, y: 3},
        {x: 44, y: 4}, {x: 2, y: 56}, {x: 5, y: 123}
    ]);
    // test that when we allow lines to cross they can
    expect(util.rdpLineSimplify(dataset3, 3, true)).toEqual([
        {x: 50, y: 5}, {x: 40, y: 30}, {x: 30, y: 4}, {x: 20, y: 30},
        {x: 10, y: 5}
    ]);
    // test that when we disallow lines to cross they don't
    expect(util.rdpLineSimplify(dataset3, 3, true, [])).toEqual([
        {x: 50, y: 5}, {x: 40, y: 30}, {x: 30, y: 4}, {x: 20, y: 30},
        {x: 10, y: 5}, {x: 30, y: 3}
    ]);
    // Some more complicated tests can still be reduced
    expect(util.rdpLineSimplify(dataset4, 3, true, [])).toEqual([
        {x: 50, y: 10}, {x: 30, y: 4}, {x: 10, y: 10}, {x: 10, y: 5},
        {x: 30, y: 3}, {x: 50, y: 5}
    ]);
    expect(util.rdpLineSimplify(dataset4, 6, true, [])).toEqual([
        {x: 50, y: 10}, {x: 10, y: 5}, {x: 30, y: 3}, {x: 50, y: 5}
    ]);
  });
});
