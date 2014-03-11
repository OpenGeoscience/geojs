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
ggl.planeFeature = function(lowerleft, upperright, z) {
  "use strict";
  if (!(this instanceof geo.planeFeature)) {
    return new geo.planeFeature(lowerleft, upperright);
  }
  geo.polygonFeature.call(this);

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
        image = this.style().image,
        texture = null;

    if (image) {
      m_actor = vgl.utils.createTexturePlane(or[0], or[1], or[2],
                  ul[0], ul[1], ul[2],
                  lr[0], lr[1], lr[2]);
        image.onload = function() {
          texture = vgl.texture();
          texture.setImage(image);
          m_actor.material().addAttribute(texture);
          m_actor.material().setBinNumber(m_that.binNumber());
          this.renderer()._render();
        }
      };
    } else {
      m_actor = vgl.utils.createPlane(or[0], or[1], or[2],
                  ul[0], ul[1], ul[2],
                  lr[0], lr[1], lr[2]);
    }
    this.buildTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function() {
    if (this.buildTime().getMTime() < this.dataTime().getMTime())
      this._build();
    }
    if (this.updateTime().getMTime() < this.getMTime()) {
      // TODO Implement this
    }

    this.updateTime().modified();
  };

  return this;
};

inherit(geo.planeFeature, geo.polygonFeature);