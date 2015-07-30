(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////////////
  /**
   * This method defines a tileLayer, which is an abstract class defining a
   * layer divided into tiles of arbitrary data.  Notably, this class provides
   * the core functionality of the osmLayer, but hooks exist to render tiles
   * dynamically from vector data, or to display arbitrary grids of images
   * in a custom coordinate system.  When multiple zoom levels are present
   * in a given dataset, this class assumes that the space occupied by
   * tile (i, j) at level z is covered by a 2x2 grid of tiles at zoom
   * level z + 1:
   *
   *   (2i, 2j),     (2i, 2j + 1)
   *   (2i + 1, 2j), (2i + 1, 2j + 1)
   *
   * The higher level tile set should represent a 2x increase in resolution.
   *
   * Although not currently supported, this class is intended to extend to
   * 3D grids of tiles as well where 1 tile is covered by a 2x2x2 grid of
   * tiles at the next level.
   *
   * @class
   * @extends geo.featureLayer
   *
   */
  //////////////////////////////////////////////////////////////////////////////
  geo.tileLayer = function (options) {
    if (!(this instanceof geo.tileLayer)) {
      return new geo.tileLayer(options);
    }
    geo.featureLayer.call(this, options);
  };


  geo.tileLayer.prototype = {};

  inherit(geo.tileLayer, geo.featureLayer);
})();
