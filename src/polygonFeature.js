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
 *   (data).  The position is an Object which specifies the location of the
 *   data in geo-spatial context.
 * @param {Object|Function} [arg.polygon] Polygons from the data.  Default is
 *   (data).  Typically, the data is an array of polygons, each of which is
 *   of the form {outer: [(coordinates)], inner: [[(coordinates of first
 *   hole)], [(coordinates of second hole)], ...]}.  The inner record is
 *   optional.  Alternately, if there are no holes, a polygon can just be an
 *   array of coordinates.  Coordinates are in the form {x: (x), y: (y),
 *   z: (z)}, with z being optional.  The first and last point of each polygon
 *   must be the same.
 * @param {Object} [arg.style] Style object with default style options.
 * @param {Object|Function} [arg.style.fillColor] Color to fill each polygon.
 *   The color can vary by vertex.  Colors can be css names or hex values, or
 *   an object with r, g, b on a [0-1] scale.
 * @param {Object|Function} [arg.style.fillOpacity] Opacity for each polygon.
 *   The opacity can vary by vertex.  Opacity is on a [0-1] scale.
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
      s_init = this._init,
      s_data = this.data,
      m_coordinates = {outer: [], inner: []};

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
   * for other projections.
   * @memberof geo.polygonFeature
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function getCoordinates() {
    var posFunc = m_this.position(),
        polyFunc = m_this.polygon();
    m_coordinates = m_this.data().map(function (d, i) {
      var poly = polyFunc(d);
      var outer, inner;

      outer = (poly.outer || (poly instanceof Array ? poly : [])).map(function (d0, j) {
        return posFunc.call(m_this, d0, j, d, i);
      });

      inner = (poly.inner || []).map(function (hole) {
        return (hole || []).map(function (d0, k) {
          return posFunc.call(m_this, d0, k, d, i);
        });
      });
      return {
        outer: outer,
        inner: inner
      };
    });
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set polygon accessor.
   *
   * @memberof geo.polygonFeature
   * @param {Object} [polygon] if specified, use this for the polygon accesor
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
   * @param {Object} [position] if specified, use this for the position accesor
   *    and return the feature.  If not specified, return the current position.
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
        coord.inner
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
   * Initialize
   * @memberof geo.polygonFeature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        'fillColor': { r: 0.0, g: 0.5, b: 0.5 },
        'fillOpacity': 1.0
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

inherit(polygonFeature, feature);
module.exports = polygonFeature;
