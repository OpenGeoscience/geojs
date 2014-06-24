//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.gl
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @returns {ggl.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.pointFeature = function (arg) {
  "use strict";
  if (!(this instanceof ggl.pointFeature)) {
    return new ggl.pointFeature(arg);
  }
  arg = arg || {};
  geo.pointFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_actor = null,
      s_init = this._init,
      s_update = this._update;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(this, arg);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var style = m_this.style(),
    positions = geo.transform.transformFeature(m_this.renderer().map().gcs(),
                  this, false);

    if (m_actor) {
      this.renderer().contextRenderer().removeActor(m_actor);
    }

    if (style.point_sprites === true) {
      if (style.point_sprites_image !== null) {
        throw "[error] Invalid image for point sprites";
      }

      m_actor = vgl.utils.createPointSprites(style.point_sprites_image,
                 positions, style.colors);
    } else {
      m_actor = vgl.utils.createPoints(positions, style.colors);
    }

    this.renderer().contextRenderer().addActor(m_actor);
    this.buildTime().modified();
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

    s_update.call(this);

    if (this.dataTime().getMTime() >= this.buildTime().getMTime()) {
      this._build();
    }

    if (this.updateTime().getMTime() <= this.getMTime()) {
      if (this.style.color instanceof vgl.lookupTable) {
        vgl.utils.updateColorMappedMaterial(this.material(),
          this.style.color);
      }

      if (style.point_sprites === true) {
        if (style.point_sprites_image !== null) {
          throw "[error] Invalid image for point sprites";
        }

        if (style.width && style.height) {
          m_actor.material().shaderProgram().uniform("pointSize").set(
            [style.width, style.height]);
        }
        else if (style.size) {
          m_actor.material().shaderProgram().uniform("pointSize").set(
            [style.size, style.size]);
        }
      } else {
        /// Points only has support for size
        if (style.size) {
          m_actor.material().shaderProgram().uniform("pointSize").set(
            style.size);
        }
      }
    }
    this.updateTime().modified();
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

inherit(ggl.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature("vgl", "point", ggl.pointFeature);
