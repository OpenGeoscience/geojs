var PolyBool = require('polybooljs');
var transform = require('../transform');

/**
 * A polygon in any of a variety of formats.
 *
 * @typedef {geo.polygonFlat|Array.<geo.polygonFlat>|Array.<Array.<geo.polygonFlat>>|geo.polygonObject| Array.<geo.polygonObject>} geo.anyPolygon
 */

/**
 * Object specification for polygon operation options.
 *
 * TODO: should poly1/poly2 accept polygonFeature and annotationLayer?
 * TODO: should epsilon be configurable from the display pixel size?
 *
 * TODO: add
 * rdp: threshold
 * ellipseToPoly: threshold (only if we input features) -- use rdp
 *
 * @typedef {object} geo.util.polyop.spec
 * @property {geo.anyPolygon} [poly1] The first polygon set to operate on.
 * @property {geo.anyPolygon} [poly2] The second polygon set to operate on.
 * @property {number} [epsilon1] A precision value to use when computing the
 *   operation.  If not specified, this is computed from the range of values in
 *   ``poly1``.  It is used for processing ``poly1`` and the general operation.
 * @property {number} [epsilon1] A precision value to use when processing
 *   ``poly2``.  If not specified, this is computed from the range of values in
 *   ``poly2``.
 * @property {string} [style] If specified, the preferred output style.  This
 *   can be (flat|object)[-list[list[-outer[-list]]]].
 * @property {string|geo.transform} [ingcs] The default coordinate
 *   system of the source polygon coordinates.  If not specified , this is
 *   taken from the feature first or the map second if either is available.
 * @property {string|geo.transform} [gcs] The default coordinate system to use
 *   for the actual operations.  This is where the epsilon and rdp values are
 *   applied.  If not specified , this is taken from the map second if
 *   available.
 * @property {geo.map} [map] Used for ``ingcs`` and ``gcs`` if needed.
 * @property {string} [innerOperation="xor"] one of union, intersect, xor.
 *   Used to combine individual polygons in each of ``poly1`` and ``poly2``
 *   before the main operation is carried out.
 * @property {object} [correspond] If present, information about the
 *   correspondence of the input and output polygons is added to this object.
 *   This is of the form {poly1: [idx...], poly2: [idx...]}, where the [idx...]
 *   array is the length of the input polygon array and each entry is either
 *   undefined or contains a list of indices of corresponding output polygons.
 *   Multiple inputs can refer to the same output.
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
  x: 'xor'
  '^': 'xor'
};

/**
 * Convert a segment list to a polygon list.
 *
 * @param {object[]} seglist A PolyBool segment list.
 * @returns {array[]} A polygon list.
 */
function seglistToPolygonList(seglist) {
  // This doesn't arrange holes correctly
  // return seglist.map((s) => PolyBool.polygon(s).regions);
  const polys = [];
  seglist.forEach((s) => {
    let geojson = PolyBool.polygonToGeoJSON(PolyBool.polygon(s));
    if (geojson.type === 'MultiPolygon') {
      geojson.coordinates.forEach((p) => {
        polys.push(p.map((h) => h.slice(0, h.length - 1)));
      });
    } else if (geojson.type === 'Polygon') {
      polys.push(geojson.coordinates.map((h) => h.slice(0, h.length - 1)));
    }
  });
  return polys;
}

/**
 * Perform an boolean operation on a set of polygons.
 *
 * @param {string} op One of 'union', 'intersect', or other value PolyBool
 *      supports.
 * @param {number} epsilon Precision for calculations.  In degrees, 1e-9 is
 *      around 0.11 mm in ground distance.
 * @param {array[]} polygons A list of polygons.  Each polygon is a list of
 *      lines.  Each line is a list of coordinates.  Each coordinate is a list
 *      of [x, y].
 * @returns {array[]} A list of polygons.
 */
function polygonOperation(op, epsilon, polygons) {
  const seglist = polygons.map(p => PolyBool.segments({regions: p}));
  polygonOperationSeglist(op, epsilon, seglist);
  return seglistToPolygonList(seglist);
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
 * @param {geo.anyPolygon} poly A polygon in one of the above formats to
 *   convert.
 * @param {object} mode An object that is modified with information about
 *   the conversion.  This includes style: the input polygon format; min: a
 *   2-item list with minimum values in x, y; max: a 2-item list with
 *   maximum values in x, y; epsilon: a recommended value for epsilon in other
 *   functions.
 * @returns {array[]} A list of polygons.
 */
function toPolygonList(poly, mode) {
  mode = mode || {};

  mode.style = '';
  if (poly.outer) {
    mode.style = '-outer';
    poly = [[poly.outer, ...(poly.inner || [])]];
  } else if (poly[0].outer) {
    mode.style = '-outer-list';
    poly = poly.map((p) => [p.outer, ...(p.inner || [])]);
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
 * @param {array[]} poly A list of polygons.
 * @param {object} mode An object that is modified with information about the
 *   conversion.  This includes style: the input polygon format; min: a 2-item
 *   list with minimum values in x, y; max: a 2-item list with maximum values
 *   in x, y; epsilon: a recommended value for epsilon in other functions.
 * @returns {geo.anyPolygon} A polygon in one of several formats.
 */
function fromPolygonList(poly, mode) {
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
 * @param {array[]} polylist A list of polygons.
 * @param {string} style the proposed style.
 * @returns {string} The preferred style.
 */
function minimumPolygonStyle(polylist, style) {
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
 * @param {array[]} poly1 First set of source polygons.
 * @param {array[]} poly2 Second set of source polygons.
 * @param {array[]} newpoly Output polygons.
 * @param {object} results An object to add results to.
 */
function generateCorrespondence(poly1, poly2, newpoly, results) {
  const pts = {};

  newpoly.forEach((p, idx) => p.forEach((h) => h.forEach((pt) => {
    const key = '_' + pt[0] + '_' + pt[1];
    if (pts[key]) {
      if (pts[key].indexOf(idx) === -1) {
        pts[key].push(idx);
      }
    } else {
      pts[key] = [idx];
    }
  })));
  ['poly1', 'poly2'].forEach((pkey) => {
    const poly = pkey === 'poly1' ? poly1 : poly2;
    results[pkey] = Array(poly.length);
    poly.forEach((p, idx) => {
      const found = {};
      p.forEach((h) => h.forEach((pt) => {
        const key = '_' + pt[0] + '_' + pt[1];
        if (pts[key]) {
          pts[key].forEach((val) => {
            found[val] = (found[val] || 0) + 1;
          });
        }
      }));
      Object.keys(found).forEach((nidx) => {
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
 *    difference, or xor.i
 * @param {geo.anyPolygon|geo.util.polyop.spec} poly1 Either the first polygon
 *    set or an object containing all parameters for the function.
 * @param {geo.anyPolygon} [poly2] If the poly1 parameter is not a complete
 *    options object, the second polygon set for the operation.
 * @param {geo.util.polyop.spec} [opts] If the poly1 parameter is not a
 *    complete options object, the options for the operation.
 * @returns {geo.anyPolygon} A polygon set in the same style as poly1.
 */
function generalOperationProcess(op, poly1, poly2, opts) {
  op = AlternateOpNames[op] || op;
  if (poly1.poly1) {
    opts = poly1;
    poly1 = opts.poly1;
    poly2 = opts.poly2;
  }
  opts = opts || {};
  const mode1 = {};
  const mode2 = {};
  // TODO: handle poly1, poly2 if they are features or annotations
  poly1 = toPolygonList(poly1, mode1);
  poly2 = toPolygonList(poly2, mode2);
  mode1.epsilon = opts.epsilon1 || mode1.epsilon;
  mode2.epsilon = opts.epsilon2 || mode1.epsilon;
  const ingcs = opts.ingcs || (opts.map ? opts.map.ingcs() : undefined);
  const gcs = opts.gcs || (opts.map ? opts.map.gcs() : undefined);
  if (ingcs && gcs && ingcs !== gcs) {
    poly1 = poly1.map((p) => p.map((h) => transform.transformCoordinates(ingcs, gcs, h)));
    poly2 = poly2.map((p) => p.map((h) => transform.transformCoordinates(ingcs, gcs, h)));
  }
  let seglist1 = poly1.map(p => PolyBool.segments({regions: p}));
  let seglist2 = poly2.map(p => PolyBool.segments({regions: p}));
  seglist1 = polygonOperationSeglist('xor', mode1.epsilon, seglist1);
  seglist2 = polygonOperationSeglist('xor', mode2.epsilon, seglist2);
  const seglist = polygonOperationSeglist(op, Math.max(mode1.epsilon, mode2.epsilon), [seglist1[0], seglist2[0]]);
  let newpoly = seglistToPolygonList(seglist);
  if (opts.correspond) {
    generateCorrespondence(poly1, poly2, newpoly, opts.correspond);
  }
  if (ingcs && gcs && ingcs !== gcs) {
    newpoly = newpoly.map((p) => p.map((h) => transform.transformCoordinates(gcs, ingcs, h)));
  }
  const mode = {style: opts.style || minimumPolygonStyle(newpoly, mode1.style)};
  return fromPolygonList(newpoly, mode);
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
  polyop: polygonOperation,
  union: generalOperation('union'),
  intersect: generalOperation('intersect'),
  difference: generalOperation('difference'),
  xor: generalOperation('xor'),
  toPolygonList,
  fromPolygonList
};
