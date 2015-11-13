geo.gl.tileLayer = function () {
  'use strict';
  var m_this = this,
      m_mapOpacity = 1.0;  //DWM:: we need to reimplement map opacity.

  this._drawTile = function (tile) {
    var bounds = this._tileBounds(tile),
        level = tile.index.level || 0,
        to = this._options.tileOffset(level);
    var ul = this.fromLocal(this.fromLevel({
      x: bounds.left - to.x, y: bounds.top - to.y
    }, level), 0);
    var lr = this.fromLocal(this.fromLevel({
      x: bounds.right - to.x, y: bounds.bottom - to.y
    }, level), 0);
    /* Use a small z-value for layering the tile levels. */
    tile.feature = m_this.createFeature(
      'plane', {drawOnAsyncResourceLoad: true})
      .origin([ul.x, ul.y, level / 1000])
      .upperLeft([ul.x, lr.y, level / 1000])
      .lowerRight([lr.x, ul.y, level / 1000])
      .style({image: tile._image, opacity: m_mapOpacity});
    tile.feature._update();
    m_this.draw();
  };

  this._remove = function (tile) {
    if (tile.feature) {
      m_this.deleteFeature(tile.feature);
      tile.feature = null;
    }
  };
};

geo.registerLayerAdjustment('vgl', 'tile', geo.gl.tileLayer);
