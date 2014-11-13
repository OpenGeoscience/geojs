//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.d3
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @returns {gd3.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.pointFeature = function (arg) {
  'use strict';
  if (!(this instanceof gd3.pointFeature)) {
    return new gd3.pointFeature(arg);
  }
  arg = arg || {};
  geo.pointFeature.call(this, arg);
  gd3.object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      s_update = this._update,
      m_buildTime = geo.timestamp(),
      m_style = {},
      m_sticky;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);
    m_sticky = m_this.layer().sticky();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var data = m_this.data(),
        s_style = m_this.style.get(),
        m_renderer = m_this.renderer(),
        pos_func = m_this.position();

    // call super-method
    s_update.call(m_this);

    // default to empty data array
    if (!data) { data = []; }

    // fill in d3 renderer style object defaults
    m_style.id = m_this._d3id();
    m_style.data = data;
    m_style.append = 'circle';
    m_style.attributes = {
      r: m_renderer._convertScale(s_style.radius),
      cx: function (d) {
        return m_renderer.worldToDisplay(pos_func(d)).x;
      },
      cy: function (d) {
        return m_renderer.worldToDisplay(pos_func(d)).y;
      }
    };
    m_style.style = s_style;
    m_style.classes = [ 'd3PointFeature' ];

    // pass to renderer to draw
    m_this.renderer()._drawFeatures(m_style);

    // update time stamps
    m_buildTime.modified();
    m_this.updateTime().modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    s_update.call(m_this);

    if (m_this.getMTime() >= m_buildTime.getMTime()) {
      m_this._build();
    }

    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(gd3.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature('d3', 'point', gd3.pointFeature);
