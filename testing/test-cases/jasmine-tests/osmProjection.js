/*global describe, it, expect, geo, xit*/

describe('osm projection', function () {
  'use strict';

  var map, width = 800, height = 800;

  it('Setup map', function () {
    // create an osm map layer
    map = geo.map({
      'node': '#map',
      'center': [0, 0],
      'zoom': 1
    });
    map.createLayer('osm');
    map.resize(0, 0, width, height);
    map.draw();
  });

  // make sure georeferencing operators are 
  // inverses of each other for several points
  describe('Invert georeference', function () {
  
    var pts = [
      [0, 0], [200, 0], [-300, 0],
      [0, 400], [0, -500], [100, 600],
      [-300, 600], [-600, 500]
    ];

    pts.forEach(function (pt) {
      var d = {x: pt[0], y: pt[1]};

      it('(' + pt.join() + ')', function () {
        var g, d0;
        
        g = map.displayToGcs(d);
        d0 = map.gcsToDisplay(g);

        expect(d0.x).toBeCloseTo(d.x, 0);
        expect(d0.y).toBeCloseTo(d.y, 0);
      });
    });

  });

  describe('Call and return types', function () {

    var obj1, obj2;

    it('gcsToDisplay ( geo.latlng )', function () {
      obj1 = map.gcsToDisplay(geo.latlng(0, 0));
      expect(typeof obj1).toBe('object');
      expect(Number.isFinite(obj1.x)).toBe(true);
      expect(Number.isFinite(obj1.y)).toBe(true);
    });
 
    it('gcsToDisplay ( object )', function () {
      var obj;
      obj = map.gcsToDisplay({x: 0, y: 0});
      expect(obj).toEqual(obj1);
    });
    
    // currently doesn't work
    xit('gcsToDisplay ( [geo.latlng] )', function () {
      var arr;
      arr = map.gcsToDisplay([geo.latlng(0, 0)]);
      expect(Array.isArray(arr)).toBe(true);
      expect(typeof arr[0]).toBe('object');
      expect(arr[0].x).toBeCloseTo(obj1.x, 6);
      expect(arr[0].y).toBeCloseTo(obj1.y, 6);
    });
    
    // currently doesn't work
    xit('gcsToDisplay ( [geo.latlng, ... , geo.latlng] )', function () {
      var arr = [], N = 10, i;

      for (i = 0; i < N; i += 1) {
        arr.push(geo.latlng(0, 0));
      }

      arr = map.gcsToDisplay(arr);

      expect(Array.isArray(arr)).toBe(true);

      for (i = 0; i < N; i += 1) {
        expect(typeof arr[i]).toBe('object');
        expect(arr[i].x).toBeCloseTo(obj1.x, 6);
        expect(arr[i].y).toBeCloseTo(obj1.y, 6);
      }
    });

    // currently doesn't work
    xit('gcsToDisplay ( [object] )', function () {
      var arr;
      arr = map.gcsToDisplay([{x: 0, y: 0}]);
      expect(Array.isArray(arr)).toBe(true);
      expect(typeof arr[0]).toBe('object');
      expect(arr[0].x).toBeCloseTo(obj1.x, 6);
      expect(arr[0].y).toBeCloseTo(obj1.y, 6);
    });
 
    // currently doesn't work
    xit('gcsToDisplay ( [object, ... , object] )', function () {
      var arr = [], N = 10, i;

      for (i = 0; i < N; i += 1) {
        arr.push({x: 0, y: 0});
      }

      arr = map.gcsToDisplay(arr);

      expect(Array.isArray(arr)).toBe(true);

      for (i = 0; i < N; i += 1) {
        expect(typeof arr[i]).toBe('object');
        expect(arr[i].x).toBeCloseTo(obj1.x, 6);
        expect(arr[i].y).toBeCloseTo(obj1.y, 6);
      }
    });

    it('displayToGcs ( object )', function () {
      obj2 = map.displayToGcs({x: 400, y: 400});
      expect(typeof obj2).toBe('object');
      expect(Number.isFinite(obj2.x)).toBe(true);
      expect(Number.isFinite(obj2.y)).toBe(true);
    });
    
    it('displayToGcs ( [object] )', function () {
      var arr;
      arr = map.displayToGcs([{x: 400, y: 400}]);
      expect(Array.isArray(arr)).toBe(true);
      expect(typeof arr[0]).toBe('object');
      expect(arr[0].x).toBeCloseTo(obj2.x, 6);
      expect(arr[0].y).toBeCloseTo(obj2.y, 6);
    });
    
    it('displayToGcs ( [object, ... , object] )', function () {
      var arr = [], N = 10, i;

      for (i = 0; i < N; i += 1) {
        arr.push({x: 400, y: 400});
      }

      arr = map.displayToGcs(arr);

      expect(Array.isArray(arr)).toBe(true);

      for (i = 0; i < N; i += 1) {
        expect(typeof arr[i]).toBe('object');
        expect(arr[i].x).toBeCloseTo(obj2.x, 6);
        expect(arr[i].y).toBeCloseTo(obj2.y, 6);
      }
    });
  });
});
