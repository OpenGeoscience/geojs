var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');
var geo_event = require('./event');
var util = require('./util');

/**
 * Create a new instance of class imagemapFeature
 *
 * @class geo.pixelmapFeature
 * @param {Object} arg Options object
 * @extends geo.feature
 * @param {Object|Function|HTMLImageElement} [url] URL of a pixel map or an
 *   HTML Image element.  The rgb data is interpretted as an index of the form
 *   0xbbggrr.  The alpha channel is ignored.
 * @param {Object|Function} [color] The color that should be used for each data
 *   element.  Data elements correspond to the indices in the pixel map.  If an
 *   index is larger than the number of data elements, it will be transparent.
 *   If there is more data than there are indices, it is ignored.
 * @param {Object|Function} [position] Position of the image.  Default is
 *   (data).  The position is an Object which specifies the corners of the
 *   quad: ll, lr, ur, ul.  At least two opposite corners must be specified.
 *   The corners do not have to physically correspond to the order specified,
 *   but rather correspond to that part of the image map.  If a corner is
 *   unspecified, it will use the x coordinate from one adjacent corner, the y
 *   coordinate from the other adjacent corner, and the average z value of
 *   those two corners.  For instance, if ul is unspecified, it is
 *   {x: ll.x, y: ur.y}.  Note that each quad is rendered as a pair of
 *   triangles: (ll, lr, ul) and (ur, ul, lr).  Nothing special is done for
 *   quads that are not convex or quads that have substantially different
 *   transformations for those two triangles.
 * @returns {geo.pixelmapFeature}
 */

var pixelmapFeature = function (arg) {
  'use strict';
  if (!(this instanceof pixelmapFeature)) {
    return new pixelmapFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      m_quadFeature,
      m_srcImage,
      m_info,
      s_update = this._update,
      s_init = this._init,
      s_exit = this._exit;

  /**
   * Get/Set position accessor
   *
   * @returns {geo.pixelmap}
   */
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    } else if (val !== m_this.style('position')) {
      m_this.style('position', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Get/Set url accessor
   *
   * @returns {geo.pixelmap}
   */
  this.url = function (val) {
    if (val === undefined) {
      return m_this.style('url');
    } else if (val !== m_this.style('url')) {
      m_srcImage = m_info = undefined;
      m_this.style('url', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Get the maximum index value from the pixelmap.  This is a value present in
   * the pixelmap.
   *
   * @returns {geo.pixelmap}
   */
  this.maxIndex = function () {
    if (m_info) {
      /* This isn't just m_info.mappedColors.length - 1, since there
       * may be more data than actual indices. */
      if (m_info.maxIndex === undefined) {
        m_info.maxIndex = 0;
        for (var idx in m_info.mappedColors) {
          if (m_info.mappedColors.hasOwnProperty(idx)) {
            m_info.maxIndex = Math.max(m_info.maxIndex, idx);
          }
        }
      }
      return m_info.maxIndex;
    }
  };

  /**
   * Get/Set color accessor
   *
   * @returns {geo.pixelmap}
   */
  this.color = function (val) {
    if (val === undefined) {
      return m_this.style('color');
    } else if (val !== m_this.style('color')) {
      m_this.style('color', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * If the specified coordinates are in the rendered quad, use the basis
   * information from the quad to determine the pixelmap index value so that it
   * can be included in the found results.
   *
   * @param {geo.geoPosition} coordinate point to search for in map interface
   *    gcs.
   */
  this.pointSearch = function (coordinate) {
    if (m_quadFeature && m_info) {
      var result = m_quadFeature.pointSearch(coordinate);
      if (result.index.length === 1 && result.extra && result.extra[result.index[0]].basis) {
        var basis = result.extra[result.index[0]].basis, x, y, idx;
        x = Math.floor(basis.x * m_info.width);
        y = Math.floor(basis.y * m_info.height);
        if (x >= 0 && x < m_info.width &&
            y >= 0 && y < m_info.height) {
          idx = m_info.indices[y * m_info.width + x];
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
   * Build
   */
  this._build = function () {
    /* Set the build time at the start of the call.  A build can result in
     * drawing a quad, which can trigger a full layer update, which in tern
     * checks if this feature is built.  Setting the build time avoid calling
     * this a second time. */
    m_this.buildTime().modified();
    if (!m_srcImage) {
      var src = this.style.get('url')();
      if (util.isReadyImage(src)) {
        /* we have an already loaded image, so we can just use it. */
        m_srcImage = src;
        this._computePixelmap();
      } else if (src) {
        var defer = $.Deferred(), prev_onload, prev_onerror;
        if (src instanceof Image) {
          /* we have an unloaded image.  Hook to the load and error callbacks
           * so that when it is loaded we can use it. */
          m_srcImage = src;
          prev_onload = src.onload;
          prev_onerror = src.onerror;
        } else {
          /* we were given a url, so construct a new image */
          m_srcImage = new Image();
          // Only set the crossOrigin parameter if this is going across origins.
          if (src.indexOf(':') >= 0 &&
              src.indexOf('/') === src.indexOf(':') + 1) {
            m_srcImage.crossOrigin = this.style.get('crossDomain')() || 'anonymous';
          }
        }
        m_srcImage.onload = function () {
          if (prev_onload) {
            prev_onload.apply(this, arguments);
          }
          /* Only use this image if our pixelmap hasn't changed since we
           * attached our handler */
          if (m_this.style.get('url')() === src) {
            m_info = undefined;
            m_this._computePixelmap();
          }
          defer.resolve();
        };
        m_srcImage.onerror = function () {
          if (prev_onerror) {
            prev_onerror.apply(this, arguments);
          }
          defer.reject();
        };
        defer.promise(this);
        this.layer().addPromise(this);
        if (!(src instanceof Image)) {
          m_srcImage.src = src;
        }
      }
    } else if (m_info) {
      this._computePixelmap();
    }
    return m_this;
  };

  /**
   * Compute information for this pixelmap image.  It is wasterful to call this
   * if the pixelmap has already been prepared (it is invalidated by a change
   * in the image).
   */
  this._preparePixelmap = function () {
    var i, idx, pixelData;

    if (!util.isReadyImage(m_srcImage)) {
      return;
    }
    m_info = {
      width: m_srcImage.naturalWidth,
      height: m_srcImage.naturalHeight,
      canvas: document.createElement('canvas'),
      updateIdx: {}
    };

    m_info.canvas.width = m_info.width;
    m_info.canvas.height = m_info.height;
    m_info.context = m_info.canvas.getContext('2d');

    m_info.context.drawImage(m_srcImage, 0, 0);
    m_info.imageData = m_info.context.getImageData(
      0, 0, m_info.canvas.width, m_info.canvas.height);
    pixelData = m_info.imageData.data;
    m_info.indices = new Array(pixelData.length / 4);
    m_info.area = pixelData.length / 4;

    m_info.mappedColors = {};
    for (i = 0; i < pixelData.length; i += 4) {
      idx = pixelData[i] + (pixelData[i + 1] << 8) + (pixelData[i + 2] << 16);
      m_info.indices[i / 4] = idx;
      if (!m_info.mappedColors[idx]) {
        m_info.mappedColors[idx] = {first: i / 4};
      }
      m_info.mappedColors[idx].last = i / 4;
    }
    return m_info;
  };

  /**
   * Given the loaded pixelmap image, create a canvas the size of the image.
   * Compute a color for each distinct index and recolor the canvas based on
   * thise colors, then draw the resultant image as a quad.
   */
  this._computePixelmap = function () {
    var data = m_this.data() || [],
        colorFunc = m_this.style.get('color'),
        i, idx, lastidx, color, pixelData, indices, mappedColors,
        updateFirst, updateLast = -1, update, prepared;

    if (!m_info) {
      if (!m_this._preparePixelmap()) {
        return;
      }
      prepared = true;
    }
    mappedColors = m_info.mappedColors;
    updateFirst = m_info.area;
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
    pixelData = m_info.imageData.data;
    indices = m_info.indices;
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
    m_info.context.putImageData(
      m_info.imageData, 0, 0, 0, Math.floor(updateFirst / m_info.width),
      m_info.width, Math.ceil((updateLast + 1) / m_info.width));

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
        image: m_info.canvas,
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
   * Update
   */
  this._update = function () {
    s_update.call(m_this);
    if (m_this.buildTime().getMTime() <= m_this.dataTime().getMTime() ||
        m_this.updateTime().getMTime() < m_this.getMTime()) {
      m_this._build();
    }

    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Destroy
   * @memberof geo.pixelmapFeature
   */
  this._exit = function (abc) {
    if (m_quadFeature && m_this.layer()) {
      m_this.layer().deleteFeature(m_quadFeature);
      m_quadFeature = null;
      m_this.dependentFeatures([]);
    }
    s_exit();
  };

  /**
   * Initialize
   */
  this._init = function (arg) {
    arg = arg || {};
    s_init.call(m_this, arg);

    var style = $.extend(
      {},
      {
        color: function (d, idx) {
          return {
            r: (idx & 0xFF) / 255,
            g: ((idx >> 8) & 0xFF) / 255,
            b: ((idx >> 16) & 0xFF) / 255,
            a: 1
          };
        },
        position: function (d) { return d; }
      },
      arg.style === undefined ? {} : arg.style
    );
    if (arg.position !== undefined) {
      style.position = arg.position;
    }
    if (arg.url !== undefined) {
      style.url = arg.url;
    }
    if (arg.color !== undefined) {
      style.color = arg.color;
    }
    m_this.style(style);
    m_this.dataTime().modified();
  };

  return this;
};

/**
 * Create a pixelmapFeature from an object.
 *
 * @see {@link geo.feature.create}
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.pixelmapFeature.spec} spec The object specification
 * @returns {geo.pixelmapFeature|null}
 */
pixelmapFeature.create = function (layer, spec) {
  'use strict';

  spec = spec || {};
  spec.type = 'pixelmap';
  return feature.create(layer, spec);
};

pixelmapFeature.capabilities = {
  /* core feature name -- support in any manner */
  feature: 'pixelmap'
};

inherit(pixelmapFeature, feature);
module.exports = pixelmapFeature;
