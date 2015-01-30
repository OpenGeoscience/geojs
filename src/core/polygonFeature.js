//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class polygonFeature
 *
 * @class
 * @returns {geo.polygonFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.polygonFeature = function (arg) {
  "use strict";
  if (!(this instanceof geo.polygonFeature)) {
    return new geo.polygonFeature(arg);
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
      m_polygon,
      s_data = this.data,
      m_coordinates = {outer: [], inner: []};

  if (arg.line === undefined) {
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
   * Override the parent data method to keep track of changes to the
   * internal coordinates.
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
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function getCoordinates() {
    var posFunc = m_this.position(),
        polyFunc = m_this.polygon();
    m_coordinates = m_this.data().map(function (d, i) {
      var poly = polyFunc(d);
      var outer, inner;

      outer = (poly.outer || []).map(function (d0, j) {
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
   * Get/Set line accessor
   *
   * @returns {geo.pointFeature}
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
      getCoordinates();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Point searce method for selection api.  Returns markers containing the
   * given point.
   * @argument {Object} coordinate
   * @returns {Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pointSearch = function (coordinate) {
    var found = [], indices = [], data = m_this.data();
    m_coordinates.forEach(function (coord, i) {
      var inside = geo.util.pointInPolygon(
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

  this._init(arg);
  return this;
};

inherit(geo.polygonFeature, geo.feature);
