var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var quadFeature = require('../quadFeature');

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
   * Render all of the color quads.
   *
   * @param {CanvasRenderingContext2D} context2d The rendering context.
   * @param {geo.map} map The current renderer's parent map.
   */
  this._renderColorQuads = function (context2d, map) {
    // Not implemented yet.
  };

  /**
   * Render all of the image quads.
   *
   * @param {CanvasRenderingContext2D} context2d The rendering context.
   * @param {geo.map} map The current renderer's parent map.
   */
  this._renderImageQuads = function (context2d, map) {
    if (!m_quads.imgQuads.length) {
      return;
    }

    var oldAlpha = context2d.globalAlpha;
    var opacity = oldAlpha;
    $.each(m_quads.imgQuads, function (idx, quad) {
      if (!quad.image) {
        return;
      }
      var w = quad.image.width,
          h = quad.image.height;
      // Canvas transform is affine, so quad has to be a parallelogram
      // Also, canvas has no way to render z.
      var p0 = map.gcsToDisplay({x:quad.pos[0], y:quad.pos[1]}, null),
          p3 = map.gcsToDisplay({x:quad.pos[9], y:quad.pos[10]}, null),
          p2 = map.gcsToDisplay({x:quad.pos[6], y:quad.pos[7]}, null);
      context2d.setTransform((p3.x - p2.x) / w, (p3.y - p2.y) / h,
                             (p0.x - p2.x) / w, (p0.y - p2.y) / h,
                             p2.x, p2.y);
      if (quad.opacity !== opacity) {
        opacity = quad.opacity;
        context2d.globalAlpha = opacity;
      }
      if (!quad.crop) {
        context2d.drawImage(quad.image, 0, 0);
      } else {
        context2d.drawImage(quad.image, 0, 0, quad.crop.x, quad.crop.y, 0, 0,
                            quad.crop.x, quad.crop.y);
      }
    });
    if (opacity !== oldAlpha) {
      context2d.globalAlpha = oldAlpha;
    }
  };

  /**
   * Render all of the quads.
   *
   * @param {CanvasRenderingContext2D} context The rendering context.
   * @param {geo.map} map The current renderer's parent map.
   */
  this._renderOnCanvas = function (context, map) {
    this._renderImageQuads(context, map);
    this._renderColorQuads(context, map);
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
capabilities[quadFeature.capabilities.color] = false;
capabilities[quadFeature.capabilities.image] = true;
capabilities[quadFeature.capabilities.imageCrop] = true;
capabilities[quadFeature.capabilities.imageFixedScale] = true;
capabilities[quadFeature.capabilities.imageFull] = false;
capabilities[quadFeature.capabilities.canvas] = true;

registerFeature('canvas', 'quad', canvas_quadFeature, capabilities);
module.exports = canvas_quadFeature;
