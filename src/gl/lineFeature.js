//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.gl
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of lineFeature
 *
 * @class
 * @returns {ggl.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.lineFeature = function (arg) {
  "use strict";
  if (!(this instanceof ggl.lineFeature)) {
    return new ggl.lineFeature(arg);
  }
  arg = arg || {};
  geo.lineFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_actor = null,
      //m_buildTime = vgl.timestamp(),
      s_init = this._init,
      s_update = this._update;

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
    var style = m_this.style();

    if (m_actor) {
      m_this.renderer().contextRenderer().removeActor(m_actor);
    }

    m_actor = vgl.utils.createLines(m_this.positions(), style.colors);

    m_this.renderer().contextRenderer().addActor(m_actor);
    m_this.buildTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    var style =  m_this.style();

    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime()) {
      m_this._build();
    }

    if (m_this.updateTime().getMTime() <= m_this.getMTime()) {
      if (m_this.style.color instanceof vgl.lookupTable) {
        vgl.utils.updateColorMappedMaterial(m_this.material(),
          m_this.style.color);
      }

      m_actor.setVisible(m_this.visible());
      m_actor.material().setBinNumber(m_this.bin());
      // console.log(m_actor.material().binNumber());

      /// Points only has support for size
      if (style.size) {
        m_actor.material().shaderProgram().uniform("pointSize").set(
          style.size);
      }
    }
    m_this.updateTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    m_this.renderer().contextRenderer().removeActor(m_actor);
  };

  this._init(arg);
  return this;
};

inherit(ggl.lineFeature, geo.lineFeature);

// Now register it
geo.registerFeature("vgl", "line", ggl.lineFeature);
