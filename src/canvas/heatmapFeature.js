var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var heatmapFeature = require('../heatmapFeature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class heatmapFeature
 * Inspired from
 *    https://github.com/mourner/simpleheat/blob/gh-pages/simpleheat.js
 *
 * @class geo.canvas.heatmapFeature
 * @param {Object} arg Options object
 * @extends geo.heatmapFeature
 * @returns {canvas_heatmapFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var canvas_heatmapFeature = function (arg) {
  'use strict';

  if (!(this instanceof canvas_heatmapFeature)) {
    return new canvas_heatmapFeature(arg);
  }
  heatmapFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_exit = this._exit,
      s_init = this._init,
      s_update = this._update;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Meta functions for converting from geojs styles to canvas.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  this._convertColor = function (c) {
    var color;
    if (c.hasOwnProperty('r') &&
      c.hasOwnProperty('g') &&
      c.hasOwnProperty('b') &&
      c.hasOwnProperty('a')) {
      color = 'rgba(' + 255 * c.r + ',' + 255 * c.g + ','
                    + 255 * c.b + ',' + c.a + ')';
    }
    return color;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute gradient (color lookup table)
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._computeGradient = function () {
    var canvas, stop, context2d, gradient, colors;

    if (!m_this._grad) {
      canvas = document.createElement('canvas');
      context2d = canvas.getContext('2d');
      gradient = context2d.createLinearGradient(0, 0, 0, 256);
      colors = m_this.style('color');

      canvas.width = 1;
      canvas.height = 256;

      for (stop in colors) {
        gradient.addColorStop(stop, m_this._convertColor(colors[stop]));
      }

      context2d.fillStyle = gradient;
      context2d.fillRect(0, 0, 1, 256);
      m_this._grad = context2d.getImageData(0, 0, 1, 256).data;
    }

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create circle for each data point
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._createCircle = function () {
    var circle, ctx, r, r2, blur;
    if (!m_this._circle) {
      circle = m_this._circle = document.createElement('canvas');
      ctx = circle.getContext('2d');
      r = m_this.style('radius');
      blur = m_this.style('blurRadius');

      r2 = blur + r;

      circle.width = circle.height = r2 * 2;
      ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
      ctx.shadowBlur = blur;
      ctx.shadowColor = 'black';

      ctx.beginPath();
      ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      m_this._circle = circle;
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute color for each pixel on the screen
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._colorize = function (pixels, gradient) {
    var i, j;
    for (i = 0; i < pixels.length; i += 4) {
      // Get opacity from the temporary canvas image,
      // then multiply by 4 to get the color index on linear gradient
      j = pixels[i + 3] * 4;
      if (j) {
        pixels[i] = gradient[j];
        pixels[i + 1] = gradient[j + 1];
        pixels[i + 2] = gradient[j + 2];
        pixels[i + 3] = m_this.style('opacity') * gradient[j + 3];
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render each data point on canvas
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._renderOnCanvas = function (context2d, map) {
    var data = m_this.data() || [],
        radius = m_this.style('radius') + m_this.style('blurRadius'),
        pos, intensity, canvas, pixelArray;
    m_this._createCircle();
    m_this._computeGradient();
    data.forEach(function (d) {
      pos = m_this.layer().map().gcsToDisplay(m_this.position()(d));
      intensity = (m_this.intensity()(d) - m_this.minIntensity()) /
                  (m_this.maxIntensity() - m_this.minIntensity());
      // Small values are not visible because globalAlpha < .01
      // cannot be read from imageData
      context2d.globalAlpha = intensity < 0.01 ? 0.01 : intensity;
      context2d.drawImage(m_this._circle, pos.x - radius, pos.y - radius);
    });
    canvas = m_this.layer().canvas()[0];
    pixelArray = context2d.getImageData(0, 0, canvas.width, canvas.height);
    m_this._colorize(pixelArray.data, m_this._grad);
    context2d.putImageData(pixelArray, 0, 0);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    s_init.call(m_this, arg);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    s_update.call(m_this);
    if (m_this.buildTime().getMTime() <= m_this.dataTime().getMTime() ||
        m_this.updateTime().getMTime() < m_this.getMTime()) {
      m_this._build();
    }
    m_this.updateTime().modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    s_exit.call(m_this);
  };

  m_this._init(arg);
  return this;
};

inherit(canvas_heatmapFeature, heatmapFeature);

// Now register it
registerFeature('canvas', 'heatmap', canvas_heatmapFeature);
module.exports = canvas_heatmapFeature;
