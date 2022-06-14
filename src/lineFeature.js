var inherit = require('./inherit');
var feature = require('./feature');
var timestamp = require('./timestamp');
var transform = require('./transform');
var util = require('./util');

/**
 * Line feature specification.
 *
 * @typedef {geo.feature.spec} geo.lineFeature.spec
 * @extends geo.feature.spec
 * @property {geo.geoPosition|function} [position] Position of the data.
 *   Default is (data).
 * @property {object|function} [line] Lines from the data.  Default is (data).
 *   Typically, the data is an array of lines, each of which is an array of
 *   points.  Only lines that have at least two points are rendered.  The
 *   position function is called for each point as `position(linePoint,
 *   pointIndex, lineEntry, lineEntryIndex)`.
 * @property {geo.lineFeature.styleSpec} [style] Style object with default
 *   style options.
 */

/**
 * Style specification for a line feature.
 *
 * @typedef {geo.feature.styleSpec} geo.lineFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @property {geo.geoColor|function} [strokeColor] Color to stroke each line.
 *   The color can vary by point.
 * @property {number|function} [strokeOpacity] Opacity for each line stroke.
 *   The opacity can vary by point.  Opacity is on a [0-1] scale.
 * @property {number|function} [strokeWidth] The weight of the line stroke in
 *   pixels.  The width can vary by point.
 * @property {number|function} [strokeOffset] This is a value from -1 (left) to
 *   1 (right), with 0 being centered.  This can vary by point.
 * @property {string|function} [lineCap='butt'] One of 'butt', 'square', or
 *   'round'.  This can vary by point.
 * @property {string|function} [lineJoin='miter'] One of 'miter', 'bevel',
 *   'round', or 'miter-clip'.  This can vary by point.
 * @property {boolean|function} [closed=false] If true and the renderer
 *   supports it, connect the first and last points of a line if the line has
 *   more than two points.  This applies per line (if a function, it is called
 *   with `(lineEntry, lineEntryIndex)`.
 * @property {number|function} [miterLimit=10] For lines of more than two
 *   segments that are mitered, if the miter length exceeds the `strokeWidth`
 *   divided by the sine of half the angle between segments, then a bevel join
 *   is used instead.  This is a single value that applies to all lines.  If a
 *   function, it is called with `(data)`.
 * @property {boolean|string|function} [uniformLine=false] Boolean indicating
 *   if each line has a uniform style (uniform stroke color, opacity, and
 *   width).  Can vary by line.  A value of `'drop'` will modify rendered
 *   vertex order by dropping duplicates and setting later values to zero
 *   opacity.  This can be faster but makes it so updating the style array
 *   can no longer be used.
 * @property {number|function} [antialiasing] Antialiasing distance in pixels.
 *   Values must be non-negative.  A value greater than 1 will produce a
 *   visible gradient.  This is a single value that applies to all lines.
 * @property {string|function} [debug] If 'debug', render lines in debug mode.
 *   This is a single value that applies to all lines.
 * @property {number[]|function} [origin] Origin in map gcs coordinates used
 *   for to ensure high precision drawing in this location.  When called as a
 *   function, this is passed the vertex positions as a single continuous array
 *   in map gcs coordinates.  It defaults to the first line's first vertex's
 *   position.
 */

/**
 * Create a new instance of class lineFeature.
 *
 * @class
 * @alias geo.lineFeature
 * @extends geo.feature
 * @param {geo.lineFeature.spec} arg
 * @returns {geo.lineFeature}
 */
var lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof lineFeature)) {
    return new lineFeature(arg);
  }

  var $ = require('jquery');

  arg = arg || {};
  feature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      s_init = this._init,
      m_pointSearchTime = timestamp(),
      m_pointSearchInfo;

  this.featureType = 'line';
  this._subfeatureStyles = {
    lineCap: true,
    lineJoin: true,
    strokeColor: true,
    strokeOffset: true,
    strokeOpacity: true,
    strokeWidth: true
  };

  /**
   * Get/set line accessor.
   *
   * @param {object|function} [val] If not specified, return the current line
   *    accessor.  If specified, use this for the line accessor and return
   *    `this`.  If a function is given, the function is passed `(dataElement,
   *    dataIndex)` and returns an array of vertex elements.
   * @returns {object|function|this} The current line accessor or this feature.
   */
  this.line = function (val) {
    if (val === undefined) {
      return m_this.style('line');
    } else {
      m_this.style('line', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Get/Set position accessor.
   *
   * @param {geo.geoPosition|function} [val] If not specified, return the
   *    current position accessor.  If specified, use this for the position
   *    accessor and return `this`.  If a function is given, this is called
   *    with `(vertexElement, vertexIndex, dataElement, dataIndex)`.
   * @returns {geo.geoPosition|function|this} The current position or this
   *    feature.
   */
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    } else {
      m_this.style('position', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Cache information needed for point searches.  The point search
   * information record is an array with one entry per line, each entry of
   * which is an array with one entry per line segment.  These each contain
   * an object with the end coordinates (`u`, `v`) of the segment in map gcs
   * coordinates and the square of the maximum half-width that needs to be
   * considered for the line (`r2`).
   *
   * @returns {object} The point search information record.
   */
  this._updatePointSearchInfo = function () {
    if (m_pointSearchTime.timestamp() >= m_this.dataTime().timestamp() &&
        m_pointSearchTime.timestamp() >= m_this.timestamp()) {
      return m_pointSearchInfo;
    }
    m_pointSearchTime.modified();
    m_pointSearchInfo = [];
    var data = m_this.data(),
        line = m_this.line(),
        widthFunc = m_this.style.get('strokeWidth'),
        widthVal = util.isFunction(m_this.style('strokeWidth')) ? undefined : widthFunc(),
        posFunc = m_this.position(),
        closedFunc = m_this.style.get('closed'),
        closedVal = util.isFunction(m_this.style('closed')) ? undefined : closedFunc(),
        uniformFunc = m_this.style.get('uniformLine'),
        uniformVal = util.isFunction(m_this.style('uniformLine')) ? undefined : uniformFunc(),
        gcs = m_this.gcs(),
        mapgcs = m_this.layer().map().gcs(),
        onlyInvertedY = transform.onlyInvertedY(gcs, mapgcs);

    for (let index = 0; index < data.length; index += 1) {
      const d = data[index];
      const closed = closedVal === undefined ? closedFunc(d, index) : closedVal;
      let last, lasti, lastr, lastr2, first, min, max, width;
      const record = [];
      const uniform = uniformVal === undefined ? uniformFunc(d, index) : uniformVal;

      const lineRecord = line(d, index);
      for (let j = 0; j < lineRecord.length; j += 1) {
        const current = lineRecord[j];
        let p = posFunc(current, j, d, index);
        if (onlyInvertedY) {
          p = {x: p.x, y: -p.y};
        } else if (gcs !== mapgcs) {
          p = transform.transformCoordinates(gcs, mapgcs, p);
        }
        if (min === undefined) { min = {x: p.x, y: p.y}; }
        if (max === undefined) { max = {x: p.x, y: p.y}; }
        if (p.x < min.x) { min.x = p.x; }
        if (p.x > max.x) { max.x = p.x; }
        if (p.y < min.y) { min.y = p.y; }
        if (p.y > max.y) { max.y = p.y; }
        if (!uniform || !j) {
          width = widthVal === undefined ? widthFunc(current, j, d, index) : widthVal;
        }
        const r = Math.ceil(width / 2) + 2;
        if (max.r === undefined || r > max.r) { max.r = r; }
        const r2 = r * r;
        if (last) {
          record.push({u: p, v: last, r: lastr > r ? lastr : r, r2: lastr2 > r2 ? lastr2 : r2, i: j, j: lasti});
        }
        last = p;
        lasti = j;
        lastr = r;
        lastr2 = r2;
        if (!first && closed) {
          first = {p: p, r: r, r2: r2, i: j};
        }
      }
      if (closed && first && (last.x !== first.p.x || last.y !== first.p.y)) {
        record.push({u: last, v: first.p, r: lastr > first.r ? lastr : first.r, r2: lastr2 > first.r2 ? lastr2 : first.r2, i: lasti, j: first.i});
      }
      record.min = min;
      record.max = max;
      m_pointSearchInfo.push(record);
    }
    return m_pointSearchInfo;
  };

  /**
   * Returns an array of datum indices that contain the given point.  This is a
   * slow implementation with runtime order of the number of vertices.  A point
   * is considered on a line segment if it is close to the line or either end
   * point.  Closeness is based on the maximum width of the line segment, and
   * is `ceil(maxwidth / 2) + 2` pixels.  This means that corner extensions
   * due to mitering may be outside of the selection area and that variable-
   * width lines will have a greater selection region than their visual size at
   * the narrow end.
   *
   * @param {geo.geoPosition} p point to search for.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {object} An object with `index`: a list of line indices, `found`:
   *    a list of lines that contain the specified coordinate, and `extra`: an
   *    object with keys that are line indices and values that are the first
   *    segment index for which the line was matched.
   */
  this.pointSearch = function (p, gcs) {
    var data = m_this.data(), indices = [], found = [], extra = {};
    if (!data || !data.length || !m_this.layer()) {
      return {
        found: found,
        index: indices,
        extra: extra
      };
    }
    m_this._updatePointSearchInfo();
    var map = m_this.layer().map();
    gcs = (gcs === null ? map.gcs() : (gcs === undefined ? map.ingcs() : gcs));
    var scale = map.unitsPerPixel(map.zoom()),
        scale2 = scale * scale,
        pt = transform.transformCoordinates(gcs, map.gcs(), p),
        strokeWidthFunc = m_this.style.get('strokeWidth'),
        strokeOpacityFunc = m_this.style.get('strokeOpacity'),
        lineFunc = m_this.line(),
        line, i, j, record;

    for (i = 0; i < m_pointSearchInfo.length; i += 1) {
      record = m_pointSearchInfo[i];
      line = null;
      for (j = 0; j < record.length; j += 1) {
        if (util.distance2dToLineSquared(pt, record[j].u, record[j].v) <= record[j].r2 * scale2) {
          if (!line) {
            line = lineFunc(data[i], i);
          }
          if ((strokeOpacityFunc(line[record[j].i], record[j].i, data[i], i) > 0 || strokeOpacityFunc(line[record[j].j], record[j].j, data[i], i) > 0) &&
              (strokeWidthFunc(line[record[j].i], record[j].i, data[i], i) > 0 || strokeWidthFunc(line[record[j].j], record[j].j, data[i], i) > 0)) {
            found.push(data[i]);
            indices.push(i);
            extra[i] = j;
            break;
          }
        }
      }
    }
    return {
      found: found,
      index: indices,
      extra: extra
    };
  };

  /**
   * Returns lines that are contained in the given polygon.
   *
   * @param {geo.polygonObject} poly A polygon as an array of coordinates or an
   *    object with `outer` and optionally `inner` parameters.
   * @param {object} [opts] Additional search options.
   * @param {boolean} [opts.partial=false] If truthy, include lines that are
   *    partially in the polygon, otherwise only include lines that are fully
   *    within the region.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {object} An object with `index`: a list of line indices,
   *    `found`: a list of lines within the polygon, and `extra`: an object
   *    with index keys containing an object with a `segment` key with a value
   *    indicating one of the line segments that is inside the polygon and
   *    `partial` key and a boolean value to indicate if the line is on the
   *    polygon's border.
   */
  this.polygonSearch = function (poly, opts, gcs) {
    var data = m_this.data(), indices = [], found = [], extra = {}, min, max,
        map = m_this.layer().map(),
        strokeWidthFunc = m_this.style.get('strokeWidth'),
        strokeOpacityFunc = m_this.style.get('strokeOpacity'),
        lineFunc = m_this.line();
    gcs = (gcs === null ? map.gcs() : (gcs === undefined ? map.ingcs() : gcs));
    if (!poly.outer) {
      poly = {outer: poly, inner: []};
    }
    if (!data || !data.length || poly.outer.length < 3) {
      return {
        found: found,
        index: indices,
        extra: extra
      };
    }
    opts = opts || {};
    opts.partial = opts.partial || false;
    poly = {outer: transform.transformCoordinates(gcs, map.gcs(), poly.outer), inner: (poly.inner || []).map(inner => transform.transformCoordinates(gcs, map.gcs(), inner))};
    poly.outer.forEach(p => {
      if (!min) {
        min = {x: p.x, y: p.y};
        max = {x: p.x, y: p.y};
      }
      if (p.x < min.x) { min.x = p.x; }
      if (p.x > max.x) { max.x = p.x; }
      if (p.y < min.y) { min.y = p.y; }
      if (p.y > max.y) { max.y = p.y; }
    });
    m_this._updatePointSearchInfo();
    const scale = map.unitsPerPixel(map.zoom());
    let i, j, record, u, v, r;
    for (i = 0; i < m_pointSearchInfo.length; i += 1) {
      record = m_pointSearchInfo[i];
      if (!record.max ||
          record.max.x < min.x - record.max.r * scale ||
          record.min.x > max.x + record.max.r * scale ||
          record.max.y < min.y - record.max.r * scale ||
          record.min.y > max.y + record.max.r * scale) {
        continue;
      }
      let inside, partial, line;
      for (j = 0; j < record.length; j += 1) {
        u = record[j].u;
        v = record[j].v;
        r = record[j].r;
        if ((u.x < min.x - r * scale && v.x < min.x - r * scale) ||
            (u.x > max.x + r * scale && v.x > max.x + r * scale) ||
            (u.y < min.y - r * scale && v.y < min.y - r * scale) ||
            (u.y > max.y + r * scale && v.y > max.y + r * scale)) {
          continue;
        }
        if (!line) {
          line = lineFunc(data[i], i);
        }
        if ((strokeOpacityFunc(line[record[j].i], record[j].i, data[i], i) <= 0 && strokeOpacityFunc(line[record[j].j], record[j].j, data[i], i) <= 0) ||
            (strokeWidthFunc(line[record[j].i], record[j].i, data[i], i) <= 0 && strokeWidthFunc(line[record[j].j], record[j].j, data[i], i) <= 0)) {
          continue;
        }
        const dist0 = util.distanceToPolygon2d(u, poly),
            dist1 = util.distanceToPolygon2d(v, poly);
        if ((dist0 > -r * scale && dist0 < r * scale) || (dist1 > -r * scale && dist1 < r & scale) || dist0 * dist1 < 0) {
          partial = true;
          break;
        }
        if (util.crossedLineSegmentPolygon2d(u, v, poly)) {
          partial = true;
          break;
        }
        // if a point of the polygon is near the line formed by u-v, this is
        // also partial
        const r2scaled = r * r * scale * scale;
        for (let k = 0; k < poly.outer.length && !partial; k += 1) {
          partial = util.distance2dToLineSquared(poly.outer[k], u, v) < r2scaled;
        }
        for (let k = 0; k < poly.inner.length && !partial; k += 1) {
          for (let l = 0; l < poly.inner[k].length && !partial; l += 1) {
            partial = util.distance2dToLineSquared(poly.inner[k][l], u, v) < r2scaled;
          }
        }
        if (partial) {
          break;
        }
        // if this isn't partial and the distance to the polygon is positive,
        // it is inside
        if (dist0 > 0) {
          inside = true;
        }
      }
      if ((!opts.partial && inside && !partial) || (opts.partial && (inside || partial))) {
        indices.push(i);
        found.push(data[i]);
        extra[i] = {
          partial: partial,
          segment: j < m_pointSearchInfo[i].length ? j : 0
        };
      }
    }
    return {
      found: found,
      index: indices,
      extra: extra
    };
  };

  /**
   * Take a set of data, reduce the number of vertices per line using the
   * Ramer–Douglas–Peucker algorithm, and use the result as the new data.
   * This changes the instance's data, the position accessor, and the line
   * accessor.
   *
   * @param {array} data A new data array.
   * @param {number} [tolerance] The maximum variation allowed in map.gcs
   *    units.  A value of zero will only remove perfectly collinear points.
   *    If not specified, this is set to a half display pixel at the map's
   *    current zoom level.
   * @param {function} [posFunc=this.style.get('position')] The function to
   *    get the position of each vertex.
   * @param {function} [lineFunc=this.style.get('line')] The function to get
   *    each line.
   * @returns {this}
   */
  this.rdpSimplifyData = function (data, tolerance, posFunc, lineFunc) {
    data = data || m_this.data();
    posFunc = posFunc || m_this.style.get('position');
    lineFunc = lineFunc || m_this.style.get('line');
    var map = m_this.layer().map(),
        mapgcs = map.gcs(),
        featuregcs = m_this.gcs(),
        closedFunc = m_this.style.get('closed');
    if (tolerance === undefined) {
      tolerance = map.unitsPerPixel(map.zoom()) * 0.5;
    }

    /* transform the coordinates to the map gcs */
    data = data.map(function (d, idx) {
      var lineItem = lineFunc(d, idx),
          pts = transform.transformCoordinates(featuregcs, mapgcs, lineItem.map(function (ld, lidx) {
            return posFunc(ld, lidx, d, idx);
          })),
          elem = util.rdpLineSimplify(pts, tolerance, closedFunc(d, idx), []);
      if (elem.length < 2 || (elem.length === 2 && util.distance2dSquared(elem[0], elem[1]) < tolerance * tolerance)) {
        elem = [];
      }
      elem = transform.transformCoordinates(mapgcs, featuregcs, elem);
      /* Copy element properties, as they might be used by styles */
      for (var key in d) {
        if (d.hasOwnProperty(key) && !(Array.isArray(d) && key >= 0 && key < d.length)) {
          elem[key] = d[key];
        }
      }
      return elem;
    });

    /* Set the reduced lines as the data and use simple accessors. */
    m_this.style('position', util.identityFunction);
    m_this.style('line', util.identityFunction);
    m_this.data(data);
    return m_this;
  };

  /**
   * Initialize.
   *
   * @param {geo.lineFeature.spec} arg The feature specification.
   * @returns {this}
   */
  this._init = function (arg) {
    arg = arg || {};
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        strokeWidth: 1.0,
        // Default to gold color for lines
        strokeColor: { r: 1.0, g: 0.8431372549, b: 0.0 },
        strokeStyle: 'solid',
        strokeOpacity: 1.0,
        // Values of 2 and above appear smoothest.
        antialiasing: 2.0,
        closed: false,
        line: util.identityFunction,
        position: (d) => Array.isArray(d) ? {x: d[0], y: d[1], z: d[2] || 0} : d,
        origin: (p) => (p.length >= 3 ? p.slice(0, 3) : [0, 0, 0])
      },
      arg.style === undefined ? {} : arg.style
    );

    if (arg.line !== undefined) {
      defaultStyle.line = arg.line;
    }

    if (arg.position !== undefined) {
      defaultStyle.position = arg.position;
    }

    m_this.style(defaultStyle);

    m_this.dataTime().modified();
    return m_this;
  };

  this._init(arg);
  return this;
};

/**
 * Create a lineFeature.
 *
 * @see {@link geo.feature.create}
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.lineFeature.spec} spec The feature specification
 * @returns {geo.lineFeature|null} The created feature or `null` for failure.
 */
lineFeature.create = function (layer, spec) {
  'use strict';

  spec = spec || {};
  spec.type = 'line';
  return feature.create(layer, spec);
};

lineFeature.capabilities = {
  /* core feature name -- support in any manner */
  feature: 'line',
  /* support for solid-colored, constant-width lines */
  basic: 'line.basic',
  /* support for lines that vary in width and color */
  multicolor: 'line.multicolor'
};

inherit(lineFeature, feature);
module.exports = lineFeature;
