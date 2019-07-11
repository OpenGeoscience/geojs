var registerLayerAdjustment = require('../registry').registerLayerAdjustment;
var tileLayer = require('../tileLayer');

var webgl_tileLayer = function () {
  'use strict';

  var geo_event = require('../event');

  var m_this = this,
      s_init = this._init,
      s_exit = this._exit,
      s_update = this._update,
      s_visible = this.visible,
      s_zIndex = this.zIndex,
      m_quadFeature,
      m_nextTileId = 0,
      m_tiles = [];

  /**
   * Add a tile to the list of quads.
   *
   * @param {geo.tile} tile The tile to add and draw.
   */
  this._drawTile = function (tile) {
    if (!m_quadFeature) {
      return;
    }
    var bounds = m_this._tileBounds(tile),
        level = tile.index.level || 0,
        to = m_this._tileOffset(level),
        crop = m_this.tileCropFromBounds(tile),
        quad = {},
        offset, upperTileLayers,
        depthBits = m_this.renderer().contextRenderer().m_depthBits,
        z = 0;  // this will change if tileLayers have topography

    if (crop) {
      quad.crop = {
        x: crop.x / m_this._options.tileWidth,
        y: crop.y / m_this._options.tileHeight
      };
    }
    quad.ul = m_this.fromLocal(m_this.fromLevel({
      x: bounds.left - to.x, y: bounds.top - to.y
    }, level), 0);
    quad.ll = m_this.fromLocal(m_this.fromLevel({
      x: bounds.left - to.x, y: bounds.bottom - to.y
    }, level), 0);
    quad.ur = m_this.fromLocal(m_this.fromLevel({
      x: bounds.right - to.x, y: bounds.top - to.y
    }, level), 0);
    quad.lr = m_this.fromLocal(m_this.fromLevel({
      x: bounds.right - to.x, y: bounds.bottom - to.y
    }, level), 0);
    quad.ul.z = quad.ll.z = quad.ur.z = quad.lr.z = z;

    /* Compute a zOffset per layer and level.  This ensures all tile levels in
     * all tile layers are sorted with the earlier layers and lower levels on
     * the bottom.  Ideally, don't change the z values, since the z-buffer may
     * be expected to have the correct values, but by shifting each layer a
     * small offset, the levels will appear in the correct order and avoid
     * z-fighting.  The zOffset is applied *after* matrix transformations, and
     * is in the webgl clip space of [0-1] with the resolution of the
     * DEPTH_BITS. */
    offset = m_this._options.keepLower ? m_this._options.maxLevel - level + 1 : 1;
    upperTileLayers = m_this.map().listSceneObjects().filter(function (object) {
      return object instanceof tileLayer;
    });
    upperTileLayers = upperTileLayers.slice(upperTileLayers.indexOf(m_this) + 1);
    upperTileLayers.forEach(function (object) {
      offset += object._options.keepLower ? object._options.maxLevel - object._options.minLevel + 1 : 1;
    });
    /* See the definition of `_zOffsetMultiple` for more details. */
    quad.zOffset = offset * Math.pow(2, -depthBits) * tileLayer._zOffsetMultiple;

    m_nextTileId += 1;
    quad.id = m_nextTileId;
    tile.quadId = quad.id;
    quad.image = tile.image;
    m_tiles.push(quad);
    m_quadFeature.data(m_tiles);
    m_quadFeature._update();
    m_this.draw();
  };

  /**
   * Remove a tile from the list of quads.   The quadFeature is redrawn.
   *
   * @param {geo.tile} tile The tile to remove.
   */
  this._remove = function (tile) {
    if (tile.quadId !== undefined && m_quadFeature) {
      for (var i = 0; i < m_tiles.length; i += 1) {
        if (m_tiles[i].id === tile.quadId) {
          m_tiles.splice(i, 1);
          break;
        }
      }
      m_quadFeature.data(m_tiles);
      m_quadFeature._update();
      m_this.draw();
    }
  };

  /**
   * Get/Set visibility of the layer.
   *
   * @param {boolean} [val] If specified, change the visibility, otherwise
   *    return it.
   * @returns {boolean|this} The current visibility or the layer.
   */
  this.visible = function (val) {
    if (val === undefined) {
      return s_visible();
    }
    if (m_this.visible() !== val) {
      s_visible(val);
      if (m_quadFeature) {
        m_quadFeature.visible(m_quadFeature.visible(undefined, true), true);
      }
    }
    return m_this;
  };

  /**
   * Get or set the z-index of the layer.  The z-index controls the display
   * order of the layers in much the same way as the CSS z-index property.
   *
   * @param {number} [zIndex] The new z-index, or undefined to return the
   *    current z-index.
   * @param {boolean} [allowDuplicate] When setting the z index, if this is
   *    truthy, allow other layers to have the same z-index.  Otherwise,
   *    ensure that other layers have distinct z-indices from this one.
   * @returns {number|this}
   */
  this.zIndex = function (zIndex, allowDuplicate) {
    if (zIndex !== undefined) {
      m_this._clearQuads();
    }
    return s_zIndex.apply(m_this, arguments);
  };

  /**
   * If the z-index has changed or layers are added or removed, clear the quads
   * so they are composited in the correct order.
   *
   * @param {geo.event} [evt] If specified, the layer add or remove event that
   *    triggered this.  If `undefined`, clear the quads but don't redraw.
   */
  this._clearQuads = function (evt) {
    if (evt && (!evt.layer || !(evt.layer instanceof tileLayer))) {
      return;
    }
    m_this.clear();
    if (m_quadFeature) {
      m_quadFeature.modified();
    }
    if (evt) {
      m_this.draw();
    }
  };

  /**
   * Update layer.
   *
   * @param {object} request A value to pass to the parent class.
   * @returns {this}
   */
  this._update = function (request) {
    s_update.call(m_this, request);
    if (m_quadFeature) {
      m_quadFeature._update();
    }
    return m_this;
  };

  /**
   * Cleanup.  This purges the texture and tile cache.
   */
  this._cleanup = function () {
    var tile;
    if (m_this.cache && m_this.cache._cache) {
      for (var hash in m_this.cache._cache) {
        tile = m_this.cache._cache[hash];
        if (tile._image && tile._image._texture) {
          delete tile._image._texture;
        }
      }
      m_this.cache.clear();
    }
    m_this.clear();
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    m_this._cleanup();
    m_this.deleteFeature(m_quadFeature);
    m_quadFeature = null;
    m_tiles = [];
    s_exit.apply(m_this, arguments);
  };

  /**
   * Initialize after the layer is added to the map.
   */
  this._init = function () {
    s_init.apply(m_this, arguments);
    m_quadFeature = m_this.createFeature('quad', {
      previewColor: m_this._options.previewColor,
      previewImage: m_this._options.previewImage
    });
    m_quadFeature.geoTrigger = undefined;
    m_quadFeature.gcs(m_this._options.gcs || m_this.map().gcs());
    m_quadFeature.data(m_tiles);
    m_quadFeature._update();

    var map = m_this.map();
    map.geoOn(geo_event.layerAdd, m_this._clearQuads);
    map.geoOn(geo_event.layerRemove, m_this._clearQuads);
  };

  /* These functions don't need to do anything. */
  this._getSubLayer = function () {};
  this._updateSubLayers = undefined;
};

/* Use a multiple of the minimum z delta provided by DEPTH_BITS so that
 * rounding won't accidentally merge two levels.  This may need to be higher
 * if the tile layer is not flat to the camera. */
tileLayer._zOffsetMultiple = 2;

registerLayerAdjustment('webgl', 'tile', webgl_tileLayer);

module.exports = webgl_tileLayer;
