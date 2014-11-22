//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

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
      m_polygons,
      s_init = this._init;

  if (arg.line === undefined) {
    m_polygons = function (d) {
      return d;
    };
  } else {
    m_polygons = arg.line;
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
  this.polygons = function (val) {
    if (val === undefined) {
      return m_polygons;
    } else {
      m_polygons = val;
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

inherit(geo.polygonFeature, geo.feature);
