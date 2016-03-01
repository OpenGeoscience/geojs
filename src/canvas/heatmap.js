//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class heatmap
 * The rendering borrows from https://github.com/mourner/simpleheat/blob/gh-pages/simpleheat.js
 *
 * @class
 * @param {Object} arg Options object
 * @extends geo.heatmap
 * @returns {geo.canvas.heatmap}
 */
//////////////////////////////////////////////////////////////////////////////
geo.canvas.heatmap = function (arg) {
  'use strict';

  if (!(this instanceof geo.canvas.heatmap)) {
    return new geo.canvas.heatmap(arg);
  }
  geo.heatmap.call(this, arg);

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
   * Build
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    s_update.call(m_this);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Meta functions for converting from geojs styles to canvas.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  this._convertColor = function (c) {
    var rgb;
    if (c.hasOwnProperty('r') &&
        c.hasOwnProperty('g') &&
        c.hasOwnProperty('b')) {
      rgb = d3.rgb(255 * c.r, 255 * c.g, 255 * c.b).toString();
    }
    return rgb;
  };

  this._gradient = function () {
    if (!m_this._grad) {
      var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        gradient = context.createLinearGradient(0, 0, 0, 256),
        colors = m_this.style('color');

      canvas.width = 1;
      canvas.height = 256;

      for (var stop in colors) {
        gradient.addColorStop(stop, m_this._convertColor(colors[stop]));
      }

      context.fillStyle = gradient;
      context.fillRect(0, 0, 1, 256);
      m_this._grad = context.getImageData(0, 0, 1, 256).data;
    }

    return m_this;
  };

  this._radius = function () {
    if (!m_this._circle) {
      var circle = m_this._circle = document.createElement('canvas'),
        ctx = circle.getContext('2d'),
        r = m_this.style('radius'),
        blur = m_this.style('blurRadius');


      var r2 = blur + r;

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

  this._colorize = function (pixels, gradient) {
    for (var i = 0; i < pixels.length; i+=4) {
    var j = pixels[i + 3] * 4; // get opacity from the temporary canvas image,
                              // then multiply by 4 to get the color index on linear gradient
      if (j) {
        pixels[i] = gradient[j];
        pixels[i+1] = gradient[j+1];
        pixels[i+2] = gradient[j+2];
      }
    }
  };

  this._renderOnCanvas = function (context2d, map) {
    var data = m_this.data() || [];
    m_this._radius();
    m_this._gradient();
    var radius = m_this.style('radius');
    data.forEach(function (d) {
      var p = m_this.layer().map().gcsToDisplay(m_this.position()(d));
      var intensity = m_this.intensity()(d) / m_this.maxIntensity();
      context2d.globalAlpha = Math.max(intensity, .05);
      context2d.drawImage(m_this._circle, p.x - radius, p.y - radius);
    });
    var canvas = m_this.layer().canvas()[0];
    var pixelArray = context2d.getImageData(0, 0, canvas.width, canvas.height);
    m_this._colorize(pixelArray.data, m_this._grad);
    context2d.putImageData(pixelArray, 0, 0)
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    s_init.call(m_this, arg); //doesn't this get called implicitly by geo.heatmap.call TODO ?
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

inherit(geo.canvas.heatmap, geo.heatmap);

// Now register it
geo.registerFeature('canvas', 'heatmap', geo.canvas.heatmap);
