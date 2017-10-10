/* globals utils */

// Run after the DOM loads
$(function () {
  'use strict';

  var query = utils.getQuery();

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
        queue: this._queue,
        url: this._options.url(source || index)
      });
    };
  };

  // We know the size of the image we are requesting, and we want to use
  // pixel coordinates on our map.
  var sizeX = 103583, sizeY = 70014, tileSize = 256;
  var defaultParams = geo.util.pixelCoordinateParams(
        '#map', sizeX, sizeY, tileSize, tileSize);

  DeepZoom.defaults = $.extend({}, geo.tileLayer.defaults, defaultParams.layer, {
    levelOffset: 8,
    url: function (index) {
      return 'http://node15.cci.emory.edu/cgi-bin/iipsrv.fcgi?DeepZoom=/bigdata2/' +
      'PYRAMIDS/CDSA/ACC_Diagnostic/nationwidechildrens.org_ACC.diagnostic_images.' +
      'Level_1.304.4.0/TCGA-OR-A5J1-01Z-00-DX1.600C7D8C-F04C-4125-AF14-B1E76DC01A1E.' +
      'svs.dzi.tif_files/' + (index.level + 8) + '/' + index.x + '_' + index.y + '.jpg';
    }
  });
  geo.inherit(DeepZoom, geo.tileLayer);
  geo.registerLayer('tiledFish', DeepZoom);
  // Create a map object
  var map = geo.map($.extend({}, defaultParams.map, {
    node: '#map',
    clampBoundsX: false,
    clampBoundsY: false,
    clampZoom: false,
    zoom: 4
  }));

  // Add the osm layer with a custom tile url.
  // We ask to use the quad.imageFixedScale feature, since the IIP server
  // returns partial tiles at the right and bottom edges.  If the tile server
  // returns complete tiles that we need to crop, we would ask for the
  // quad.imageCrop feature instead.
  map.createLayer(
    'tiledFish', {
      renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
      features: query.renderer ? undefined : ['quad.imageFixedScale']
    }
  );
});
