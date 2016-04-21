var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var heatmapFeature = require('../heatmapFeature');
var timestamp = require('../timestamp');

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
  var geo_event = require('../event');

  var m_this = this,
      m_typedBuffer = null,
      m_typedClampedBuffer = null,
      m_typedBufferData = null,
      m_heatMapZoom,
      m_lastZoom,
      m_lastScale = 0,
      s_exit = this._exit,
      s_init = this._init,
      s_update = this._update,
      m_currentX = 0,
      m_currentY = 0,
      m_renderTime = timestamp(),
      m_translate;

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

      context2d.fillStyle  = gradient;
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
  this._colorize = function (context2d, width, height, imageData, gradient) {
    var isLittleEndian = true, i, j, index;

    // Determine whether Uint32 is little- or big-endian.
    if (!m_typedBuffer || (m_typedBuffer.length != imageData.data.length)) {
      m_typedBuffer = new ArrayBuffer(imageData.data.length),
      m_typedClampedBuffer = new Uint8ClampedArray(m_typedBuffer),
      m_typedBufferData = new Uint32Array(m_typedBuffer);
    }

    m_typedBufferData[1] = 0x0a0b0c0d;

    isLittleEndian = true;
    if (m_typedBuffer[4] === 0x0a &&
        m_typedBuffer[5] === 0x0b &&
        m_typedBuffer[6] === 0x0c &&
        m_typedBuffer[7] === 0x0d) {
        isLittleEndian = false;
    }

    if (isLittleEndian) {
      i = 0;
      for (j = 0; j < (width * height * 4); j += 4) {
        index = imageData.data[j + 3] * 4;
        if (index) {
          m_typedBufferData[i] =
            (gradient[index + 3] << 24) |
            (gradient[index + 2] << 16) |
            (gradient[index + 1] <<  8) |
             gradient[index];
         }
         i += 1;
      }
    } else {
      i = 0;
      for (j = 0; j < (width * height * 4); j += 4) {
        index = imageData.data[j + 3] * 4;
        if (index) {
          m_typedBufferData[i] =
            (gradient[index]     << 24) |
            (gradient[index + 1] << 16) |
            (gradient[index + 2] <<  8) |
             gradient[index + 3];
        }
      }
    }

    imageData.data.set(m_typedClampedBuffer);
    context2d.putImageData(imageData, 0, 0);
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

    if (m_renderTime.getMTime() < m_this.buildTime().getMTime()) {
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
      m_this._colorize(context2d, canvas.width, canvas.height, pixelArray, m_this._grad);

      m_heatMapZoom = m_this.layer().map().zoom();
      m_translate = {x: 0, y: 0};
      m_lastZoom = null;
    }


    m_renderTime.modified();

    m_this.layer().renderer().clearCanvas(false);

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

    m_this.geoOn(geo_event.pan, m_this._animatePan);

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
   * Animate pan (and zoom)
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._animatePan = function (e) {

    var zoom = m_this.layer().map().zoom(),
        scale = Math.pow(2, (zoom - m_heatMapZoom));

    if (!e.screenDelta) {
      return
    }

    var translate = {x: e.screenDelta.x,
                     y: e.screenDelta.y};

    console.log(e);
    console.log(e.screenDelta);

    if (zoom !== m_lastZoom && translate.x !== m_translate.x &&
        translate.y !== m_translate.y) {
      var transform = 'translate(' + translate.x + 'px' + ',' +
                       translate.y + 'px' + ')' + 'scale(' + scale + ')';

      m_this.layer().canvas().css('transform-origin', '50% 50%');
      m_this.layer().canvas().css('transform', transform);

      m_translate = translate;
      m_lastZoom = zoom;
    }

    // if (zoom !== m_heatMapZoom) {
    //   if (m_prevRequest) {
    //     // Cancel it
    //   } else {
    //     id = setTimeout(_renderOnCanvas, 1000);
    //   }
    // }
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