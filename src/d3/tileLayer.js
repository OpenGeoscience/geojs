geo.d3.tileLayer = function () {
  'use strict';
  var m_this = this,
      s_update = this._update,
      s_init = this._init;

  this._drawTile = function (tile) {
    var bounds = m_this._tileBounds(tile),
        parentNode = m_this._getSubLayer(tile.index.level);
    tile.feature = m_this.createFeature(
      'plane', {drawOnAsyncResourceLoad: true})
      .origin([bounds.left, bounds.top])
      .upperLeft([bounds.left, bounds.top])
      .lowerRight([bounds.right, bounds.bottom])
      .style({
        image: tile._url,
        opacity: 1,
        reference: tile.toString(),
        parentId: parentNode.attr('data-tile-layer-id')
      });
    tile.feature._update();
    m_this.draw();
  };

  /**
   * Return the DOM eleement containing a level specific
   * layer.  This will create the element if it doesn't
   * already exist.
   * @param {number} level The zoom level of the layer to fetch
   * @return {DOM}
   */
  this._getSubLayer = function (level) {
    var node = m_this.canvas().select(
        'g[data-tile-layer="' + level.toFixed() + '"]');
    if (node.empty()) {
      node = m_this.canvas().append('g');
      var id = geo.d3.uniqueID();
      node.classed('group-' + id, true);
      node.classed('geo-tile-layer', true);
      node.attr('data-tile-layer', level.toFixed());
      node.attr('data-tile-layer-id', id);
    }
    return node;
  };

  /**
   * Set sublayer transforms to align them with the given zoom level.
   * @param {number} level The target zoom level
   */
  this._updateSubLayers = function (level) {
    $.each(m_this.canvas().selectAll('.geo-tile-layer')[0], function (idx, el) {
      var layer = parseInt($(el).attr('data-tile-layer'));
      el = m_this._getSubLayer(layer);
      var scale = Math.pow(2, level - layer);
      el.attr('transform', 'matrix(' + [scale, 0, 0, scale, 0, 0].join() + ')');
    });
  };

  /* Initialize the tile layer.  This creates a series of sublayers so that
   * the different layers will stack in the proper order.
   */
  this._init = function () {
    var sublayer;

    s_init.apply(m_this, arguments);
    for (sublayer = 0; sublayer <= m_this._options.maxLevel; sublayer += 1) {
      m_this._getSubLayer(sublayer);
    }
  };

  /* When update is called, apply the transform to our renderer. */
  this._update = function () {
    s_update.apply(m_this, arguments);
    m_this.renderer()._setTransform();
  };

  /* Remove both the tile feature and an internal image element. */
  this._remove = function (tile) {
    if (tile.feature) {
      m_this.deleteFeature(tile.feature);
      tile.feature = null;
    }
    if (tile.image) {
      $(tile.image).remove();
    }
  };
};

geo.registerLayerAdjustment('d3', 'tile', geo.d3.tileLayer);
