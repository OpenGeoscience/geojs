var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class imagemapFeature
 *
 * @class geo.pixelmapFeature
 * @param {Object} arg Options object
 * @extends geo.feature
 * @param {Object|Function} [url] URL of a pixel map.  The rgb data is
 *   interpretted as an index of the form 0xbbggrr.  The alpha channel is
 *   ignored.
 * @param {Object|Function} [mapColor] The color that should be used for each
 *   data element.  Data elements correspond to the indices in the pixel map.
 *   If an index is larger than the number of data elements, it will be
 *   transparent.  If there is more data than there are indices, it is ignored.
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
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
var pixelmapFeature = function (arg) {
  'use strict';
  if (!(this instanceof pixelmapFeature)) {
    return new pixelmapFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_quadFeature,
      m_mappedColors,
      m_pixelmapWidth,
      m_pixelmapHeight,
      m_pixelmapIndices,
      m_srcImage,
      s_update = this._update,
      s_init = this._init,
      s_exit = this._exit;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set position accessor
   *
   * @returns {geo.pixelmap}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set url accessor
   *
   * @returns {geo.pixelmap}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.url = function (val) {
    if (val === undefined) {
      return m_this.style('url');
    } else if (val !== m_this.style('url')) {
      m_srcImage = m_pixelmapWidth = m_pixelmapHeight = undefined;
      m_pixelmapIndices = undefined;
      m_this.style('url', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the maximum index value from the pixelmap.  This is a value present in
   * the pixelmap.  This is a somewhat expensive call.
   *
   * @returns {geo.pixelmap}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.maxIndex = function () {
    if (m_pixelmapIndices) {
      var max = -1;
      for (var i = 0; i < m_pixelmapIndices.length; i += 1) {
        max = Math.max(max, m_pixelmapIndices[i]);
      }
      return max;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set mapColor accessor
   *
   * @returns {geo.pixelmap}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.mapColor = function (val) {
    if (val === undefined) {
      return m_this.style('mapColor');
    } else if (val !== m_this.style('mapColor')) {
      m_this.style('mapColor', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * If the specified coordinates are in the rendered quad, use the basis
   * information from the quad to determine the pixelmap index value so that it
   * can be included in the found results.
   */
  this.pointSearch = function (coordinate) {
    if (m_quadFeature) {
      var result = m_quadFeature.pointSearch(coordinate);
      if (result.basis.length === 1) {
        var x = result.basis[0].x, y = result.basis[0].y;
        x = Math.floor(x * m_pixelmapWidth);
        y = Math.floor(y * m_pixelmapHeight);
        if (x >= 0 && x < m_pixelmapWidth && y >= 0 && y < m_pixelmapHeight) {
          result = {
            index: [m_pixelmapIndices[y * m_pixelmapWidth + x]]
          };
          result.found = [m_this.data()[result.index[0]]];
          return result;
        }
      }
    }
    return {index: [], found: []};
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var data = m_this.data() || [];

    m_mappedColors = new Array(data.length);
    if (!m_srcImage) {
      m_srcImage = new Image();
      m_srcImage.crossOrigin = m_this.style.get('crossDomain')() || 'anonymous';
      m_srcImage.onload = this._computePixelmap;
      m_srcImage.src = m_this.style.get('url')();
    } else if (m_pixelmapWidth) {
      this._computePixelmap();
    }
    m_this.buildTime().modified();
    return m_this;
  };

  /**
   * Given the loaded pixelmap image, create a canvas the size of the image.
   * Compute a color for each distinct index and recolor the canvas based on
   * thise colors, then draw the resultant image as a quad.
   */
  this._computePixelmap = function () {
    var data = m_this.data() || [],
        mapColorFunc = m_this.style.get('mapColor');

    m_pixelmapWidth = m_srcImage.naturalWidth;
    m_pixelmapHeight = m_srcImage.naturalHeight;

    var canvas = document.createElement('canvas');
    canvas.width = m_pixelmapWidth;
    canvas.height = m_pixelmapHeight;
    var context = canvas.getContext('2d');

    if (!m_pixelmapIndices) {
      context.drawImage(m_srcImage, 0, 0);
    }
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
        pixelData = imageData.data,
        i, idx, color;
    if (!m_pixelmapIndices) {
      m_pixelmapIndices = new Array(pixelData.length / 4);

      for (i = 0; i < pixelData.length; i += 4) {
        idx = pixelData[i] + (pixelData[i + 1] << 8) + (pixelData[i + 2] << 16);
        m_pixelmapIndices[i / 4] = idx;
      }
    }
    for (i = 0; i < pixelData.length; i += 4) {
      idx = m_pixelmapIndices[i / 4];
      if (m_mappedColors[idx] === undefined) {
        m_mappedColors[idx] = mapColorFunc(data[idx], idx) || {};
      }
      color = m_mappedColors[idx] || {};
      pixelData[i] = (color.r || 0) * 255;
      pixelData[i + 1] = (color.g || 0) * 255;
      pixelData[i + 2] = (color.b || 0) * 255;
      pixelData[i + 3] = color.a === undefined ? 255 : (color.a * 255);
    }
    context.putImageData(imageData, 0, 0);

    var destImage = new Image();
    destImage.src = canvas.toDataURL();
    if (!m_quadFeature) {
      m_quadFeature = m_this.layer().createFeature('quad', {
        selectionAPI: false,
        gcs: m_this.gcs(),
        visible: m_this.visible()
      });
      m_this.dependentFeatures([m_quadFeature]);
    }
    m_quadFeature.style({image: destImage, position: m_this.style.get('position')});
    m_quadFeature.data([{}]);
    m_quadFeature.draw();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    s_update.call(m_this);
    if (m_this.buildTime().getMTime() <= m_this.dataTime().getMTime() ||
        m_this.updateTime().getMTime() < m_this.getMTime()) {
      m_this._build();
    }

    m_this.updateTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   * @memberof geo.polygonFeature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    if (m_quadFeature && m_this.layer()) {
      m_this.layer().deleteFeature(m_quadFeature);
      m_quadFeature = null;
      m_this.dependentFeatures([]);
    }
    s_exit();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var style = $.extend(
      {},
      {
        mapColor: function (d, idx) {
          return {
            r: (idx & 0xFF) / 255,
            g: ((idx >> 8) & 0xFF) / 255,
            b: ((idx >> 16) & 0xFF) / 255,
            a: 1
          };
        }
      },
      arg.style === undefined ? {} : arg.style
    );
    if (arg.position !== undefined) {
      style.position = arg.position;
    }
    if (arg.url !== undefined) {
      style.url = arg.url;
    }
    if (arg.mapColor !== undefined) {
      style.mapColor = arg.mapColor;
    }
    m_this.style(style);
    m_this.dataTime().modified();
  };

  return this;
};

inherit(pixelmapFeature, feature);
module.exports = pixelmapFeature;
