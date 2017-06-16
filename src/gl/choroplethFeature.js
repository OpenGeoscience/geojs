var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var choroplethFeature = require('../choroplethFeature');

/**
 * Create a new instance of choroplethFeature
 *
 * @class geo.gl.choroplethFeature
 * @extends geo.choroplethFeature
 * @returns {geo.gl.choroplethFeature}
 */
var gl_choroplethFeature = function (arg) {
  'use strict';

  if (!(this instanceof gl_choroplethFeature)) {
    return new gl_choroplethFeature(arg);
  }
  arg = arg || {};
  choroplethFeature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      m_gl_polygons = null,
      s_exit = this._exit,
      s_init = this._init,
      s_draw = this.draw,
      s_update = this._update;

  /* Create the choropleth.  This calls the base class to generate the contours,
   * into the various gl uniforms and buffers.
   */
  function createGLChoropleth() {
    return m_this.createChoropleth();
  }

  this.draw = function () {
    m_this._update();
    if (m_gl_polygons) {
      for (var idx = 0; idx < m_gl_polygons.length; idx += 1) {
        m_gl_polygons[idx].draw();
      }
    }
    s_draw();
    return m_this;
  };

  /**
   * Initialize
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);
  };

  /**
   * Build
   *
   * @override
   */
  this._build = function () {
    m_this.buildTime().modified();
    return (m_gl_polygons = createGLChoropleth());
  };

  /**
   * Update
   *
   * @override
   */
  this._update = function () {
    s_update.call(m_this);
    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime() ||
        m_this.updateTime().getMTime() <= m_this.getMTime()) {
      m_this._wipePolygons();
      m_this._build();
    }
    m_this.updateTime().modified();
  };

  /**
   * Destroy Polygon Sub-Features
   */
  this._wipePolygons = function () {
    if (m_gl_polygons) {
      m_gl_polygons.map(function (polygon) {
        return polygon._exit();
      });
    }
    m_gl_polygons = null;
  };

  /**
   * Destroy
   */
  this._exit = function () {
    m_this._wipePolygons();
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(gl_choroplethFeature, choroplethFeature);

// Now register it
registerFeature('vgl', 'choropleth', gl_choroplethFeature);

module.exports = gl_choroplethFeature;
