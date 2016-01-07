geo.gl.tileLayer = function () {
  'use strict';
  var m_this = this;

  this._drawTile = function (tile) {
    var bounds = this._tileBounds(tile),
        level = tile.index.level || 0,
        to = this._tileOffset(level);
    var ul = this.fromLocal(this.fromLevel({
      x: bounds.left - to.x, y: bounds.top - to.y
    }, level), 0);
    var lr = this.fromLocal(this.fromLevel({
      x: bounds.right - to.x, y: bounds.bottom - to.y
    }, level), 0);
    /* Use a small z-value for layering the tile levels. */
    tile.feature = m_this.createFeature(
      'plane', {drawOnAsyncResourceLoad: true})
      .origin([ul.x, lr.y, level * 1e-7])
      .upperLeft([ul.x, ul.y, level * 1e-7])
      .lowerRight([lr.x, lr.y, level * 1e-7])
      .style({image: tile._image});
    /* Don't respond to geo events */
    tile.feature.geoTrigger = undefined;
    tile.feature.gcs(m_this.map().gcs());
    tile.feature._update();
    m_this.draw();
  };

  /* Remove the tile feature. */
  this._remove = function (tile) {
    if (tile.feature) {
      m_this.deleteFeature(tile.feature);
      tile.feature = null;
      m_this.draw();
    }
  };

  /* These functions don't need to do anything. */
  this._getSubLayer = function () {};
  this._updateSubLayer = undefined;
};

geo.registerLayerAdjustment('vgl', 'tile', geo.gl.tileLayer);
