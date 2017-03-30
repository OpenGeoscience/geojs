var inherit = require('./inherit');
var feature = require('./feature');
var timestamp = require('./timestamp');
var transform = require('./transform');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class lineFeature
 *
 * @class geo.lineFeature
 * @extends geo.feature
 * @param {Object|Function} [arg.position] Position of the data.  Default is
 *   (data).
 * @param {Object|Function} [arg.line] Lines from the data.  Default is (data).
 *   Typically, the data is an array of lines, each of which is an array of
 *   points.  Only lines that have at least two points are rendered.  The
 *   position function is called for each point as position(linePoint,
 *   pointIndex, lineEntry, lineEntryIndex).
 * @param {boolean} [arg.selectionAPI=false] True to send selection events on
 *   mouse move, click, etc.
 * @param {boolean} [arg.visible=true] True to show this feature.
 * @param {Object} [arg.style] Style object with default style options.
 * @param {Object|Function} [arg.style.strokeColor] Color to stroke each
 *   line.  The color can vary by point.  Colors can be css names or hex
 *   values, or an object with r, g, b on a [0-1] scale.
 * @param {number|Function} [arg.style.strokeOpacity] Opacity for each line
 *   stroke.  The opacity can vary by point.  Opacity is on a [0-1] scale.
 * @param {number|Function} [arg.style.strokeWidth] The weight of the line
 *   stroke in pixels.  The width can vary by point.
 * @param {number|Function} [arg.style.strokeOffset] This is a value from -1
 *   (left) to 1 (right), with 0 being centered.  This can vary by point.
 * @param {string|Function} [arg.style.lineCap] One of 'butt' (default),
 *   'square', or 'round'.  This can vary by point.
 * @param {string|Function} [arg.style.lineJoin] One of 'miter' (default),
 *   'bevel', 'round', or 'miter-clip'.  This can vary by point.
 * @param {number|Function} [arg.style.closed] If true and the renderer
 *   supports it, connect the first and last points of a line if the line has
 *   more than two points.  This applies per line (if a function, it is called
 *   with (lineEntry, lineEntryIndex).
 * @param {number|Function} [arg.style.miterLimit] For lines of more than two
 *   segments that are mitered, if the miter length exceeds the strokeWidth
 *   divided by the sine of half the angle between segments, then a bevel join
 *   is used instead.  This is a single value that applies to all lines.  If a
 *   function, it is called with (data).
 * @param {string|Function} [arg.style.antialiasing] Antialiasing distance in
 *   pixels.  Values must be non-negative.  A value greater than 1 will produce
 *   a visible gradient.  This is a single value that applies to all lines.
 * @param {string|Function} [arg.style.debug] If 'debug', render lines in debug
 *   mode.  This is a single value that applies to all lines.
 * @returns {geo.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof lineFeature)) {
    return new lineFeature(arg);
  }

  var $ = require('jquery');

  arg = arg || {};
  feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      m_pointSearchTime = timestamp(),
      m_pointSearchInfo;

  this.featureType = 'line';
  this._subcomponentStyles = {
    lineCap: true,
    lineJoin: true,
    strokeColor: true,
    strokeOffset: true,
    strokeOpacity: true,
    strokeWidth: true
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set line accessor
   *
   * @returns {geo.pointFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set position accessor
   *
   * @returns {geo.pointFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Cache information needed for point searches.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._updatePointSearchInfo = function () {
    if (m_pointSearchTime.getMTime() >= m_this.dataTime().getMTime()) {
      return;
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
        if (closed && last.x !== first.p.x && last.y !== first.p.y) {
          record.push({u: last, v: first.p, r2: lastr2 > first.r2 ? lastr2 : first.r2});
        }
      });
      m_pointSearchInfo.push(record);
    });
    return m_pointSearchInfo;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns an array of datum indices that contain the given point.
   * This is a slow implementation with runtime order of the number of
   * vertices.  A point is considered on a line segment if it is close to the
   * line or either end point.  Closeness is based on the maximum width of the
   * line segement, and is ceil(maxwidth / 2) + 2 pixels.  This means that
   * corner extensions due to mitering may be outside of the selection area and
   * that variable width lines will have a greater selection region than their
   * visual size at the narrow end.
   */
  ////////////////////////////////////////////////////////////////////////////
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
        pt = transform.transformCoordinates(m_this.gcs(), map.gcs(), p),
        i, j, record;

    // minimum l2 distance squared from
    // q -> line(u, v)
    function lineDist2(q, u, v) {
      var t, vux = v.x - u.x, vuy = v.y - u.y, l2 = vux * vux + vuy * vuy;

      if (l2 < 1) {
        // u, v are within 1 pixel
        return dist2(q, u);
      }

      t = ((q.x - u.x) * vux + (q.y - u.y) * vuy) / l2;
      if (t < 0) { return dist2(q, u); }
      if (t > 1) { return dist2(q, v); }
      return dist2(q, {x: u.x + t * vux, y: u.y + t * vuy});
    }

    // l2 distance squared from u to v
    function dist2(u, v) {
      var dx = u.x - v.x,
          dy = u.y - v.y;
      return dx * dx + dy * dy;
    }

    for (i = 0; i < m_pointSearchInfo.length; i += 1) {
      record = m_pointSearchInfo[i];
      for (j = 0; j < record.length; j += 1) {
        if (lineDist2(pt, record[j].u, record[j].v) <= record[j].r2 * scale2) {
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns an array of line indices that are contained in the given box.
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
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
  };

  this._init(arg);
  return this;
};

/**
 * Create a lineFeature from an object.
 * @see {@link geo.feature.create}
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.lineFeature.spec} spec The object specification
 * @returns {geo.lineFeature|null}
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
