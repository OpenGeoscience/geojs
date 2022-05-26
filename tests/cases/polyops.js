var $ = require('jquery');
var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var destroyMap = require('../test-utils').destroyMap;
var mockWebglRenderer = geo.util.mockWebglRenderer;
var restoreWebglRenderer = geo.util.restoreWebglRenderer;

describe('geo.util.polyops', function () {
  'use strict';

  var polytests = {
    flat: {
      from: [[0, 1], [2, 3], [4, 5]],
      to: [[[[0, 1], [2, 3], [4, 5]]]]
    },
    object: {
      from: [{x: 0, y: 1}, {x: 2, y: 3}, {x: 4, y: 5}],
      to: [[[[0, 1], [2, 3], [4, 5]]]]
    },
    'flat-list': {
      from: [[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]],
      to: [[[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]]]
    },
    'object-list': {
      from: [[{x: 0, y: 1}, {x: 2, y: 3}, {x: 4, y: 5}], [{x: 6, y: 7}, {x: 8, y: 9}, {x: 10, y: 11}]],
      to: [[[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]]]
    },
    'flat-listlist': {
      from: [[[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]],
        [[[12, 13], [14, 15], [16, 17]], [[18, 19], [20, 21], [22, 23]]]],
      to: [[[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]], [[[12, 13], [14, 15], [16, 17]], [[18, 19], [20, 21], [22, 23]]]]
    },
    'object-listlist': {
      from: [[[{x: 0, y: 1}, {x: 2, y: 3}, {x: 4, y: 5}], [{x: 6, y: 7}, {x: 8, y: 9}, {x: 10, y: 11}]],
        [[{x: 12, y: 13}, {x: 14, y: 15}, {x: 16, y: 17}], [{x: 18, y: 19}, {x: 20, y: 21}, {x: 22, y: 23}]]],
      to: [[[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]], [[[12, 13], [14, 15], [16, 17]], [[18, 19], [20, 21], [22, 23]]]]
    },
    'flat-listlist-outer': {
      from: {outer: [[0, 1], [2, 3], [4, 5]], inner: [[[6, 7], [8, 9], [10, 11]]]},
      to: [[[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]]]
    },
    'object-listlist-outer': {
      from: {outer: [{x: 0, y: 1}, {x: 2, y: 3}, {x: 4, y: 5}], inner: [[{x: 6, y: 7}, {x: 8, y: 9}, {x: 10, y: 11}]]},
      to: [[[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]]]
    },
    'flat-listlist-outer-list': {
      from: [{outer: [[0, 1], [2, 3], [4, 5]], inner: [[[6, 7], [8, 9], [10, 11]]]},
        {outer: [[12, 13], [14, 15], [16, 17]], inner: [[[18, 19], [20, 21], [22, 23]]]}],
      to: [[[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]], [[[12, 13], [14, 15], [16, 17]], [[18, 19], [20, 21], [22, 23]]]]
    },
    'object-listlist-outer-list': {
      from: [{outer: [{x: 0, y: 1}, {x: 2, y: 3}, {x: 4, y: 5}], inner: [[{x: 6, y: 7}, {x: 8, y: 9}, {x: 10, y: 11}]]},
        {outer: [{x: 12, y: 13}, {x: 14, y: 15}, {x: 16, y: 17}], inner: [[{x: 18, y: 19}, {x: 20, y: 21}, {x: 22, y: 23}]]}],
      to: [[[[0, 1], [2, 3], [4, 5]], [[6, 7], [8, 9], [10, 11]]], [[[12, 13], [14, 15], [16, 17]], [[18, 19], [20, 21], [22, 23]]]]
    }
  };

  describe('toPolygonList and fromPolygonList', function () {
    $.each(polytests, function (key, value) {
      it(key, function () {
        const mode = {};
        const res = geo.util.polyops.toPolygonList(value.from, mode);
        expect(mode.style).toEqual(key);
        expect(res).toEqual(value.to);
        const back = geo.util.polyops.fromPolygonList(res, mode);
        expect(back).toEqual(value.from);
      });
    });
  });

  describe('toPolygonList', function () {
    it('empty list', function () {
      expect(geo.util.polyops.toPolygonList([])).toEqual([]);
    });
  });

  var opTests = [{
    a: [[0, 0], [10, 0], [10, 10], [0, 10]],
    b: [[5, 0], [15, 0], [15, 5], [5, 5]],
    union: {out: [[10, 5], [10, 10], [0, 10], [0, 0], [15, 0], [15, 5]], ca: [[0]], cb: [[0]]},
    difference: {out: [[0, 10], [0, 0], [5, 0], [5, 5], [10, 5], [10, 10]], ca: [[0]], cb: [[0]]},
    intersect: {out: [[5, 5], [5, 0], [10, 0], [10, 5]], ca: [undefined], cb: [[0]]},
    xor: {out: [[10, 5], [10, 10], [0, 10], [0, 0], [5, 0], [5, 5], [10, 5], [10, 0], [15, 0], [15, 5]], ca: [[0]], cb: [[0]]}
  }, {
    a: [[0, 0], [10, 0], [10, 10], [0, 10]],
    b: [[5, 0], [15, 0], [15, 10], [5, 10]],
    union: {out: [[0, 10], [0, 0], [15, 0], [15, 10]], ca: [[0]], cb: [[0]]},
    difference: {out: [[0, 10], [0, 0], [5, 0], [5, 10]], ca: [[0]], cb: [[0]]},
    intersect: {out: [[5, 10], [5, 0], [10, 0], [10, 10]], ca: [[0]], cb: [[0]]},
    xor: {out: [[[[0, 10], [0, 0], [5, 0], [5, 10]]], [[[10, 10], [10, 0], [15, 0], [15, 10]]]], ca: [[0, 1]], cb: [[0, 1]]}
  }, {
    a: [[0, 0], [10, 0], [10, 10], [0, 10]],
    b: [[10, 0], [20, 0], [20, 10], [10, 10]],
    union: {out: [[0, 10], [0, 0], [20, 0], [20, 10]], ca: [[0]], cb: [[0]]},
    difference: {out: [[0, 10], [0, 0], [10, 0], [10, 10]], ca: [[0]], cb: [[0]]},
    intersect: {out: undefined, ca: [undefined], cb: [undefined]},
    xor: {out: [[0, 10], [0, 0], [20, 0], [20, 10]], ca: [[0]], cb: [[0]]}
  }, {
    a: [[0, 0], [10, 0], [10, 10], [0, 10]],
    b: [[15, 0], [25, 0], [25, 10], [15, 10]],
    union: {out: [[[[0, 10], [0, 0], [10, 0], [10, 10]]], [[[15, 10], [15, 0], [25, 0], [25, 10]]]], ca: [[0]], cb: [[1]]},
    difference: {out: [[0, 10], [0, 0], [10, 0], [10, 10]], ca: [[0]], cb: [undefined]},
    intersect: {out: undefined, ca: [undefined], cb: [undefined]},
    xor: {out: [[[[0, 10], [0, 0], [10, 0], [10, 10]]], [[[15, 10], [15, 0], [25, 0], [25, 10]]]], ca: [[0]], cb: [[1]]}
  }, {
    a: [[0, 0], [10, 0], [10, 10], [0, 10]],
    b: [[4, 4], [6, 4], [6, 6], [4, 6]],
    union: {out: [[0, 10], [0, 0], [10, 0], [10, 10]], ca: [[0]], cb: [undefined]},
    difference: {out: [[[0, 10], [0, 0], [10, 0], [10, 10]], [[6, 6], [6, 4], [4, 4], [4, 6]]], ca: [[0]], cb: [[0]]},
    intersect: {out: [[4, 6], [4, 4], [6, 4], [6, 6]], ca: [undefined], cb: [[0]]},
    xor: {out: [[[0, 10], [0, 0], [10, 0], [10, 10]], [[6, 6], [6, 4], [4, 4], [4, 6]]], ca: [[0]], cb: [[0]]}
  }, {
    a: [[0, 0], [10, 0], [10, 10], [0, 10]],
    b: [[-2, -2], [12, -2], [12, 12], [-2, 12]],
    union: {out: [[-2, 12], [-2, -2], [12, -2], [12, 12]], ca: [undefined], cb: [[0]]},
    difference: {out: undefined, ca: [undefined], cb: [undefined]},
    intersect: {out: [[0, 10], [0, 0], [10, 0], [10, 10]], ca: [[0]], cb: [undefined]},
    xor: {out: [[[-2, 12], [-2, -2], [12, -2], [12, 12]], [[10, 10], [10, 0], [0, 0], [0, 10]]], ca: [[0]], cb: [[0]]}
  }];

  describe('general operations', function () {
    ['union', 'difference', 'intersect', 'xor'].forEach((op) => {
      describe(op, function () {
        opTests.forEach((test) => {
          it(JSON.stringify(test.a) + ' and ' + JSON.stringify(test.b), function () {
            const opts = {correspond: {}};
            let out = geo.util.polyops[op](test.a, test.b, opts);
            expect(out).toEqual(test[op].out);
            expect(opts.correspond.poly1).toEqual(test[op].ca);
            expect(opts.correspond.poly2).toEqual(test[op].cb);

            opts.poly1 = test.a;
            opts.poly2 = test.b;
            out = geo.util.polyops[op](opts);
            expect(out).toEqual(test[op].out);
          });
        });
      });
    });
  });

  var polygonOps = [{
    op: 'union', len: [[8, 4]]
  }, {
    op: 'difference', len: [[4], [8]]
  }, {
    op: 'intersect', len: [[8]]
  }, {
    op: 'xor', len: [[20]]
  }];

  describe('with polygonFeature', function () {
    polygonOps.forEach((test) => {
      it(test.op, function () {
        mockWebglRenderer();
        const map = createMap();
        const layer = map.createLayer('feature', {renderer: 'webgl'});
        const poly1 = geo.polygonFeature.create(layer);
        const poly2 = geo.polygonFeature.create(layer);
        const poly3 = geo.polygonFeature.create(layer);

        poly1.style({polygon: (d) => ({outer: d[0], inner: d.slice(1)})});
        poly1.data([[
          [[-1.1, 50.7], [-1.3, 50.7], [-1.3, 50.9], [-1.1, 50.9]]
        ]]);
        poly2.style({polygon: (d) => ({outer: d[0], inner: d.slice(1)})});
        poly2.data([[
          [[-1.2, 50.75], [-1.4, 50.75], [-1.4, 50.85], [-1.2, 50.85]],
          [[-1.25, 50.78], [-1.35, 50.78], [-1.35, 50.82], [-1.25, 50.82]]
        ]]);

        geo.util.polyops[test.op](poly1, poly2, {style: poly3});

        const d = poly3.data();
        expect(d.length).toEqual(test.len.length);
        test.len.forEach((val, idx) => {
          expect(d[idx].length).toEqual(val.length);
          val.forEach((val2, idx2) => {
            expect(d[idx][idx2].length).toEqual(val2);
          });
        });

        destroyMap();
        restoreWebglRenderer();
      });
    });
  });

  var annotationOps = [{
    op: 'union',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'exact',
    len: [[16, 3]]
  }, {
    op: 'difference',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'exact',
    len: [[3, 3], [11], [4]]
  }, {
    op: 'intersect',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'exact',
    len: [[6], [4]]
  }, {
    op: 'xor',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'exact',
    len: [[11], [15, 3]]
  }, {
    op: 'union',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'all',
    len: [[4], [3, 3], [12], [16, 3]]
  }, {
    op: 'difference',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'all',
    len: [[4], [3, 3], [12], [11], [3, 3], [4]]
  }, {
    op: 'intersect',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'all',
    len: [[4], [3, 3], [12], [6], [4]]
  }, {
    op: 'xor',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'all',
    len: [[4], [3, 3], [12], [11], [15, 3]]
  }, {
    op: 'union',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'none',
    len: [[16, 3]]
  }, {
    op: 'difference',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'none',
    len: [[11], [3, 3], [4]]
  }, {
    op: 'intersect',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'none',
    len: [[6], [4]]
  }, {
    op: 'xor',
    poly2: [[2, 2], [8, 2], [8, 8], [2, 8]],
    keep: 'none',
    len: [[11], [15, 3]]
  }, {
    op: 'union',
    poly2: [[6, 6], [6, 4], [8, 4], [8, 6]],
    keep: 'exact',
    len: [[4], [3, 3], [12]]
  }, {
    op: 'difference',
    poly2: [[6, 6], [6, 4], [8, 4], [8, 6]],
    keep: 'exact',
    len: [[3, 3], [12], [6]]
  }, {
    op: 'intersect',
    poly2: [[6, 6], [6, 4], [8, 4], [8, 6]],
    keep: 'exact',
    len: [[4]]
  }, {
    op: 'xor',
    poly2: [[6, 6], [6, 4], [8, 4], [8, 6]],
    keep: 'exact',
    len: [[3, 3], [12], [6]]
  }];

  describe('with annotationLayer', function () {
    annotationOps.forEach((test) => {
      it(test.op + ' keep ' + test.keep + ' poly ' + JSON.stringify(test.poly2), function () {
        mockWebglRenderer();
        const map = createMap();
        map.gcs('+proj=longlat +axis=esu');
        map.ingcs('+proj=longlat +axis=esu');
        const layer = map.createLayer('annotation', {renderer: 'webgl'});
        layer.geojson({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[6, 6], [12, 6], [12, 2], [6, 2], [6, 6]]]
            },
            properties: {
              annotationType: 'rectangle',
              annotationId: 1
            }
          }, {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 6], [4, 6], [4, 0], [0, 0], [0, 6]]]
            },
            properties: {
              annotationType: 'ellipse',
              annotationId: 2
            }
          }, {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[2, 8], [8, 8], [5, 13], [2, 8]], [[3, 9], [7, 9], [5, 12], [3, 9]]]
            },
            properties: {
              annotationType: 'polygon',
              annotationId: 3
            }
          }]
        });
        const opts = {correspond: {}, keepAnnotations: test.keep, style: layer};
        geo.util.polyops[test.op](layer, test.poly2, opts);
        const polys = layer.toPolygonList();
        const match = polys.map((p, pi) => p.map((h, hi) => h.length));
        expect(match).toEqual(test.len);

        destroyMap();
        restoreWebglRenderer();
      });
    });
  });
});
