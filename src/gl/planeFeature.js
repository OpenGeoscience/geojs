//////////////////////////////////////////////////////////////////////////////
/**
 * Create a plane feature given a lower left corner point geo.latlng
 * and and upper right corner point geo.latlng
 * @class
 * @extends geo.planeFeature
 * @param lowerleft
 * @param upperright
 * @returns {geo.planeFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.planeFeature = function (arg) {
  "use strict";
  if (!(this instanceof geo.gl.planeFeature)) {
    return new geo.gl.planeFeature(arg);
  }
  geo.planeFeature.call(this, arg);

  var m_this = this,
      s_exit = this._exit,
      m_actor = null,
      m_onloadCallback = arg.onload === undefined ? null : arg.onload;

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
        img = m_this.style("image"),
        image = null,
        texture = null;

    /// TODO If for some reason base layer changes its gcs at run time
    /// then we need to trigger an event to rebuild every feature
    or = geo.transform.transformCoordinates(m_this.gcs(),
                                            m_this.layer().map().gcs(),
                                            or);
    ul = geo.transform.transformCoordinates(m_this.gcs(),
                                            m_this.layer().map().gcs(),
                                            ul);
    lr = geo.transform.transformCoordinates(m_this.gcs(),
                                            m_this.layer().map().gcs(),
                                            lr);

    m_this.buildTime().modified();

    if (m_actor) {
      m_this.renderer().contextRenderer().removeActor(m_actor);
    }

    if (img && img instanceof Image) {
      image = img;
    } else if (img) {
      image = new Image();
      image.src = img;
    }

    if (!image) {
      m_actor = vgl.utils.createPlane(or[0], or[1], or[2],
        ul[0], ul[1], ul[2],
        lr[0], lr[1], lr[2]);

      m_this.renderer().contextRenderer().addActor(m_actor);

    } else {
      m_actor = vgl.utils.createTexturePlane(or[0], or[1], or[2],
        lr[0], lr[1], lr[2],
        ul[0], ul[1], ul[2], true);
      texture = vgl.texture();
      m_this.visible(false);

      /// TODO: Is there a reliable way to make sure that image is loaded already?
      m_this.renderer().contextRenderer().addActor(m_actor);

      if (image.complete) {
        texture.setImage(image);
        m_actor.material().addAttribute(texture);
        /// NOTE Currently we assume that we want to show the feature as
        /// soon as the image gets loaded. However, there might be a case
        /// where we want to lock down the visibility. We will deal with that
        /// later.
        m_this.visible(true);

        if (m_onloadCallback) {
          m_onloadCallback.call(m_this);
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

          if (m_onloadCallback) {
            m_onloadCallback.call(m_this);
          }

          if (m_this.drawOnAsyncResourceLoad()) {
            m_this._update();
            m_this.layer().draw();
          }
        };
      }
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
    s_exit();
  };

  return this;
};

inherit(geo.gl.planeFeature, geo.planeFeature);

// Now register it
geo.registerFeature("vgl", "plane", geo.gl.planeFeature);
