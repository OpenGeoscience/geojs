var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pixelmapFeature = require('../pixelmapFeature');
var geo_event = require('../event');
var util = require('../util');

/**
 * Create a new instance of class pixelmapFeature.
 *
 * @class
 * @alias geo.canvas.pixelmapFeature
 * @extends geo.pixelmapFeature
 * @param {geo.pixelmapFeature.spec} arg
 * @returns {geo.canvas.pixelmapFeature}
 */
var canvas_pixelmapFeature = function (arg) {
  'use strict';

  if (!(this instanceof canvas_pixelmapFeature)) {
    return new canvas_pixelmapFeature(arg);
  }
  pixelmapFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  var m_quadFeature,
      s_exit = this._exit,
      m_this = this;

  /**
   * If the specified coordinates are in the rendered quad, use the basis
   * information from the quad to determine the pixelmap index value so that it
   * can be included in the `found` results.
   *
   * @param {geo.geoPosition} geo Coordinate.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.feature.searchResult} An object with a list of features and
   *    feature indices that are located at the specified point.
   */
  this.pointSearch = function (geo, gcs) {
    if (m_quadFeature && m_this.m_info) {
      var result = m_quadFeature.pointSearch(geo, gcs);
      if (result.index.length === 1 && result.extra && result.extra[result.index[0]].basis) {
        var basis = result.extra[result.index[0]].basis, x, y, idx;
        x = Math.floor(basis.x * m_this.m_info.width);
        y = Math.floor(basis.y * m_this.m_info.height);
        if (x >= 0 && x < m_this.m_info.width &&
            y >= 0 && y < m_this.m_info.height) {
          idx = m_this.m_info.indices[y * m_this.m_info.width + x];
          result = {
            index: [idx],
            found: [m_this.data()[idx]]
          };
          return result;
        }
      }
    }
    return {index: [], found: []};
  };

  /**
   * Compute information for this pixelmap image.  It is wasteful to call this
   * if the pixelmap has already been prepared (it is invalidated by a change
   * in the image).
   *
   * @returns {geo.pixelmapFeature.info}
   */
  this._preparePixelmap = function () {
    var i, idx, pixelData;

    if (!util.isReadyImage(m_this.m_srcImage)) {
      return;
    }
    m_this.m_info = {
      width: m_this.m_srcImage.naturalWidth,
      height: m_this.m_srcImage.naturalHeight,
      canvas: document.createElement('canvas')
    };

    m_this.m_info.canvas.width = m_this.m_info.width;
    m_this.m_info.canvas.height = m_this.m_info.height;
    m_this.m_info.context = m_this.m_info.canvas.getContext('2d');

    m_this.m_info.context.drawImage(m_this.m_srcImage, 0, 0);
    m_this.m_info.imageData = m_this.m_info.context.getImageData(
      0, 0, m_this.m_info.canvas.width, m_this.m_info.canvas.height);
    pixelData = m_this.m_info.imageData.data;
    m_this.m_info.indices = new Array(pixelData.length / 4);
    m_this.m_info.area = pixelData.length / 4;

    m_this.m_info.mappedColors = {};
    for (i = 0; i < pixelData.length; i += 4) {
      idx = pixelData[i] + (pixelData[i + 1] << 8) + (pixelData[i + 2] << 16);
      m_this.m_info.indices[i / 4] = idx;
      if (!m_this.m_info.mappedColors[idx]) {
        m_this.m_info.mappedColors[idx] = {first: i / 4};
      }
      m_this.m_info.mappedColors[idx].last = i / 4;
    }
    return m_this.m_info;
  };

  /**
   * Given the loaded pixelmap image, create a canvas the size of the image.
   * Compute a color for each distinct index and recolor the canvas based on
   * these colors, then draw the resultant image as a quad.
   *
   * @fires geo.event.pixelmap.prepared
   */
  this._computePixelmap = function () {
    var data = m_this.data() || [],
        colorFunc = m_this.style.get('color'),
        i, idx, lastidx, color, pixelData, indices, mappedColors,
        updateFirst, updateLast = -1, update, prepared;

    if (!m_this.m_info) {
      if (!m_this._preparePixelmap()) {
        return;
      }
      prepared = true;
    }
    mappedColors = m_this.m_info.mappedColors;
    updateFirst = m_this.m_info.area;
    for (idx in mappedColors) {
      if (mappedColors.hasOwnProperty(idx)) {
        color = colorFunc(data[idx], +idx) || {};
        color = [
          (color.r || 0) * 255,
          (color.g || 0) * 255,
          (color.b || 0) * 255,
          color.a === undefined ? 255 : (color.a * 255)
        ];
        mappedColors[idx].update = (
          !mappedColors[idx].color ||
          mappedColors[idx].color[0] !== color[0] ||
          mappedColors[idx].color[1] !== color[1] ||
          mappedColors[idx].color[2] !== color[2] ||
          mappedColors[idx].color[3] !== color[3]);
        if (mappedColors[idx].update) {
          mappedColors[idx].color = color;
          updateFirst = Math.min(mappedColors[idx].first, updateFirst);
          updateLast = Math.max(mappedColors[idx].last, updateLast);
        }
      }
    }
    /* If nothing was updated, we are done */
    if (updateFirst >= updateLast) {
      return;
    }
    /* Update only the extent that has changed */
    pixelData = m_this.m_info.imageData.data;
    indices = m_this.m_info.indices;
    for (i = updateFirst; i <= updateLast; i += 1) {
      idx = indices[i];
      if (idx !== lastidx) {
        lastidx = idx;
        color = mappedColors[idx].color;
        update = mappedColors[idx].update;
      }
      if (update) {
        pixelData[i * 4] = color[0];
        pixelData[i * 4 + 1] = color[1];
        pixelData[i * 4 + 2] = color[2];
        pixelData[i * 4 + 3] = color[3];
      }
    }
    /* Place the updated area into the canvas */
    m_this.m_info.context.putImageData(
      m_this.m_info.imageData, 0, 0, 0, Math.floor(updateFirst / m_this.m_info.width),
      m_this.m_info.width, Math.ceil((updateLast + 1) / m_this.m_info.width));

    /* If we haven't made a quad feature, make one now.  The quad feature needs
     * to have the canvas capability. */
    if (!m_quadFeature) {
      m_quadFeature = m_this.layer().createFeature('quad', {
        selectionAPI: false,
        gcs: m_this.gcs(),
        visible: m_this.visible(undefined, true)
      });
      m_this.dependentFeatures([m_quadFeature]);
      m_quadFeature.style({
        image: m_this.m_info.canvas,
        position: m_this.style.get('position')})
      .data([{}])
      .draw();
    }
    /* If we prepared the pixelmap and rendered it, send a prepared event */
    if (prepared) {
      m_this.geoTrigger(geo_event.pixelmap.prepared, {
        pixelmap: m_this
      });
    }
  };

  /**
   * Destroy.  Deletes the associated quadFeature.
   *
   * @returns {this}
   */
  this._exit = function () {
    if (m_quadFeature && m_this.layer()) {
      m_this.layer().deleteFeature(m_quadFeature);
      m_quadFeature = null;
      m_this.dependentFeatures([]);
    }
    s_exit();
    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(canvas_pixelmapFeature, pixelmapFeature);

// Now register it
registerFeature('canvas', 'pixelmap', canvas_pixelmapFeature);
module.exports = canvas_pixelmapFeature;
