var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');
var util = require('./util');

/**
 * Pixelmap feature specification.
 *
 * @typedef {geo.feature.spec} geo.pixelmapFeature.spec
 * @extends geo.feature.spec
 * @property {string|function|HTMLImageElement} [url] URL of a pixel map or an
 *   HTML Image element.  The rgb data is interpreted as an index of the form
 *   0xbbggrr.  The alpha channel is ignored.
 * @property {geo.geoColor|function} [color] The color that should be used
 *   for each data element.  Data elements correspond to the indices in the
 *   pixel map. If an index is larger than the number of data elements, it will
 *   be transparent.  If there is more data than there are indices, it is
 *   ignored.
 * @property {geo.geoPosition|function} [position] Position of the image.
 *   Default is (data).  The position is an Object which specifies the corners
 *   of the quad: ll, lr, ur, ul.  At least two opposite corners must be
 *   specified.  The corners do not have to physically correspond to the order
 *   specified, but rather correspond to that part of the image map.  If a
 *   corner is unspecified, it will use the x coordinate from one adjacent
 *   corner, the y coordinate from the other adjacent corner, and the average z
 *   value of those two corners.  For instance, if ul is unspecified, it is
 *   {x: ll.x, y: ur.y}.  Note that each quad is rendered as a pair of
 *   triangles: (ll, lr, ul) and (ur, ul, lr).  Nothing special is done for
 *   quads that are not convex or quads that have substantially different
 *   transformations for those two triangles.
 */

/**
 * Create a new instance of class pixelmapFeature
 *
 * @class
 * @alias geo.pixelmapFeature
 * @param {geo.pixelmapFeature.spec} arg Options object.
 * @extends geo.feature
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
      s_update = this._update,
      m_modifiedIndexRange,
      s_init = this._init;

  this.featureType = 'pixelmap';

  /**
   * Get/Set position accessor.
   *
   * @param {geo.geoPosition|function} [val] If not specified, return the
   *    current position accessor.  If specified, use this for the position
   *    accessor and return `this`.  See {@link geo.quadFeature.position} for
   *    for details on this position.
   * @returns {geo.geoPosition|function|this}
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
   * Get/Set url accessor.
   *
   * @param {string|function} [val] If not specified, return the current url
   *    accessor.  If specified, use this for the url accessor and return
   *    `this`.
   * @returns {string|function|this}
   */
  this.url = function (val) {
    if (val === undefined) {
      return m_this.style('url');
    } else if (val !== m_this.style('url')) {
      m_this.m_srcImage = m_this.m_info = undefined;
      m_this.style('url', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Get/Set color accessor.
   *
   * @param {geo.geoColor|function} [val] The new color map accessor or
   *    `undefined` to get the current accessor.
   * @returns {geo.geoColor|function|this}
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
   * Mark that an index's data value (and hence its color) has changed without
   * marking all of the data array as changed.  If this function is called
   * without any parameters, it clears the tracked changes.
   *
   * @param {number} [idx] The lowest data index that has changed.  If
   *    `undefined`, return the current tracked changed range.
   * @param {number|'clear'} [idx2] If an index was specified in `idx` and
   *    this is specified, the highest index (inclusive) that has changed.  If
   *    returning the tracked changed range and this is `clear`, clear the
   *    tracked range.
   * @returns {this|number[]} When returning a range, this is the lowest and
   *    highest index values that have changed (inclusive), so their range is
   *    `[0, data.length)`.
   */
  this.indexModified = function (idx, idx2) {
    if (idx === undefined) {
      const range = m_modifiedIndexRange;
      if (idx2 === 'clear') {
        m_modifiedIndexRange = undefined;
      }
      return range;
    }
    m_this.modified();
    if (m_modifiedIndexRange === undefined) {
      m_modifiedIndexRange = [idx, idx];
    }
    if (idx < m_modifiedIndexRange[0]) {
      m_modifiedIndexRange[0] = idx;
    }
    if ((idx2 || idx) > m_modifiedIndexRange[1]) {
      m_modifiedIndexRange[1] = (idx2 || idx);
    }
    return m_this;
  };

  /**
   * Update.
   *
   * @returns {this}
   */
  this._update = function () {
    s_update.call(m_this);
    if (m_this.buildTime().timestamp() <= m_this.dataTime().timestamp() ||
        m_this.updateTime().timestamp() < m_this.timestamp()) {
      m_this._build();
    }

    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Get the maximum index value from the pixelmap.  This is a value present in
   * the pixelmap.
   *
   * @returns {number} The maximum index value.
   */
  this.maxIndex = function () {
    if (m_this.m_info) {
      /* This isn't just m_info.mappedColors.length - 1, since there
       * may be more data than actual indices. */
      if (m_this.m_info.maxIndex === undefined) {
        m_this.m_info.maxIndex = 0;
        for (var idx in m_this.m_info.mappedColors) {
          if (m_this.m_info.mappedColors.hasOwnProperty(idx)) {
            m_this.m_info.maxIndex = Math.max(m_this.m_info.maxIndex, idx);
          }
        }
      }
      return m_this.m_info.maxIndex;
    }
  };

  /**
   * Given the loaded pixelmap image, create a canvas the size of the image.
   * Compute a color for each distinct index and recolor the canvas based on
   * these colors, then draw the resultant image as a quad.
   *
   * @fires geo.event.pixelmap.prepared
   */
  this._computePixelmap = function () {
  };

  /**
   * Build.  Fetches the image if necessary.
   *
   * @returns {this}
   */
  this._build = function () {
    /* Set the build time at the start of the call.  A build can result in
     * drawing a quad, which can trigger a full layer update, which in turn
     * checks if this feature is built.  Setting the build time avoids calling
     * this a second time. */
    if (!m_this.m_srcImage) {
      var src = m_this.style.get('url')();
      if (util.isReadyImage(src)) {
        /* we have an already loaded image, so we can just use it. */
        m_this.m_srcImage = src;
        m_this._computePixelmap();
      } else if (src) {
        var defer = $.Deferred(), prev_onload, prev_onerror;
        if (src instanceof Image) {
          /* we have an unloaded image.  Hook to the load and error callbacks
           * so that when it is loaded we can use it. */
          m_this.m_srcImage = src;
          prev_onload = src.onload;
          prev_onerror = src.onerror;
        } else {
          /* we were given a url, so construct a new image */
          m_this.m_srcImage = new Image();
          // Only set the crossOrigin parameter if this is going across origins.
          if (src.indexOf(':') >= 0 &&
              src.indexOf('/') === src.indexOf(':') + 1) {
            m_this.m_srcImage.crossOrigin = m_this.style.get('crossDomain')() || 'anonymous';
          }
        }
        m_this.m_srcImage.onload = function () {
          if (prev_onload) {
            prev_onload.apply(m_this, arguments);
          }
          /* Only use this image if our pixelmap hasn't changed since we
           * attached our handler */
          if (m_this.style.get('url')() === src) {
            m_this.m_info = undefined;
            m_this._computePixelmap();
          }
          defer.resolve();
        };
        m_this.m_srcImage.onerror = function () {
          if (prev_onerror) {
            prev_onerror.apply(m_this, arguments);
          }
          defer.reject();
        };
        defer.promise(m_this);
        m_this.layer().addPromise(m_this);
        if (!(src instanceof Image)) {
          m_this.m_srcImage.src = src;
        }
      }
    } else if (m_this.m_info) {
      m_this._computePixelmap();
    }
    m_this.buildTime().modified();
    return m_this;
  };

  /**
   * Initialize.
   *
   * @param {geo.pixelmapFeature.spec} arg
   * @returns {this}
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
    if (arg.quadFeature) {
      m_this.m_srcImage = true;
      m_this._computePixelmap();
    }

    return m_this;
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
  feature: 'pixelmap',
  /* support for image-based lookup */
  lookup: 'pixelmap.lookup'
};

inherit(pixelmapFeature, feature);
module.exports = pixelmapFeature;
