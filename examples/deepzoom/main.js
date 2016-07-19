// Run after the DOM loads
$(function () {
  'use strict';

  // custom tileLayer for deepzoom
  var DeepZoom = function (arg) {
    if (!(this instanceof DeepZoom)) {
      return new DeepZoom(arg);
    }
    geo.tileLayer.call(this, arg);

    this._getTile = function (index, source) {
      return geo.imageTile({
        index: index,
        size: {x: this._options.tileWidth, y: this._options.tileHeight},
        url: this._options.url(source || index)
      });
    };
  };

  DeepZoom.defaults = $.extend({}, geo.tileLayer.defaults, {
    minLevel: 0,
    maxLevel: 9,
    levelOffset: 8,
    attribution: '',
    wrapX: false,
    wrapY: false,
    url: function (index) {
      return 'http://node15.cci.emory.edu/cgi-bin/iipsrv.fcgi?DeepZoom=/bigdata2/' +
      'PYRAMIDS/CDSA/ACC_Diagnostic/nationwidechildrens.org_ACC.diagnostic_images.' +
      'Level_1.304.4.0/TCGA-OR-A5J1-01Z-00-DX1.600C7D8C-F04C-4125-AF14-B1E76DC01A1E.' +
      'svs.dzi.tif_files/' + (index.level + 8) + '/' + index.x + '_' + index.y + '.jpg';
    },
    tileOffset : function (level) {
      var s = Math.pow(2, level - 1) * 256;
      return {x: s, y: s};
    }
  });
  geo.inherit(DeepZoom, geo.tileLayer);
  geo.registerLayer('tiledFish', DeepZoom);
  // Create a map object
  var map = geo.map({
    node: '#map'
  });

  // Add the osm layer with a custom tile url
  map.createLayer(
    'tiledFish'
  );
});
