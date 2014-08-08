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
ggl.planeFeature = function (arg) {
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
  this.coords = function () {
    return [m_this.origin(), m_this.upperLeft(), m_this.lowerRight()];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build this feature
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var or = m_this.origin(),
        ul = m_this.upperLeft(),
        lr = m_this.lowerRight(),
        /// img could be a source or an Image
        img = m_this.style().image,
        image = null,
        onloadCallback = null,
        texture = null;

    m_this.buildTime().modified();

    if (m_actor) {
      m_this.renderer().contextRenderer().removeActor(m_actor);
    }

    if (img && img instanceof Image) {
      image = img;
      onloadCallback = img.onload;
    } else if (img) {
      image = new Image();
      image.src = img;
    }

    if (!image) {
      m_actor = vgl.utils.createPlane(or[0], or[1], or[2],
        ul[0], ul[1], ul[2],
        lr[0], lr[1], lr[2]);
    } else {
      m_actor = vgl.utils.createTexturePlane(or[0], or[1], or[2],
        lr[0], lr[1], lr[2],
        ul[0], ul[1], ul[2], true);
      texture = vgl.texture();
      m_this.visible(false);

      /// TODO: Is there a reliable way to make sure that image is loaded already?
      if (image.complete) {
        texture.setImage(image);
        m_actor.material().addAttribute(texture);
        /// NOTE Currently we assume that we want to show the feature as
        /// soon as the image gets loaded. However, there might be a case
        /// where we want to lock down the visibility. We will deal with that
        /// later.
        m_this.visible(true);

        if (onloadCallback) {
          onloadCallback.call(m_this);
        }
        //}
      } else {
        image.onload = function () {
          texture.setImage(image);
          m_actor.material().addAttribute(texture);
          /// NOTE Currently we assume that we want to show the feature as
          /// soon as the image gets loaded. However, there might be a case
          /// where we want to lock down the visibility. We will deal with that
          /// later.
          m_this.visible(true);

          if (onloadCallback) {
            onloadCallback.call(m_this);
          }

          if (m_this.drawOnAsyncResourceLoad()) {
            m_this._update();
            m_this.layer()._draw();
          }
        };
      }
    }
    m_this.renderer().contextRenderer().addActor(m_actor);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    if (m_this.buildTime().getMTime() <= m_this.dataTime().getMTime()) {
      m_this._build();
    }
    if (m_this.updateTime().getMTime() <= m_this.getMTime()) {
      m_actor.setVisible(m_this.visible());
      m_actor.material().setBinNumber(m_this.bin());
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

  return this;
};

inherit(ggl.planeFeature, geo.planeFeature);

// Now register it
geo.registerFeature("vgl", "plane", ggl.planeFeature);
