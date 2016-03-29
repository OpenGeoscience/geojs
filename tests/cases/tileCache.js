// Test geo.tileCache

describe('geo.tileCache', function () {
  'use strict';

  var geo = require('../test-utils').geo;

  // test cache size settings
  describe('cache size', function () {
    it('cache reaches the correct size', function () {
      var cache = geo.tileCache({size: 2});

      expect(cache.length).toBe(0);

      cache.add(1);
      expect(cache.length).toBe(1);

      cache.add(2);
      expect(cache.length).toBe(2);

      cache.add(3);
      expect(cache.length).toBe(2);

      cache.remove(3);
      expect(cache.length).toBe(1);

      cache.add(4);
      expect(cache.length).toBe(2);

      cache.add(5);
      expect(cache.length).toBe(2);
    });
    it('cache expands correctly', function () {
      var cache = geo.tileCache({size: 2});

      cache.add(1);
      cache.add(2);
      cache.add(3);
      expect(cache.length).toBe(2);

      cache.size = 3;
      expect(cache.length).toBe(2);
      cache.add(4);
      expect(cache.length).toBe(3);
    });
    it('cache contracts correctly', function () {
      var cache = geo.tileCache({size: 2});

      cache.add(1);
      cache.add(2);
      cache.add(3);
      expect(cache.length).toBe(2);

      cache.size = 1;
      expect(cache.length).toBe(1);
      cache.add(4);
      expect(cache.length).toBe(1);
    });
  });

  // test cache removal priority
  describe('cache access queue', function () {
    it('simple case (no gets)', function () {
      var cache = geo.tileCache({size: 2});

      cache.add(-1);
      cache.add(-2);
      cache.add('not a number');

      expect(cache.get('-1')).toBe(null);
      expect(cache.get('-2')).toBe(-2);
      expect(cache.get('not a number')).toBe('not a number');
    });
    it('access queue with gets', function () {
      var cache = geo.tileCache({size: 2});

      cache.add(-1);
      cache.add(-2);
      cache.add(-3);

      cache.get(-2);
      cache.add(-4);
      expect(cache.get('-3')).toBe(null);

      cache.size = 3;
      cache.add(-5);
      cache.get(-4);
      cache.add(-6);
      expect(cache.get('-2')).toBe(null);
      expect(cache.get('-5')).toBe(-5);
      expect(cache.get('-4')).toBe(-4);
      expect(cache.get('-6')).toBe(-6);

      cache.size = 1;
      expect(cache.get('-4')).toBe(null);
      expect(cache.get('-6')).toBe(-6);
    });
  });

  it('cache.clear', function () {
    var cache = geo.tileCache({size: 2});

    cache.add(1);
    cache.add(2);
    expect(cache.length).toBe(2);

    cache.clear();
    expect(cache.length).toBe(0);

    cache.add(1);
    cache.add(2);
    cache.size = 1;
    expect(cache.length).toBe(1);

    cache.clear();
    expect(cache.length).toBe(0);
  });

  it('cache.remove', function () {
    var cache = geo.tileCache({size: 2});

    cache.add(1);
    cache.add(2);
    expect(cache.length).toBe(2);

    cache.remove('2');
    expect(cache.length).toBe(1);
    expect(cache.get('1')).toBe(1);
    expect(cache.get('2')).toBe(null);

    cache.remove('1');
    expect(cache.length).toBe(0);
    expect(cache.get('1')).toBe(null);
    expect(cache.get('2')).toBe(null);
  });
  it('cache.purge', function () {
    var cache = geo.tileCache({size: 2});

    cache.add(1, undefined, true);
    cache.add(2, undefined, true);
    expect(cache.length).toBe(2);
    cache.add(3, undefined, true);
    expect(cache.length).toBe(3);
    cache.remove(3);
    expect(cache.length).toBe(2);
    cache.add(4, undefined, true);
    expect(cache.length).toBe(3);
    cache.purge();
    expect(cache.length).toBe(2);
    cache.add(5);
    expect(cache.length).toBe(2);
  });
  it('cache.purge removeFunc', function () {
    var cache = geo.tileCache({size: 2});
    var removalInfo = [];
    var removeFunc = function (item) {
      removalInfo.push(item);
    };
    cache.add(1, removeFunc);
    cache.add(2, removeFunc);
    cache.add(3, removeFunc);
    expect(removalInfo.length).toBe(1);
    expect(removalInfo[0]).toBe(1);
    cache.add(4, removeFunc, true);
    expect(removalInfo.length).toBe(1);
    cache.purge();
    expect(removalInfo.length).toBe(1);
    cache.add(5);
    expect(removalInfo.length).toBe(1);
    cache.add(6, removeFunc, true);
    expect(removalInfo.length).toBe(1);
    cache.purge(removeFunc);
    expect(removalInfo.length).toBe(2);
    expect(removalInfo[1]).toBe(4);
  });
});
