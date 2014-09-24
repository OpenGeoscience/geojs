//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class lineFeature
 *
 * @class
 * @returns {gd3.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof gd3.lineFeature)) {
    return new gd3.lineFeature(arg);
  }
  arg = arg || {};
  geo.lineFeature.call(this, arg);
  gd3.object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      m_buildTime = geo.timestamp(),
      s_update = this._update,
      m_style = {};

  m_style.style = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);
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
    var data = m_this.data() || [],
        s_style = m_this.style(),
        m_renderer = m_this.renderer(),
        pos_func = m_this.position(),
        line = d3.svg.line()
                .x(function (d) { return m_renderer.worldToDisplay(pos_func(d)).x; })
                .y(function (d) { return m_renderer.worldToDisplay(pos_func(d)).y; });
    s_update.call(m_this);

    // set the style object for the renderer
    m_style.data = data;
    m_style.attributes = {
      d: line
    };

    m_style.id = m_this._d3id();
    m_style.append = 'path';
    m_style.classes = [ 'd3LineFeature' ];
    m_style.style = $.extend({
      fill: function () { return false; }
    }, s_style);

    m_renderer._drawFeatures(m_style);

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

    if (m_this.dataTime().getMTime() >= m_buildTime.getMTime()) {
      m_this._build();
    }

    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(gd3.lineFeature, geo.lineFeature);

geo.registerFeature('d3', 'line', gd3.lineFeature);
