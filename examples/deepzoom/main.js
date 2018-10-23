/* globals utils */

// custom tileLayer for deepzoom
var DeepZoom = function (arg) {
  if (!(this instanceof DeepZoom)) {
    return new DeepZoom(arg);
  }
  geo.tileLayer.call(this, arg);

  this._getTile = function (index, source) {
    return geo.imageTile({
      index: index,
      size: {
        x: this._options.tileWidth + this._options.tileOverlap.x * 2,
        y: this._options.tileHeight + this._options.tileOverlap.y * 2
      },
      queue: this._queue,
      url: this._options.url(source || index),
      overlap: this._options.tileOverlap,
      crossDomain: this._options.crossDomain
    });
  };
};
DeepZoom.defaults = $.extend({}, geo.tileLayer.defaults);
geo.inherit(DeepZoom, geo.tileLayer);
geo.registerLayer('deepzoom', DeepZoom);

var query = utils.getQuery();

// You can specify a different Deep Zoom image via ?url=(url to dzi or xml)
var dzi_url = query.url || 'https://mars.nasa.gov/msl/multimedia/deepzoom/images/PIA19818/dzc_output.xml';
var dzi_base = dzi_url.split('.').slice(0, -1).join('.') + '_files';

// Read the Deep Zoom image information.
$.get(dzi_url).then(function (dzi_info) {
  // Parse the Deep Zoom image information to get the tile size, format, and
  // image size.  The actual tile images are (TileSize + 2 * Overlap) pixels in
  // width and height.
  var tileSize = +$('Image', dzi_info).attr('TileSize'),
      tileOverlap = +$('Image', dzi_info).attr('Overlap') || 0,
      format = $('Image', dzi_info).attr('Format'),
      sizeX = +$('Image>Size', dzi_info).attr('Width'),
      sizeY = +$('Image>Size', dzi_info).attr('Height');

  // get some standard parameters for map and level in pixel-coordinate space
  var defaultParams = geo.util.pixelCoordinateParams(
    '#map', sizeX, sizeY, tileSize, tileSize);

  // Create a map object
  var map = geo.map(defaultParams.map);

  map.createLayer(
    'deepzoom', $.extend({}, defaultParams.layer, {
      // For testing, we can ask for a specific renderer
      renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
      // We ask to use the quad.imageFixedScale feature, since the Deep Zoom
      // server returns partial tiles at the right and bottom edges.  If the
      // tile server returned complete tiles that we need to crop, we would ask
      // for the quad.imageCrop feature instead.
      features: query.renderer ? undefined : ['quad.imageFixedScale'],
      // Specify a custom url for tiles.  Deep Zoom offsets the level by 8
      url: function (index) {
        return dzi_base + '/' + (index.level + 8) + '/' + index.x + '_' + index.y + '.' + format;
      },
      // Specify the tile overlap
      tileOverlap: {
        x: tileOverlap,
        y: tileOverlap
      }
    })
  );
});
