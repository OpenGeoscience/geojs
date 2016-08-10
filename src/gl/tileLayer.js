var registerLayerAdjustment = require('../registry').registerLayerAdjustment;

var gl_tileLayer = function () {
  'use strict';
  var m_this = this,
      s_init = this._init,
      s_exit = this._exit,
      m_quadFeature,
      m_nextTileId = 0,
      m_tiles = [];

  /* Add a tile to the list of quads */
  this._drawTile = function (tile) {
    if (!m_quadFeature) {
      return;
    }
    var bounds = this._tileBounds(tile),
        level = tile.index.level || 0,
        to = this._tileOffset(level),
        crop = this.tileCropFromBounds(tile),
        quad = {};
    if (crop) {
      quad.crop = {
        x: crop.x / m_this._options.tileWidth,
        y: crop.y / m_this._options.tileHeight
      };
    }
    quad.ul = this.fromLocal(this.fromLevel({
      x: bounds.left - to.x, y: bounds.top - to.y
    }, level), 0);
    quad.ll = this.fromLocal(this.fromLevel({
      x: bounds.left - to.x, y: bounds.bottom - to.y
    }, level), 0);
    quad.ur = this.fromLocal(this.fromLevel({
      x: bounds.right - to.x, y: bounds.top - to.y
    }, level), 0);
    quad.lr = this.fromLocal(this.fromLevel({
      x: bounds.right - to.x, y: bounds.bottom - to.y
    }, level), 0);
    quad.ul.z = quad.ll.z = quad.ur.z = quad.lr.z = level * 1e-5;
    m_nextTileId += 1;
    quad.id = m_nextTileId;
    tile.quadId = quad.id;
    quad.image = tile.image;
    m_tiles.push(quad);
    m_quadFeature.data(m_tiles);
    m_quadFeature._update();
    m_this.draw();
  };

  /* Remove the tile feature. */
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
   * Clean up the layer.
   */
  this._exit = function () {
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
    m_quadFeature = this.createFeature('quad', {
      previewColor: m_this._options.previewColor,
      previewImage: m_this._options.previewImage
    });
    m_quadFeature.geoTrigger = undefined;
    m_quadFeature.gcs(m_this._options.gcs || m_this.map().gcs());
    m_quadFeature.data(m_tiles);
    m_quadFeature._update();
  };

  /* These functions don't need to do anything. */
  this._getSubLayer = function () {};
  this._updateSubLayers = undefined;
};

registerLayerAdjustment('vgl', 'tile', gl_tileLayer);

module.exports = gl_tileLayer;
