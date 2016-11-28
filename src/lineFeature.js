var inherit = require('./inherit');
var feature = require('./feature');

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
      s_init = this._init;

  this.featureType = 'line';

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
    var data, pt, line, width, indices = [], found = [], pos;
    data = m_this.data();
    if (!data || !data.length) {
      return {
        found: [],
        index: []
      };
    }

    line = m_this.line();
    width = m_this.style.get('strokeWidth');
    pos = m_this.position();
    pt = m_this.featureGcsToDisplay(p);

    // minimum l2 distance squared from
    // q -> line(u, v)
    function lineDist2(q, u, v) {
      var t, l2 = dist2(u, v);

      if (l2 < 1) {
        // u, v are within 1 pixel
        return dist2(q, u);
      }

      t = ((q.x - u.x) * (v.x - u.x) + (q.y - u.y) * (v.y - u.y)) / l2;
      if (t < 0) { return dist2(q, u); }
      if (t > 1) { return dist2(q, v); }
      return dist2(
        q,
        {
          x: u.x + t * (v.x - u.x),
          y: u.y + t * (v.y - u.y)
        }
      );
    }

    // l2 distance squared from u to v
    function dist2(u, v) {
      var dx = u.x - v.x,
          dy = u.y - v.y;
      return dx * dx + dy * dy;
    }

    // for each line
    data.forEach(function (d, index) {
      var closed = m_this.style.get('closed')(d, index),
          last, lastr, first;

      try {
        line(d, index).forEach(function (current, j) {

          // get the screen coordinates of the current point
          var p = pos(current, j, d, index);
          var s = m_this.featureGcsToDisplay(p);
          var r = Math.ceil(width(p, j, d, index) / 2) + 2;

          if (last) {
            var r2 = lastr > r ? lastr * lastr : r * r;
            // test the line segment s -> last
            if (lineDist2(pt, s, last) <= r2) {
              // short circuit the loop here
              throw 'found';
            }
          }

          last = s;
          lastr = r;
          if (!first && closed) {
            first = {s: s, r: r};
          }
        });
        if (closed && lineDist2(pt, last, first.s) <= first.r) {
          throw 'found';
        }
      } catch (err) {
        if (err !== 'found') {
          throw err;
        }
        found.push(d);
        indices.push(index);
      }
    });

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
