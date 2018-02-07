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
});
