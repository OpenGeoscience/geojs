//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class lineFeature
 *
 * @class
 * @returns {geo.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.lineFeature = function (arg) {
  "use strict";
  if (!(this instanceof geo.lineFeature)) {
    return new geo.lineFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_position,
      m_line,
      s_init = this._init;

  if (arg.line === undefined) {
    m_line = function (d) {
      return d;
    };
  } else {
    m_line = arg.line;
  }

  if (arg.position === undefined) {
    m_position = function (d) {
      return d;
    };
  } else {
    m_position = arg.position;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set line accessor
   *
   * @returns {geo.pointFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.line = function (val) {
    if (val === undefined) {
      return m_line;
    } else {
      m_line = val;
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
      return m_position;
    } else {
      m_position = val;
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns an array of datum indices that contain the given point.
   * This is a slow implementation with runtime order of the number of
   * vertices.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pointSearch = function (p) {
    var data, pt, map, line, width, indices = [], found = [], pos;
    data = m_this.data();
    if (!data || !data.length) {
      return {
        found: [],
        index: []
      };
    }

    map = m_this.layer().map();
    line = m_this.line();
    width = m_this.style.get("strokeWidth");
    pos = m_this.position();
    pt = map.gcsToDisplay(p);

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
      var last = null;

      try {
        line(d, index).forEach(function (current, j) {

          // get the screen coordinates of the current point
          var p = pos(current, j, d, index);
          var s = map.gcsToDisplay(p);
          var r = Math.ceil(width(p, j, d, index) / 2) + 2;
          r = r * r;

          if (last) {
            // test the line segment s -> last
            if (lineDist2(pt, s, last) <= r) {

              // short circuit the loop here
              throw "found";
            }
          }

          last = s;
        });
      } catch (err) {
        if (err !== "found") {
          throw err;
        }
        found.push(d);
        indices.push(index);
      }
    });

    return {
      data: found,
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
      throw "Unimplemented query method.";
    }

    m_this.data().forEach(function (d, i) {
      var inside = true;
      line(d, i).forEach(function (e, j) {
        if (!inside) { return; }
        var p = pos(e, j, d, i);
        if (!(p.x >= lowerLeft.x  &&
              p.x <= upperRight.x &&
              p.y >= lowerLeft.y  &&
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
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        "strokeWidth": 1.0,
        // Default to gold color for lines
        "strokeColor": { r: 1.0, g: 0.8431372549, b: 0.0 },
        "strokeStyle": "solid",
        "strokeOpacity": 1.0
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    if (m_position) {
      m_this.dataTime().modified();
    }
  };

  this._init(arg);
  return this;
};

inherit(geo.lineFeature, geo.feature);
