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
		// we need to drop these polygons
		if (m_gl_polygons) {
			return m_gl_polygons;
		} else {
			//call build on all polygons
			return m_gl_polygons = createGLChoropleth();
		}
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
      m_this._build();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   */
  ////////////////////////////////////////////////////////////////////////////
	this._exit = function () {
		console.log('firing exit');
		// somehow destroy subfeatures
		if (m_gl_polygons) {
			m_gl_polygons.map(function(polygon){
				if (polygon) return polygon._exit();
			});
		}
    m_this.renderer().contextRenderer().removeActor(m_actor);
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(geo.gl.choroplethFeature, geo.choroplethFeature);

// Now register it
geo.registerFeature('vgl', 'choropleth', geo.gl.choroplethFeature);
