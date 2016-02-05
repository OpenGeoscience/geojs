var inherit = require('../util').inherit;
var registerFeature = require('../util').registerFeature;
var planeFeature = require('../core/planeFeature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a plane feature given a lower left corner point
 * and and upper right corner point
 * @class geo.gl.planeFeature
 * @extends geo.planeFeature
 * @param lowerleft
 * @param upperright
 * @returns {geo.gl.planeFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var gl_planeFeature = function (arg) {
  'use strict';
  if (!(this instanceof gl_planeFeature)) {
    return new gl_planeFeature(arg);
  }
  planeFeature.call(this, arg);

  var transform = require('../core/transform');
  var vgl = require('vgl');

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
        img = m_this.style().image,
        image = null,
        texture = null,
        gcs = m_this.gcs(),
        map_gcs = m_this.layer().map().gcs();

    if (gcs !== map_gcs) {
      or = transform.transformCoordinates(gcs, map_gcs, or);
      ul = transform.transformCoordinates(gcs, map_gcs, ul);
      lr = transform.transformCoordinates(gcs, map_gcs, lr);
    }

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

      m_actor.material().shaderProgram().uniform('opacity').set(
        m_this.style().opacity !== undefined ? m_this.style().opacity : 1);

      m_this.renderer().contextRenderer().addActor(m_actor);

    } else {
      m_actor = vgl.utils.createTexturePlane(or[0], or[1], or[2],
        lr[0], lr[1], lr[2],
        ul[0], ul[1], ul[2], true);

      m_actor.material().shaderProgram().uniform('opacity').set(
        m_this.style().opacity !== undefined ? m_this.style().opacity : 1);

      texture = vgl.texture();
      m_this.visible(false);

      m_this.renderer().contextRenderer().addActor(m_actor);

      /* An image is already loaded if .complete is true and .naturalWidth
       * and .naturalHeight are defined and non-zero (not falsy seems to be
       * sufficient). */
      if (image.complete && image.naturalWidth && image.naturalHeight) {
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
      m_actor.material().shaderProgram().uniform('opacity').set(
        m_this.style().opacity !== undefined ? m_this.style().opacity : 1);
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

inherit(gl_planeFeature, planeFeature);

// Now register it
registerFeature('vgl', 'plane', gl_planeFeature);

module.exports = gl_planeFeature;
