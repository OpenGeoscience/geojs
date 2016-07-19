var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class polygonFeature
 *
 * @class geo.polygonFeature
 * @extends geo.feature
 * @param {Object} arg Options object
 * @param {Object|Function} [arg.position] Position of the data.  Default is
 *   (data).
 * @param {Object|Function} [arg.polygon] Polygons from the data.  Default is
 *   (data).  Typically, the data is an array of polygons, each of which is
 *   of the form {outer: [(coordinates)], inner: [[(coordinates of first
 *   hole)], [(coordinates of second hole)], ...]}.  The inner record is
 *   optional.  Alternately, if there are no holes, a polygon can just be an
 *   array of coordinates.  Coordinates are in the form {x: (x), y: (y),
 *   z: (z)}, with z being optional.  The first and last point of each polygon
 *   must be the same.
 * @param {Object} [arg.style] Style object with default style options.
 * @param {boolean|Function} [arg.style.fill] True to fill polygon.  Defaults
 *   to true.
 * @param {Object|Function} [arg.style.fillColor] Color to fill each polygon.
 *   The color can vary by vertex.  Colors can be css names or hex values, or
 *   an object with r, g, b on a [0-1] scale.
 * @param {number|Function} [arg.style.fillOpacity] Opacity for each polygon.
 *   The opacity can vary by vertex.  Opacity is on a [0-1] scale.
 * @param {boolean|Function} [arg.style.stroke] True to stroke polygon.
 *   Defaults to false.
 * @param {Object|Function} [arg.style.strokeColor] Color to stroke each
 *   polygon.  The color can vary by vertex.  Colors can be css names or hex
 *   values, or an object with r, g, b on a [0-1] scale.
 * @param {number|Function} [arg.style.strokeOpacity] Opacity for each polygon
 *   stroke.  The opacity can vary by vertex.  Opacity is on a [0-1] scale.
 * @param {boolean|Function} [arg.style.uniformPolygon] Boolean indicating if
 *   each polygon has a uniform style (uniform fill color, fill opacity, stroke
 *   color, and stroke opacity).   Defaults to false.  Can vary by polygon.
 * @returns {geo.polygonFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var polygonFeature = function (arg) {
  'use strict';
  if (!(this instanceof polygonFeature)) {
    return new polygonFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  var util = require('./util');

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_position,
      m_polygon,
      m_lineFeature,
      s_init = this._init,
      s_exit = this._exit,
      s_data = this.data,
      s_draw = this.draw,
      s_modified = this.modified,
      s_style = this.style,
      m_coordinates = [];

  if (arg.polygon === undefined) {
    m_polygon = function (d) {
      return d;
    };
  } else {
    m_polygon = arg.polygon;
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
   * Get/set data.
   *
   * @memberof geo.polygonFeature
   * @param {Object} [data] if specified, use this for the data and return the
   *    feature.  If not specified, return the current data.
   * @returns {geo.polygonFeature|Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.data = function (arg) {
    var ret = s_data(arg);
    if (arg !== undefined) {
      getCoordinates();
    }
    return ret;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the internal coordinates whenever the data changes.  For now, we do
   * the computation in world coordinates, but we will need to work in GCS
   * for other projections.  Also compute the extents of the outside of each
   * polygon for faster checking if points are in the polygon.
   * @memberof geo.polygonFeature
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function getCoordinates() {
    var posFunc = m_this.position(),
        polyFunc = m_this.polygon();
    m_coordinates = m_this.data().map(function (d, i) {
      var poly = polyFunc(d);
      var outer, inner, range, coord, j, x, y;

      coord = poly.outer || (poly instanceof Array ? poly : []);
      outer = new Array(coord.length);
      for (j = 0; j < coord.length; j += 1) {
        outer[j] = posFunc.call(m_this, coord[j], j, d, i);
        x = outer[j].x || outer[j][0] || 0;
        y = outer[j].y || outer[j][1] || 0;
        if (!j) {
          range = {min: {x: x, y: y}, max: {x: x, y: y}};
        } else {
          if (x < range.min.x) { range.min.x = x; }
          if (y < range.min.y) { range.min.y = y; }
          if (x > range.max.x) { range.max.x = x; }
          if (y > range.max.y) { range.max.y = y; }
        }
      }
      inner = (poly.inner || []).map(function (hole) {
        coord = hole || [];
        var trans = new Array(coord.length);
        for (j = 0; j < coord.length; j += 1) {
          trans[j] = posFunc.call(m_this, coord[j], j, d, i);
        }
        return trans;
      });
      return {
        outer: outer,
        inner: inner,
        range: range
      };
    });
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set polygon accessor.
   *
   * @memberof geo.polygonFeature
   * @param {Object} [polygon] if specified, use this for the polygon accessor
   *    and return the feature.  If not specified, return the current polygon.
   * @returns {geo.polygonFeature|Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.polygon = function (val) {
    if (val === undefined) {
      return m_polygon;
    } else {
      m_polygon = val;
      m_this.dataTime().modified();
      m_this.modified();
      getCoordinates();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set position accessor.
   *
   * @memberof geo.polygonFeature
   * @param {Object} [position] if specified, use this for the position
   *    accessor and return the feature.  If not specified, return the current
   *    position.
   * @returns {geo.polygonFeature|Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.position = function (val) {
    if (val === undefined) {
      return m_position;
    } else {
      m_position = val;
      m_this.dataTime().modified();
      m_this.modified();
      getCoordinates();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Point search method for selection api.  Returns markers containing the
   * given point.
   *
   * @memberof geo.polygonFeature
   * @argument {object} coordinate
   * @returns {object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pointSearch = function (coordinate) {
    var found = [], indices = [], data = m_this.data();
    m_coordinates.forEach(function (coord, i) {
      var inside = util.pointInPolygon(
        coordinate,
        coord.outer,
        coord.inner,
        coord.range
      );
      if (inside) {
        indices.push(i);
        found.push(data[i]);
      }
    });
    return {
      index: indices,
      found: found
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set style used by the feature.  This calls the super function, then
   * checks if strokes are required.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.style = function (arg1, arg2) {
    var result = s_style.apply(this, arguments);
    if (arg1 !== undefined && (typeof arg1 !== 'string' || arg2 !== undefined)) {
      this._checkForStroke();
    }
    return result;
  };

  this.style.get = s_style.get;

  /**
   * Get an outer or inner loop of a polygon and return the necessary data to
   * use it for a closed polyline.
   *
   * @param {object} item: the polygon.
   * @param {number} itemIndex: the index of the polygon
   * @param {Array} loop: the inner or outer loop.
   * @param {function} posFunc: a function that gets the coordinates of a
   *    vertex.  Used to compare the first and last vertices of the polygon.
   *    If they do not match exactly, the first vertex is added at the end to
   *    close the polyline.
   * @returns {Array} the loop with the data necessary to send to the position
   *    function for each vertex.
   */
  this._getLoopData = function (item, itemIndex, loop, posFunc) {
    var line = [], i, startpos, endpos;

    for (i = 0; i < loop.length; i += 1) {
      line.push([loop[i], i, item, itemIndex]);
    }
    startpos = posFunc(loop[0], 0, item, itemIndex);
    endpos = posFunc(loop[loop.length - 1], loop.length - 1, item, itemIndex);
    if (startpos.x !== endpos.x || startpos.y !== endpos.y || startpos.z !== endpos.z) {
      line.push([loop[0], 0, item, itemIndex]);
    }
    return line;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if we need to add a line feature to the layer, and update it as
   * necessary.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._checkForStroke = function () {
    if (s_style('stroke') === false) {
      if (m_lineFeature && m_this.layer()) {
        m_this.layer().deleteFeature(m_lineFeature);
        m_lineFeature = null;
      }
      return;
    }
    if (!m_this.layer()) {
      return;
    }
    if (!m_lineFeature) {
      m_lineFeature = m_this.layer().createFeature(
        'line', {selectionAPI: false});
    }
    var polyStyle = m_this.style();
    m_lineFeature.style({
      strokeWidth: polyStyle.strokeWidth,
      strokeStyle: polyStyle.strokeStyle,
      strokeColor: polyStyle.strokeColor,
      strokeOpacity: function (d) {
        return m_this.style.get('stroke')(d[2], d[3]) ? m_this.style.get('strokeOpacity')(d[0], d[1], d[2], d[3]) : 0;
      }
    });
    var data = this.data(),
        posFunc = this.position();
    if (data !== m_lineFeature._lastData || posFunc !== m_lineFeature._posFunc) {
      var lineData = [], i, polygon, loop;

      for (i = 0; i < data.length; i += 1) {
        polygon = m_this.polygon()(data[i], i);
        loop = polygon.outer || (polygon instanceof Array ? polygon : []);
        lineData.push(m_this._getLoopData(data[i], i, loop, posFunc));
        if (polygon.inner) {
          polygon.inner.forEach(function (loop) {
            lineData.push(m_this._getLoopData(data[i], i, loop, posFunc));
          });
        }
      }
      m_lineFeature.position(function (d, i, item, itemIndex) {
        return posFunc(d[0], d[1], d[2], d[3]);
      });
      m_lineFeature.data(lineData);
      m_lineFeature._lastData = data;
      m_lineFeature._lastPosFunc = posFunc;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  * Redraw the object.
  */
  ////////////////////////////////////////////////////////////////////////////
  this.draw = function () {
    var result = s_draw();
    if (m_lineFeature) {
      m_lineFeature.draw();
    }
    return result;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  * When the feature is marked as modified, mark our sub-feature as modified,
  * too.
  */
  ////////////////////////////////////////////////////////////////////////////
  this.modified = function () {
    var result = s_modified();
    if (m_lineFeature) {
      m_lineFeature.modified();
    }
    return result;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   * @memberof geo.polygonFeature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    if (m_lineFeature && m_this.layer()) {
      m_this.layer().deleteFeature(m_lineFeature);
      m_lineFeature = null;
    }
    s_exit();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   * @memberof geo.polygonFeature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    arg = arg || {};
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        fill: true,
        fillColor: {r: 0.0, g: 0.5, b: 0.5},
        fillOpacity: 1.0,
        stroke: false,
        strokeWidth: 1.0,
        strokeStyle: 'solid',
        strokeColor: {r: 0.0, g: 1.0, b: 1.0},
        strokeOpacity: 1.0
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    if (m_position) {
      m_this.dataTime().modified();
    }
    this._checkForStroke();
  };

  /* Don't call _init here -- let subclasses call it */
  return this;
};

/**
 * Create a polygonFeature from an object.
 *
 * @see {@link geo.feature.create}
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.polygonFeature.spec} spec The object specification
 * @returns {geo.polygonFeature|null}
 */
polygonFeature.create = function (layer, spec) {
  'use strict';

  spec = spec || {};
  spec.type = 'polygon';
  return feature.create(layer, spec);
};

inherit(polygonFeature, feature);
module.exports = polygonFeature;
