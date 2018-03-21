var inherit = require('./inherit');
var feature = require('./feature');
var timestamp = require('./timestamp');
var transform = require('./transform');
var util = require('./util');

/**
 * Line feature specification.
 *
 * @typedef {geo.feature.spec} geo.lineFeature.spec
 * @param {object|Function} [position] Position of the data.  Default is
 *   (data).
 * @param {object|Function} [line] Lines from the data.  Default is (data).
 *   Typically, the data is an array of lines, each of which is an array of
 *   points.  Only lines that have at least two points are rendered.  The
 *   position function is called for each point as `position(linePoint,
 *   pointIndex, lineEntry, lineEntryIndex)`.
 * @param {object} [style] Style object with default style options.
 * @param {geo.geoColor|Function} [style.strokeColor] Color to stroke each
 *   line.  The color can vary by point.
 * @param {number|Function} [style.strokeOpacity] Opacity for each line
 *   stroke.  The opacity can vary by point.  Opacity is on a [0-1] scale.
 * @param {number|Function} [style.strokeWidth] The weight of the line
 *   stroke in pixels.  The width can vary by point.
 * @param {number|Function} [style.strokeOffset] This is a value from -1
 *   (left) to 1 (right), with 0 being centered.  This can vary by point.
 * @param {string|Function} [style.lineCap='butt'] One of 'butt', 'square', or
 *   'round'.  This can vary by point.
 * @param {string|Function} [style.lineJoin='miter'] One of 'miter', 'bevel',
 *   'round', or 'miter-clip'.  This can vary by point.
 * @param {boolean|Function} [style.closed=false] If true and the renderer
 *   supports it, connect the first and last points of a line if the line has
 *   more than two points.  This applies per line (if a function, it is called
 *   with `(lineEntry, lineEntryIndex)`.
 * @param {number|Function} [style.miterLimit=10] For lines of more than two
 *   segments that are mitered, if the miter length exceeds the `strokeWidth`
 *   divided by the sine of half the angle between segments, then a bevel join
 *   is used instead.  This is a single value that applies to all lines.  If a
 *   function, it is called with `(data)`.
 * @param {number|Function} [style.antialiasing] Antialiasing distance in
 *   pixels.  Values must be non-negative.  A value greater than 1 will produce
 *   a visible gradient.  This is a single value that applies to all lines.
 * @param {string|Function} [style.debug] If 'debug', render lines in debug
 *   mode.  This is a single value that applies to all lines.
 */

/**
 * Create a new instance of class lineFeature.
 *
 * @class geo.lineFeature
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
   * Get/set lineaccessor.
   *
   * @param {object} [val] if specified, use this for the line accessor
   *    and return the feature.  If not specified, return the current line.
   * @returns {object|this} The current line or this feature.
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
   * @param {object} [val] if specified, use this for the position accessor
   *    and return the feature.  If not specified, return the current
   *    position.
   * @returns {object|this} The current position or this feature.
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
    if (m_pointSearchTime.getMTime() >= m_this.dataTime().getMTime() &&
        m_pointSearchTime.getMTime() >= m_this.getMTime()) {
      return m_pointSearchInfo;
    }
    m_pointSearchTime.modified();
    m_pointSearchInfo = [];
    var data = m_this.data(),
        line = m_this.line(),
        widthFunc = m_this.style.get('strokeWidth'),
        posFunc = m_this.position(),
        closedFunc = m_this.style.get('closed'),
        gcs = m_this.gcs(),
        mapgcs = m_this.layer().map().gcs();

    data.forEach(function (d, index) {
      var closed = closedFunc(d, index),
          last, lastr2, first, record = [];

      line(d, index).forEach(function (current, j) {
        var p = posFunc(current, j, d, index);
        if (gcs !== mapgcs) {
          p = transform.transformCoordinates(gcs, mapgcs, p);
        }
        var r = Math.ceil(widthFunc(current, j, d, index) / 2) + 2;
        var r2 = r * r;
        if (last) {
          record.push({u: p, v: last, r2: lastr2 > r2 ? lastr2 : r2});
        }
        last = p;
        lastr2 = r2;
        if (!first && closed) {
          first = {p: p, r2: r2};
        }
      });
      if (closed && first && (last.x !== first.p.x || last.y !== first.p.y)) {
        record.push({u: last, v: first.p, r2: lastr2 > first.r2 ? lastr2 : first.r2});
      }
      m_pointSearchInfo.push(record);
    });
    return m_pointSearchInfo;
  };

  /**
   * Returns an array of datum indices that contain the given point.  This is a
   * slow implementation with runtime order of the number of vertices.  A point
   * is considered on a line segment if it is close to the line or either end
   * point.  Closeness is based on the maximum width of the line segement, and
   * is `ceil(maxwidth / 2) + 2` pixels.  This means that corner extensions
   * due to mitering may be outside of the selection area and that variable-
   * width lines will have a greater selection region than their visual size at
   * the narrow end.
   *
   * @param {geo.geoPosition} p point to search for in map interface gcs.
   * @returns {object} An object with `index`: a list of line indices, and
   *    `found`: a list of quads that contain the specified coordinate.
   */
  this.pointSearch = function (p) {
    var data = m_this.data(), indices = [], found = [];
    if (!data || !data.length || !m_this.layer()) {
      return {
        found: found,
        index: indices
      };
    }
    this._updatePointSearchInfo();
    var map = m_this.layer().map(),
        scale = map.unitsPerPixel(map.zoom()),
        scale2 = scale * scale,
        pt = transform.transformCoordinates(map.ingcs(), map.gcs(), p),
        i, j, record;

    for (i = 0; i < m_pointSearchInfo.length; i += 1) {
      record = m_pointSearchInfo[i];
      for (j = 0; j < record.length; j += 1) {
        if (util.distance2dToLineSquared(pt, record[j].u, record[j].v) <= record[j].r2 * scale2) {
          found.push(data[i]);
          indices.push(i);
          break;
        }
      }
    }
    return {
      found: found,
      index: indices
    };
  };

  /**
   * Search for lines contained within a rectangilar region.
   *
   * @param {geo.geoPosition} lowerLeft Lower-left corner in gcs coordinates.
   * @param {geo.geoPosition} upperRight Upper-right corner in gcs coordinates.
   * @param {object} [opts] Additional search options.
   * @param {boolean} [opts.partial=false] If truthy, include lines that are
   *    partially in the box, otherwise only include lines that are fully
   *    within the region.
   * @returns {number[]} A list of line indices that are in the box region.
   */
  this.boxSearch = function (lowerLeft, upperRight, opts) {
    var pos = m_this.position(),
        idx = [],
        line = m_this.line();

    opts = opts || {};
    opts.partial = opts.partial || false;
    if (opts.partial) {
      throw new Error('Unimplemented query method.');
    }

    m_this.data().forEach(function (d, i) {
      var inside = true;
      line(d, i).forEach(function (e, j) {
        if (!inside) { return; }
        var p = pos(e, j, d, i);
        if (!(p.x >= lowerLeft.x &&
              p.x <= upperRight.x &&
              p.y >= lowerLeft.y &&
              p.y <= upperRight.y)
        ) {
          inside = false;
        }
      });
      if (inside) {
        idx.push(i);
      }
    });
    return idx;
  };

  /**
   * Take a set of data, reduce the number of vertices per linen using the
   * Ramer–Douglas–Peucker algorithm, and use the result as the new data.
   * This changes the instance's data, the position accessor, and the line
   * accessor.
   *
   * @param {array} data A new data array.
   * @param {number} [tolerance] The maximum variation allowed in map.gcs
   *    units.  A value of zero will only remove perfectly colinear points.  If
   *    not specified, this is set to a half display pixel at the map's current
   *    zoom level.
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
    m_this.style('position', function (d) { return d; });
    m_this.style('line', function (d) { return d; });
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
        line: function (d) { return d; },
        position: function (d) { return d; }
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
