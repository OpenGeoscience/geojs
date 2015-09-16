//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of choroplethFeature
 *
 * @class
 * @extends geo.choroplethFeature
 * @returns {geo.gl.choroplethFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.choroplethFeature = function (arg) {
  'use strict';

  if (!(this instanceof geo.gl.choroplethFeature)) {
    return new geo.gl.choroplethFeature(arg);
  }
  arg = arg || {};
  geo.choroplethFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_gl_polygons = null,
      s_exit = this._exit,
      s_init = this._init,
      s_update = this._update;  

  /* Create the choropleth.  This calls the base class to generate the contours,
   * into the various gl uniforms and buffers.
   */
  function createGLChoropleth() {
    return m_this.createChoropleth();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    m_this.buildTime().modified();
    return (m_gl_polygons = createGLChoropleth());
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
    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime() ||
        m_this.updateTime().getMTime() <= m_this.getMTime()) {
      m_this._wipePolygons();
      console.log("rebuilding");
      m_this._build();
    }
    m_this.updateTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy Polygon Sub-Features
   */
  ////////////////////////////////////////////////////////////////////////////
  this._wipePolygons = function () {
    if (m_gl_polygons) {
      m_gl_polygons.map(function(polygon){
        return polygon._exit();
      });
    }
    m_gl_polygons = null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    m_this._wipePolygons();
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(geo.gl.choroplethFeature, geo.choroplethFeature);

// Now register it
geo.registerFeature('vgl', 'choropleth', geo.gl.choroplethFeature);
