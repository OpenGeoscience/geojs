//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pointFeature
 *
 * @class
 * @returns {geo.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pointFeature = function (arg) {
  "use strict";
  if (!(this instanceof geo.pointFeature)) {
    return new geo.pointFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_position = arg.position === undefined ? function (d) { return d; } : arg.position,
      s_init = this._init,
      m_rangeTree = null,
      s_data = this.data;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set position
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
      m_this._updateRangeTree();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update the current range tree object.  Should be called whenever the
   * data changes.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._updateRangeTree = function () {
    var pts, position;
    position = m_this.position();

    // create an array of positions in geo coordinates
    pts = m_this.data().map(function (d, i) {
      var pt = position(d);
      pt.idx = i;
      return pt;
    });

    m_rangeTree = new geo.util.RangeTree(pts);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns an array of datum indices that contain the given point.
   * Largely adapted from wigglemaps pointQuerier:
   *
   * https://github.com/dotskapes/wigglemaps/blob/cf5bed3fbfe2c3e48d31799462a80c564be1fb60/src/query/PointQuerier.js
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pointSearch = function (p) {
    var min, max, radius, data, idx = [], box, found = [], ifound = [], map, pt;

    data = m_this.data();
    if (!m_this.data || !m_this.data.length) {
      return {
        found: [],
        index: []
      };
    }

    map = m_this.layer().map();
    pt = map.gcsToDisplay(p);

    // Get the radius of the points
    //   This is how wiggle maps implements the search, but it doesn't
    //   work in general when the radius of each point may be different
    //   Need to experiment to see if we can generalize the method without
    //   sacrificing too much speed.
    radius = m_this.style().radius(data[0]);

    // add extra padding for the stroke
    if (m_this.style().stroke(data[0])) {
      radius += m_this.style().strokeWidth(data[0]);
    }

    // Get the upper right corner in geo coordinates
    min = map.displayToGcs({
      x: pt.x - radius,
      y: pt.y + radius   // GCS coordinates are bottom to top
    });

    // Get the lower left corner in geo coordinates
    max = map.displayToGcs({
      x: pt.x + radius,
      y: pt.y - radius
    });

    // Find points inside the bounding box
    box = new geo.util.Box(geo.util.vect(min.x, min.y), geo.util.vect(max.x, max.y));
    m_rangeTree.search(box).forEach(function (q) {
      var dist, x, y, rad, i = q.idx;

      rad = m_this.style().radius(data[i]);
      x = p.x - q.x;
      y = p.y - q.y;
      dist = Math.sqrt(x * x + y * y);
      if (dist < rad) {
        idx.push(i);
      }
    });

    // Filter by circular region
    idx.forEach(function (i) {
      var d = m_this.data()[i],
          p = m_this.position()(d),
          dx, dy;
      p = map.gcsToDisplay(p);
      dx = p.x - pt.x;
      dy = p.y - pt.y;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        found.push(d);
        ifound.push(i);
      }
    });

    return {
      data: found,
      index: ifound
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns an array of datum indices that are contained in the given box.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.boxSearch = function (lowerLeft, upperRight) {
    var pos = m_this.position(),
        idx = [];
    m_this.data().forEach(function (d, i) {
      var p = pos(d);
      if (p.x >= lowerLeft.x &&
          p.x <= upperRight.x &&
          p.y >= lowerLeft.y &&
          p.y <= upperRight.y
      ) {
        idx.push(i);
      }
    });
    return idx;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Overloaded data method that updates the internal range tree on write.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.data = function (data) {
    if (data === undefined) {
      return s_data();
    }
    s_data(data);
    m_this._updateRangeTree();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns the bounding box for a given datum in screen coordinates as an
   * object:
   *
   * {
   *   min: {
   *     x: value,
   *     y: value
   *   },
   *   max: {
   *     x: value,
   *     y: value
   *   }
   * }
   *
   * @returns {object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._boundingBox = function (d) {
    var pt, radius;

    // get the position in geo coordinates
    pt = m_this.position()(d);

    // convert to screen coordinates
    pt = m_this.layer().map().gcsToDisplay(pt);

    // get the radius of the points (should we add stroke width?)
    radius = m_this.style().radius(d);

    return {
      min: {
        x: pt.x - radius,
        y: pt.y - radius
      },
      max: {
        x: pt.x + radius,
        y: pt.y + radius
      }
    };
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
        radius: function () { return 10.0; },
        stroke: function () { return true; },
        strokeColor: function () { return { r: 0.0, g: 1.0, b: 0.0 }; },
        strokeWidth: function () { return 2.0; },
        strokeOpacity: function () { return 1.0; },
        fillColor: function () { return { r: 1.0, g: 0.0, b: 0.0 }; },
        fill: function () { return true; },
        fillOpacity: function () { return 1.0; },
        sprites: false,
        sprites_image: null
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    if (m_position) {
      m_this.dataTime().modified();
    }
  };

  return m_this;
};

inherit(geo.pointFeature, geo.feature);
