var PolyBool = require('polybooljs');
var geo_map = require('../map');
var util = require('../util/common');

/**
 * A list of flat polygon lists.
 *
 * @typedef {Array.<Array.<Array.<geo.geoPositionFlat>>>} geo.polygonList
 */

/**
 * A polygon in any of a variety of formats.
 *
 * This can be any object with a ``toPolygonList`` and ``fromPolygonList``
 * method.
 *
 * @typedef {geo.polygonFlat|Array.<geo.polygonFlat>|Array.<Array.<geo.polygonFlat>>|geo.polygonObject|Array.<geo.polygonObject>|Array.<geo.geoPositionFlat>|Array.<Array.<geo.geoPositionFlat>>|geo.polygonList|object} geo.polygonAny
 */

/**
 * Object specification for polygon operation options.
 *
 * @typedef {object} geo.util.polyop.spec
 * @property {geo.polygonAny} [poly1] The first polygon set to operate on.
 * @property {geo.polygonAny} [poly2] The second polygon set to operate on.
 * @property {number} [epsilon1] A precision value to use when computing the
 *   operation.  If not specified, this is computed from the range of values in
 *   ``poly1``.  It is used for processing ``poly1`` and the general operation.
 * @property {number} [epsilon1] A precision value to use when processing
 *   ``poly2``.  If not specified, this is computed from the range of values in
 *   ``poly2``.
 * @property {string|object} [style] If specified, the preferred output style.
 *   This can be (flat|object)[-list[list[-outer[-list]]]].  If an object,
 *   the object must have a method ``fromPolygonList``.
 * @property {string|geo.transform} [ingcs] The default coordinate
 *   system of the source polygon coordinates.  If not specified , this is
 *   taken from the feature first or the map second if either is available.
 * @property {string|geo.transform} [gcs] The default coordinate system to use
 *   for the actual operations.  This is where the epsilon and rdp values are
 *   applied.  If not specified , this is taken from the map second if
 *   available.
 * @property {geo.map} [map] Used for ``ingcs`` and ``gcs`` if needed.
 * @property {string} [innerOperation="union"] one of union, intersect, xor.
 *   Used to combine individual polygons in each of ``poly1`` and ``poly2``
 *   before the main operation is carried out.
 * @property {object} [correspond] If present, information about the
 *   correspondence of the input and output polygons is added to this object.
 *   This is of the form {poly1: [idx...], poly2: [idx...], exact1: [idx...],
 *   exact2: [idx...]}, where the [idx...] array is the length of the input
 *  polygon array and each entry is either undefined or contains a list of
 *   indices of corresponding output polygons.  Exact means that all of the
 *   points in the input polygon are in the output polygon.  Multiple inputs
 *   can refer to the same output.
 * @property {number} [tolerance] A tolerance value to pass to features,
 *   annotations, or other object-based polygon generators to specify how
 *   closely non-polygons are converted to polygons.  This is in the feature's
 *   gcs coordinate system.
 * @property {number} [pixelTolerance] A tolerance value to pass to features,
 *   annotations, or other object-based polygon generators to specify how
 *   closely non-polygons are converted to polygons.  This is interpreted in
 *   the feature's map's display coordinates.
 */

const AlternateOpNames = {
  '+': 'union',
  '|': 'union',
  add: 'union',
  '-': 'difference',
  sub: 'difference',
  subtract: 'difference',
  minus: 'difference',
  '*': 'intersect',
  '&': 'intersect',
  mul: 'intersect',
  multiply: 'intersect',
  x: 'xor',
  '^': 'xor'
};

/**
 * Convert a segment list to a polygon list.
 *
 * @param {object[]} seglist A PolyBool segment list.
 * @returns {geo.polygonList|undefined} A polygon list.
 */
function seglistToPolygonList(seglist) {
  // This single line doesn't arrange holes correctly
  // return seglist.map((s) => PolyBool.polygon(s).regions);
  /* This uses PolyBools' operations (mostly), but is much slower than needed
   * since it goes through geojson.
  const polys = [];
  seglist.forEach((s) => {
    const geojson = PolyBool.polygonToGeoJSON(PolyBool.polygon(s));
    if (geojson.type === 'MultiPolygon') {
      geojson.coordinates.forEach((p) => {
        polys.push(p.map((h) => h.slice(0, h.length - 1)));
      });
    } else if (geojson.type === 'Polygon') {
      polys.push(geojson.coordinates.map((h) => h.slice(0, h.length - 1)));
    }
  });
  return polys;
   */
  const polys = []; // end result
  const borders = []; // polygons in format needed for util.pointInPolygon
  const regions = []; // polygons in end result format
  const parents = []; // list of parents of each polygon
  seglist.forEach((s) => PolyBool.polygon(s).regions.forEach((r) => {
    const border = r.map((pt) => ({x: pt[0], y: pt[1]}));
    if (border.length < 3) {
      return;
    }
    parents.push([]);
    borders.forEach((b, i) => {
      if (util.pointInPolygon(border[0], b)) {
        parents[borders.length].push(i);
      } else if (util.pointInPolygon(b[0], border)) {
        parents[i].push(borders.length);
      }
    });
    regions.push(r);
    borders.push(border);
  }));
  /* find nested polygons */
  const dest = Array(regions.length);
  let used = 0;
  while (used < regions.length) {
    for (let i = 0; i < regions.length; i += 1) {
      if (dest[i] === undefined && !parents[i].length) {
        dest[i] = polys.length;
        /* reverse the outer polygons for consistency with how PolyBool
         * generates geojson */
        polys.push([regions[i].reverse()]);
        used += 1;
      }
    }
    for (let i = 0; i < regions.length; i += 1) {
      if (dest[i] === undefined && parents[i].length === 1 && dest[parents[i][0]] !== undefined) {
        polys[dest[parents[i][0]]].push(regions[i]);
        dest[i] = dest[parents[i][0]];
        used += 1;
      }
    }
    for (let i = 0; i < regions.length; i += 1) {
      parents[i] = parents[i].filter((d) => dest[d] === undefined);
    }
  }
  return polys.length ? polys : [[]];
}

/**
 * Perform an boolean operation on a seglist from polygons.
 *
 * @param {string} op One of 'union', 'intersect', or other value PolyBool
 *      supports.
 * @param {number} epsilon Precision for calculations.  In degrees, 1e-9 is
 *      around 0.11 mm in ground distance.
 * @param {object} seglist A seglist array as used by the polybool library.
 * @returns {object} A seglist array.
 */
function polygonOperationSeglist(op, epsilon, seglist) {
  op = 'select' + op.charAt(0).toUpperCase() + op.slice(1);
  PolyBool.epsilon(epsilon);

  while (seglist.length > 1) {
    const newlist = [];
    const half = Math.ceil(seglist.length / 2);
    for (let i = 0; i < half; i += 1) {
      let segments = seglist[i];
      if (i + half < seglist.length) {
        let nextseg = seglist[i + half];
        try {
          segments = PolyBool.combine(segments, nextseg);
        } catch (err) {
          segments = PolyBool.segments(PolyBool.polygon(segments));
          nextseg = PolyBool.segments(PolyBool.polygon(nextseg));
          for (let j = 20; j >= 6; j -= 1) {
            PolyBool.epsilon(Math.pow(0.1, j));
            try {
              segments = PolyBool.combine(segments, nextseg);
              break;
            } catch (err) {}
          }
          PolyBool.epsilon(epsilon);
        }
        if (segments.combined) {
          segments.combined = segments.combined.filter(s => Math.abs(s.start[0] - s.end[0]) > epsilon || Math.abs(s.start[1] - s.end[1]) > epsilon);
          segments = PolyBool[op](segments);
        } else {
          console.warn('Failed in polygon functions.');
        }
        segments.segments = segments.segments.filter(s => Math.abs(s.start[0] - s.end[0]) > epsilon || Math.abs(s.start[1] - s.end[1]) > epsilon);
      }
      newlist.push(segments);
    }
    seglist = newlist;
  }
  return seglist;
}

/**
 * Convert a polygon in any of several formats to a polygon list.  Each polygon
 * in the list is a list of polylines.  Each polyline is a list of points.
 * Each point is a list of two coordinates.  The input can be a variety of
 * formats:
 *   - object, flat: a list of {x, y} or [x, y]
 *   - object-list, flat-list: a list of lists of {x, y} or [x, y]
 *   - object-listlist, flat-listlist: a list if lists of lists of {x, y} or
 *     [x, y]
 *   - object-listlist-outer, flat-listlist-outer: {outer: {x, y}, inner:
 *     [{x, y}]} or {outer: [x, y], inner: [[x, y]]}
 *   - object-listlist-outer-list, flat-listlist-outer-list: a list of objects
 *     in outer/inner object or outer/inner list form
 * The actual format is stored in the mode object.
 *
 * @param {geo.polygonAny} poly A polygon in one of the above formats to
 *   convert.
 * @param {object} mode An object that is modified with information about
 *   the conversion.  This includes style: the input polygon format; min: a
 *   2-item list with minimum values in x, y; max: a 2-item list with
 *   maximum values in x, y; epsilon: a recommended value for epsilon in other
 *   functions.
 * @param {geo.util.polyop.spec} [opts] Options for the operation.  Only used
 *    if poly is an object with a toPolygonList method.
 * @returns {geo.polygonList} A list of polygons.
 */
function toPolygonList(poly, mode, opts) {
  mode = mode || {};

  if (poly.toPolygonList) {
    mode.style = poly;
    poly = poly.toPolygonList(opts);
    if (!poly.length) {
      mode.min = mode.max = [0, 0];
      mode.epsilon = 1e-10;
      return poly;
    }
  } else {
    mode.style = '';
    if (poly.outer) {
      mode.style = '-outer';
      poly = [[poly.outer, ...(poly.inner || [])]];
    } else if (poly.length && poly[0].outer) {
      mode.style = '-outer-list';
      poly = poly.map((p) => [p.outer, ...(p.inner || [])]);
    }
    if (!poly.length) {
      mode.style = 'flat-listlist' + mode.style;
      mode.min = mode.max = [0, 0];
      mode.epsilon = 1e-10;
      return poly;
    }
    if (poly[0].x !== undefined) {
      mode.style = 'object';
      poly = [[poly.map((pt) => [pt.x, pt.y])]];
    } else if (poly[0][0].x !== undefined) {
      mode.style = 'object-list' + mode.style;
      poly = [poly.map((p) => p.map((pt) => [pt.x, pt.y]))];
    } else if (poly[0][0][0] === undefined) {
      mode.style = 'flat';
      poly = [[poly]];
    } else if (poly[0][0][0].x !== undefined) {
      mode.style = 'object-listlist' + mode.style;
      poly = poly.map((p) => p.map((l) => l.map((pt) => [pt.x, pt.y])));
    } else if (poly[0][0][0][0] === undefined) {
      mode.style = 'flat-list';
      poly = [poly];
    } else {
      mode.style = 'flat-listlist' + mode.style;
    }
  }
  mode.min = [poly[0][0][0][0], poly[0][0][0][1]];
  mode.max = [poly[0][0][0][0], poly[0][0][0][1]];
  poly.forEach((p) => p.forEach((l) => l.forEach((pt) => {
    if (pt[0] < mode.min[0]) { mode.min[0] = pt[0]; }
    if (pt[0] > mode.max[0]) { mode.max[0] = pt[0]; }
    if (pt[1] < mode.min[1]) { mode.min[1] = pt[1]; }
    if (pt[1] > mode.max[1]) { mode.max[1] = pt[1]; }
  })));
  mode.epsilon = Math.max(Math.max(mode.max[0], mode.max[1]), Math.max(Math.abs(mode.min[0]), Math.abs(mode.min[1]))) * 1e-10;
  return poly;
}

/**
 * Convert a polygon list to another format.
 *
 * @param {geo.polygonList} poly A list of polygons.
 * @param {object} mode An object that is modified with information about the
 *   conversion.  This includes style: the input polygon format; min: a 2-item
 *   list with minimum values in x, y; max: a 2-item list with maximum values
 *   in x, y; epsilon: a recommended value for epsilon in other functions.
 * @param {geo.util.polyop.spec} [opts] Options for the operation.  Only used
 *    if ``mode.style`` is an object with a fromPolygonList method.
 * @returns {geo.polygonAny} A polygon in one of several formats.
 */
function fromPolygonList(poly, mode, opts) {
  if (mode.style.fromPolygonList) {
    return mode.style.fromPolygonList(poly, opts);
  }
  if (mode.style.includes('object')) {
    poly = poly.map((p) => p.map((h) => h.map((pt) => ({x: pt[0], y: pt[1]}))));
  }
  if (mode.style.includes('outer')) {
    poly = [poly.map((p) => ({outer: p[0], inner: p.slice(1)}))];
  }
  if (!mode.style.endsWith('listlist')) {
    if (mode.style.endsWith('list')) {
      poly = poly[0];
    } else {
      poly = poly[0][0];
    }
  }
  return poly;
}

/**
 * Use a minimum style for output to include all of the results.
 *
 * @param {geo.polygonList} polylist A list of polygons.
 * @param {string} style the proposed style.
 * @returns {string} The preferred style.
 */
function minimumPolygonStyle(polylist, style) {
  if (style.fromPolygonList) {
    return style;
  }
  if (polylist.length > 1) {
    if (style.includes('outer')) {
      return style + (style.endsWith('list') ? '' : '-list');
    }
    if (style.endsWith('listlist')) {
      return style;
    }
    return style + (style.endsWith('list') ? 'list' : '-listlist');
  }
  if (polylist.length === 1 && polylist[0].length > 1) {
    if (style.includes('outer') || style.endsWith('list')) {
      return style;
    }
    return style + '-list';
  }
  return style;
}

/**
 * Generate the correspondence between the source polygons and the output
 * polygons.  A polygon corresponds if it has at least two points in common.
 *
 * @param {geo.polygonList} poly1 First set of source polygons.
 * @param {geo.polygonList} poly2 Second set of source polygons.
 * @param {geo.polygonList} newpoly Output polygons.
 * @param {object} results An object to add results to.
 */
function generateCorrespondence(poly1, poly2, newpoly, results) {
  const pts = {};
  const counts = [];

  newpoly.forEach((p, idx) => p.forEach((h) => h.forEach((pt) => {
    const key = '_' + pt[0] + '_' + pt[1];
    if (pts[key]) {
      if (pts[key].indexOf(idx) === -1) {
        pts[key].push(idx);
      }
    } else {
      pts[key] = [idx];
    }
    if (counts.length <= idx) {
      counts.push(0);
    }
    counts[idx] += 1;
  })));
  ['poly1', 'poly2'].forEach((pkey) => {
    const poly = pkey === 'poly1' ? poly1 : poly2;
    const ekey = pkey === 'poly1' ? 'exact1' : 'exact2';
    results[pkey] = Array(poly.length);
    results[ekey] = Array(poly.length);
    poly.forEach((p, idx) => {
      const found = {};
      let missed = 0;
      p.forEach((h) => h.forEach((pt) => {
        const key = '_' + pt[0] + '_' + pt[1];
        if (pts[key]) {
          pts[key].forEach((val) => {
            found[val] = (found[val] || 0) + 1;
          });
        } else {
          missed += 1;
        }
      }));
      Object.keys(found).forEach((nidx) => {
        if (found[nidx] === counts[+nidx] && !missed && p.length === newpoly[+nidx].length) {
          if (!results[ekey][idx]) {
            results[ekey][idx] = [];
          }
          results[ekey][idx].push(+nidx);
        }
        if (found[nidx] >= 2) {
          if (!results[pkey][idx]) {
            results[pkey][idx] = [];
          }
          results[pkey][idx].push(+nidx);
        }
      });
    });
  });
}

/**
 * Perform a general operation of a set of polygons.
 *
 * @param {string} op The operation to handle.  One of union, intersect,
 *    difference, or xor.
 * @param {geo.polygonAny|geo.util.polyop.spec} poly1 Either the first polygon
 *    set or an object containing all parameters for the function.
 * @param {geo.polygonAny} [poly2] If the poly1 parameter is not a complete
 *    options object, the second polygon set for the operation.
 * @param {geo.util.polyop.spec} [opts] If the poly1 parameter is not a
 *    complete options object, the options for the operation.
 * @returns {geo.polygonAny} A polygon set in the same style as poly1.
 */
function generalOperationProcess(op, poly1, poly2, opts) {
  var transform = require('../transform');

  op = AlternateOpNames[op] || op;
  if (poly1.poly1) {
    opts = poly1;
    poly1 = opts.poly1;
    poly2 = opts.poly2;
  }
  opts = opts || {};
  const ingcs1 = opts.ingcs || (
    opts.map ? opts.map.ingcs() : (
      poly1.gcs ? poly1.gcs() : (
        poly1.layer && poly1.layer().gcs ? poly1.layer().gcs() : (
          poly1.layer ? poly1.layer().map().ingcs() : (
            poly1.map instanceof geo_map ? poly1.map().ingcs() : undefined)))));
  const ingcs2 = opts.ingcs || (
    opts.map ? opts.map.ingcs() : (
      poly2.gcs ? poly2.gcs() : (
        poly2.layer && poly2.layer().gcs ? poly2.layer().gcs() : (
          poly2.layer ? poly2.layer().map().ingcs() : (
            poly2.map instanceof geo_map ? poly2.map().ingcs() : ingcs1)))));
  const gcs = opts.gcs || (
    opts.map ? opts.map.gcs() : (
      poly1.layer ? poly1.layer().map().gcs() : (
        poly1.map instanceof geo_map ? poly1.map().gcs() : undefined)));
  const mode1 = {};
  const mode2 = {};
  poly1 = toPolygonList(poly1, mode1, opts);
  poly2 = toPolygonList(poly2, mode2, opts);
  mode1.epsilon = opts.epsilon1 || mode1.epsilon;
  mode2.epsilon = opts.epsilon2 || mode1.epsilon;
  if (ingcs1 && gcs && ingcs1 !== gcs) {
    poly1 = poly1.map((p) => p.map((h) => transform.transformCoordinates(ingcs1, gcs, h)));
  }
  if (ingcs2 && gcs && ingcs2 !== gcs) {
    poly2 = poly2.map((p) => p.map((h) => transform.transformCoordinates(ingcs2, gcs, h)));
  }
  let seglist1 = poly1.map(p => PolyBool.segments({regions: p}));
  let seglist2 = poly2.map(p => PolyBool.segments({regions: p}));
  seglist1 = polygonOperationSeglist(opts.innerOperation || 'union', mode1.epsilon, seglist1);
  seglist2 = polygonOperationSeglist(opts.innerOperation || 'union', mode2.epsilon, seglist2);
  let seglist = seglist1;
  if (seglist1[0] && seglist2[0]) {
    /* We need to do the main operation with the same inversion flags */
    seglist1[0].inverted = false;
    seglist2[0].inverted = false;
    seglist = polygonOperationSeglist(op, Math.max(mode1.epsilon, mode2.epsilon), [seglist1[0], seglist2[0]]);
  } else if (seglist2[0]) {
    seglist = seglist2;
  }
  let newpoly = seglistToPolygonList(seglist);
  if (opts.correspond) {
    generateCorrespondence(poly1, poly2, newpoly, opts.correspond);
  }
  if (ingcs1 && gcs && ingcs1 !== gcs) {
    newpoly = newpoly.map((p) => p.map((h) => transform.transformCoordinates(gcs, ingcs1, h)));
  }
  const mode = {style: opts.style || minimumPolygonStyle(newpoly, mode1.style)};
  return fromPolygonList(newpoly, mode, opts);
}

/**
 * Generate a polygon function for a specific operation.
 *
 * @param {string} op The operation to handle.  One of union, intersect,
 *    difference, or xor.
 * @returns {function} a function for the polygons.
 */
function generalOperation(op) {
  return (poly1, poly2, opts) => generalOperationProcess(op, poly1, poly2, opts);
}

module.exports = {
  union: generalOperation('union'),
  intersect: generalOperation('intersect'),
  difference: generalOperation('difference'),
  xor: generalOperation('xor'),
  toPolygonList,
  fromPolygonList
};
