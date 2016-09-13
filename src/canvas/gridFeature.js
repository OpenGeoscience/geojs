var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var gridFeature = require('../gridFeature');
var timestamp = require('../timestamp');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class gridFeature
 * Inspired from
 *    https://github.com/dotskapes/wigglemaps
 *
 * @class geo.canvas.gridFeature
 * @param {Object} arg Options object
 * @extends geo.gridFeature
 * @returns {canvas_gridFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var canvas_gridFeature = function (arg) {
  'use strict';
  if (!(this instanceof canvas_gridFeature)) {
    return new canvas_gridFeature(arg);
  }
  gridFeature.call(this, arg);
  var object = require('./object');

  object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var geo_event = require('../event');

  var m_this = this,
      m_gridMapPosition,
      s_exit = this._exit,
      s_init = this._init,
      s_update = this._update,
      m_renderTime = timestamp();

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

    colors = m_this.style('color');
    if (!m_this._grad || m_this._gradColors !== colors) {
      canvas = document.createElement('canvas');
      context2d = canvas.getContext('2d');
      gradient = context2d.createLinearGradient(0, 0, 0, 256);

      canvas.width = 1;
      canvas.height = 256;

      for (stop in colors) {
        gradient.addColorStop(stop, m_this._convertColor(colors[stop]));
      }

      context2d.fillStyle = gradient;
      context2d.fillRect(0, 0, 1, 256);
      m_this._grad = context2d.getImageData(0, 0, 1, 256).data;
      m_this._gradColors = colors;
    }

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render individual data points on the canvas.
   * @protected
   * @param {object} context2d the canvas context to draw in.
   * @param {object} map the parent map object.
   * @param {Array} data the main data array.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._renderPoints = function (context2d, map, data) {
    var position = m_this.gcsPosition(),
        intensityFunc = m_this.intensity(),
        minIntensity = m_this.minIntensity(),
        upperLeft = m_this.upperLeft(),
        rowCount = m_this.rowCount(),
        columnCount = Math.floor(m_this.data().length / rowCount),
        cellSize = m_this.cellSize(),
        rangeIntensity = (m_this.maxIntensity() - minIntensity) || 1,
        i, j, pos, intensity, gradientIndex, cellPixelDelta;

    cellPixelDelta = map.gcsToDisplay({x: cellSize, y: 0}).x -
      map.gcsToDisplay({x: 0, y: 0}).x

    for (i = 0; i < rowCount; i++) {
      for (j = 0; j < columnCount; j++) {
        pos = map.worldToDisplay({
          x: upperLeft.x + (j * cellSize),
          y: upperLeft.y + (i * cellSize)
        })
        intensity = (intensityFunc(data[i * columnCount + j]) - minIntensity) / rangeIntensity;
        if (intensity <= 0) {
          continue;
        }
        gradientIndex = Math.floor(255 * intensity) << 2;
        // context2d.fillStyle = 'rgba(' + m_this._grad[gradientIndex] + ',' + m_this._grad[gradientIndex + 1] + ','  + m_this._grad[gradientIndex + 2] + ', 1)';
        context2d.fillRect(pos.x, pos.y, cellPixelDelta, cellPixelDelta);
        context2d.closePath();
        context2d.beginPath();
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render the data on the canvas, then colorize the resulting opacity map.
   * @protected
   * @param {object} context2d the canvas context to draw in.
   * @param {object} map the parent map object.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._renderOnCanvas = function (context2d, map) {

    if (m_renderTime.getMTime() < m_this.buildTime().getMTime()) {
      var data = m_this.data() || [],
          canvas, pixelArray,
          layer = m_this.layer(),
          viewport = map.camera()._viewport;

      context2d.setTransform(1, 0, 0, 1, 0, 0);
      context2d.clearRect(0, 0, viewport.width, viewport.height);
      layer.canvas().css({transform: '', 'transform-origin': '0px 0px'});

      m_this._computeGradient();
      m_this._renderPoints(context2d, map, data);
      canvas = layer.canvas()[0];

      m_gridMapPosition = {
        zoom: map.zoom(),
        gcsOrigin: map.displayToGcs({x: 0, y: 0}, null),
        rotation: map.rotation(),
        lastScale: undefined,
        lastOrigin: {x: 0, y: 0},
        lastRotation: undefined
      };
      m_renderTime.modified();
      layer.renderer().clearCanvas(false);
    }

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

    var map = m_this.layer().map(),
        zoom = map.zoom(),
        scale = Math.pow(2, (zoom - m_gridMapPosition.zoom)),
        origin = map.gcsToDisplay(m_gridMapPosition.gcsOrigin, null),
        rotation = map.rotation();

    if (m_gridMapPosition.lastScale === scale &&
        m_gridMapPosition.lastOrigin.x === origin.x &&
        m_gridMapPosition.lastOrigin.y === origin.y &&
        m_gridMapPosition.lastRotation === rotation) {
      return;
    }

    var transform = '' +
        ' translate(' + origin.x + 'px' + ',' + origin.y + 'px' + ')' +
        ' scale(' + scale + ')' +
        ' rotate(' + ((rotation - m_gridMapPosition.rotation) * 180 / Math.PI) + 'deg)';

    m_this.layer().canvas()[0].style.transform = transform;

    m_gridMapPosition.lastScale = scale;
    m_gridMapPosition.lastOrigin.x = origin.x;
    m_gridMapPosition.lastOrigin.y = origin.y;
    m_gridMapPosition.lastRotation = rotation;

    if (m_gridMapPosition.timeout) {
      window.clearTimeout(m_gridMapPosition.timeout);
      m_gridMapPosition.timeout = undefined;
    }
    /* This conditional can change if we compute the heatmap beyond the visable
     * viewport so that we don't have to update on pans as often.  If we are
     * close to where the heatmap was originally computed, don't bother
     * updating it. */
    if (parseFloat(scale.toFixed(4)) !== 1 ||
        parseFloat((rotation - m_gridMapPosition.rotation).toFixed(4)) !== 0 ||
        parseFloat(origin.x.toFixed(1)) !== 0 ||
        parseFloat(origin.y.toFixed(1)) !== 0) {
      m_gridMapPosition.timeout = window.setTimeout(function () {
        m_gridMapPosition.timeout = undefined;
        m_this.buildTime().modified();
        m_this.layer().draw();
      }, m_this.updateDelay());
    }
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

inherit(canvas_gridFeature, gridFeature);

// Now register it
registerFeature('canvas', 'grid', canvas_gridFeature);
module.exports = canvas_gridFeature;
