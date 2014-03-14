//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of planeFeature
 *
 * @class
 * Create a plane feature given a lower left corner point {geo.latlng}
 * and and upper right corner point {geo.latlng}
 * @param lowerleft
 * @param upperright
 * @returns {geo.planeFeature}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.planeFeature = function(arg) {
  "use strict";
  if (!(this instanceof ggl.planeFeature)) {
    return new ggl.planeFeature(arg);
  }
  geo.planeFeature.call(this, arg);

  var m_this = this,
      m_actor = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gets the coordinates for this plane
   *
   * @returns {Array} [[origin], [upper left] [lower right]]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.coords = function() {
    return [this.origin(), this.upperLeft(), this.lowerRight()];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build this feature
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function() {
    var or = this.origin(),
        ul = this.upperLeft(),
        lr = this.lowerRight(),
        image = null,
        imageSrc = this.style().image,
        texture = null;

    if (m_actor) {
      this.renderer()._contextRenderer().removeActor(m_actor);
    }

    if (imageSrc) {
      image = new Image();
      image.src = imageSrc;
      m_actor = vgl.utils.createTexturePlane(or[0], or[1], or[2],
                  lr[0], lr[1], lr[2],
                  ul[0], ul[1], ul[2], true);
      m_this.renderer()._contextRenderer().addActor(m_actor);
      image.onload = function() {
        texture = vgl.texture();
        texture.setImage(image);
        m_actor.material().addAttribute(texture);
        m_this.renderer()._render();
      }
    }
    else {
      m_actor = vgl.utils.createPlane(or[0], or[1], or[2],
                  ul[0], ul[1], ul[2],
                  lr[0], lr[1], lr[2]);
    }
    this.buildTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function() {
    if (this.buildTime().getMTime() <= this.dataTime().getMTime()) {
      this._build();
    }
    if (this.updateTime().getMTime() <= this.getMTime()) {
      // TODO Implement this
    }

    this.updateTime().modified();
  };

  return this;
};

inherit(ggl.planeFeature, geo.planeFeature);

// Now register it
geo.registerFeature('webgl', 'planeFeature', ggl.planeFeature);