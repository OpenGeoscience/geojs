var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var quadFeature = require('../quadFeature');
var util = require('../util');

/**
 * Create a new instance of class quadFeature.
 *
 * @class geo.canvas.quadFeature
 * @param {geo.quadFeature.spec} arg Options object.
 * @extends geo.quadFeature
 * @returns {geo.canvas.quadFeature}
 */
var canvas_quadFeature = function (arg) {
  'use strict';

  if (!(this instanceof canvas_quadFeature)) {
    return new canvas_quadFeature(arg);
  }
  quadFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  var $ = require('jquery');

  var m_this = this,
      s_exit = this._exit,
      s_init = this._init,
      s_update = this._update,
      m_quads;

  /**
   * Build this feature.
   */
  this._build = function () {
    if (!m_this.position()) {
      return;
    }
    m_quads = this._generateQuads();

    if (m_quads.imgQuads) {
      m_quads.imgQuads.sort(function (a, b) {
        return a.pos[2] - b.pos[2];
      });
    }
    m_this.buildTime().modified();
  };

  /**
   * When any quad may have changed, ask for a animation frame callback so we
   * can update the quad on the next animation cycle.
   *
   * This is called when a video qaud may have changed play state.
   * @param {object} quad The quad record that triggered this.
   * @param {jQuery.Event} [evt] The event that triggered this.
   */
  this._checkQuadUpdate = function (quad, evt) {
    m_this.layer().map().scheduleAnimationFrame(m_this._checkIfChanged);
  };

  /**
   * Check if any video quads are changing or need rerendering.  If any are
   * changing (because they are seeking), defer rendering and check again.  If
   * any need rendering, schedule it.
   */
  this._checkIfChanged = function () {
    if (!m_quads || !m_quads.vidQuads || !m_quads.vidQuads.length) {
      return;
    }
    var render = false, changing = false;

    $.each(m_quads.vidQuads, function (idx, quad) {
      if (quad.video && quad.video.HAVE_CURRENT_DATA !== undefined) {
        if (!quad.video.seeking && quad.video.readyState >= quad.video.HAVE_CURRENT_DATA) {
          render = true;
        }
        if (!quad.video.paused || quad.video.seeking) {
          changing = true;
        }
      }
    });
    if (render) {
      m_this.renderer()._render();
    }
    if (changing) {
      m_this.layer().map().scheduleAnimationFrame(m_this._checkIfChanged);
    }
  };

  /**
   * Render all of the color quads.
   *
   * @param {CanvasRenderingContext2D} context2d The rendering context.
   * @param {geo.map} map The current renderer's parent map.
   */
  this._renderColorQuads = function (context2d, map) {
    if (!m_quads.clrQuads || !m_quads.clrQuads.length) {
      return;
    }
    var oldAlpha = context2d.globalAlpha;
    var opacity = oldAlpha;
    $.each(m_quads.clrQuads, function (idx, quad) {
      var p0 = map.gcsToDisplay({x: quad.pos[0], y: quad.pos[1]}, null),
          p1 = map.gcsToDisplay({x: quad.pos[3], y: quad.pos[4]}, null),
          p2 = map.gcsToDisplay({x: quad.pos[6], y: quad.pos[7]}, null),
          p3 = map.gcsToDisplay({x: quad.pos[9], y: quad.pos[10]}, null);
      if (quad.opacity !== opacity) {
        opacity = quad.opacity;
        context2d.globalAlpha = opacity;
      }
      context2d.fillStyle = util.convertColorToHex(quad.color, true);
      context2d.beginPath();
      context2d.moveTo(p0.x, p0.y);
      context2d.lineTo(p1.x, p1.y);
      context2d.lineTo(p3.x, p3.y);
      context2d.lineTo(p2.x, p2.y);
      context2d.closePath();
      context2d.fill();
    });
    if (opacity !== oldAlpha) {
      context2d.globalAlpha = oldAlpha;
    }
  };

  /**
   * Render all of the image and video quads.
   *
   * @param {CanvasRenderingContext2D} context2d The rendering context.
   * @param {geo.map} map The current renderer's parent map.
   */
  this._renderImageAndVideoQuads = function (context2d, map) {
    if ((!m_quads.imgQuads || !m_quads.imgQuads.length) &&
        (!m_quads.vidQuads || !m_quads.vidQuads.length)) {
      return;
    }

    var oldAlpha = context2d.globalAlpha;
    var opacity = oldAlpha;
    $.each([m_quads.imgQuads, m_quads.vidQuads], function (listidx, quadlist) {
      if (!quadlist) {
        return;
      }
      $.each(quadlist, function (idx, quad) {
        var src, w, h;
        if (quad.image) {
          src = quad.image;
          w = src.width;
          h = src.height;
        } else if (quad.video) {
          src = quad.video;
          w = src.videoWidth;
          h = src.videoHeight;
          if (src.seeking) {
            return;
          }
        }
        if (!src || !w || !h || quad.opacity <= 0) {
          return;
        }
        // Canvas transform is affine, so quad has to be a parallelogram
        // Also, canvas has no way to render z.
        var p0 = map.gcsToDisplay({x: quad.pos[0], y: quad.pos[1]}, null),
            p2 = map.gcsToDisplay({x: quad.pos[6], y: quad.pos[7]}, null),
            p3 = map.gcsToDisplay({x: quad.pos[9], y: quad.pos[10]}, null);
        context2d.setTransform((p3.x - p2.x) / w, (p3.y - p2.y) / w,
                               (p0.x - p2.x) / h, (p0.y - p2.y) / h,
                               p2.x, p2.y);
        if (quad.opacity !== opacity) {
          opacity = quad.opacity;
          context2d.globalAlpha = opacity;
        }
        if (!quad.crop) {
          context2d.drawImage(src, 0, 0);
        } else {
          context2d.drawImage(src, 0, 0, quad.crop.x, quad.crop.y, 0, 0,
                              quad.crop.x, quad.crop.y);
        }
      });
    });
    if (opacity !== oldAlpha) {
      context2d.globalAlpha = oldAlpha;
    }
    context2d.setTransform(1, 0, 0, 1, 0, 0);
  };

  /**
   * If this returns true, the render will be skipped and tried again on the
   * next animation frame.
   *
   * @returns {boolean} Truthy to delay rendering.
   */
  this._delayRender = function () {
    var delay = false;
    if (m_quads && m_quads.vidQuads && m_quads.vidQuads.length) {
      $.each(m_quads.vidQuads, function (idx, quad) {
        if (quad.video && quad.video.HAVE_CURRENT_DATA !== undefined) {
          delay |= (quad.video.seeking && quad.delayRenderWhenSeeking);
        }
      });
    }
    return delay;
  };

  /**
   * Render all of the quads.
   *
   * @param {CanvasRenderingContext2D} context The rendering context.
   * @param {geo.map} map The current renderer's parent map.
   */
  this._renderOnCanvas = function (context, map) {
    if (m_quads) {
      this._renderImageAndVideoQuads(context, map);
      this._renderColorQuads(context, map);
    }
  };

  /**
   * Update.
   */
  this._update = function () {
    s_update.call(m_this);
    if (m_this.buildTime().getMTime() <= m_this.dataTime().getMTime() ||
        m_this.updateTime().getMTime() < m_this.getMTime()) {
      m_this._build();
    }

    m_this.updateTime().modified();
    m_this.layer().map().scheduleAnimationFrame(m_this._checkIfChanged);
  };

  /**
   * Initialize.
   */
  this._init = function () {
    s_init.call(m_this, arg);
  };

  /**
   * Destroy.
   */
  this._exit = function () {

    s_exit.call(m_this);
  };

  m_this._init(arg);
  return this;
};

inherit(canvas_quadFeature, quadFeature);

// Now register it
var capabilities = {};
capabilities[quadFeature.capabilities.color] = true;
capabilities[quadFeature.capabilities.image] = true;
capabilities[quadFeature.capabilities.imageCrop] = true;
capabilities[quadFeature.capabilities.imageFixedScale] = true;
capabilities[quadFeature.capabilities.imageFull] = false;
capabilities[quadFeature.capabilities.canvas] = true;
capabilities[quadFeature.capabilities.video] = true;

registerFeature('canvas', 'quad', canvas_quadFeature, capabilities);
module.exports = canvas_quadFeature;
