//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class geomFeature
 *
 * @class
 * @returns {geo.geomFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.geomFeature = function (arg) {
  "use strict";
  if (!(this instanceof geo.geomFeature)) {
    return new geo.geomFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  arg.style = arg.style === undefined ? $.extend({}, {
    "color": [1.0, 1.0, 1.0],
    "point_sprites": false,
    "point_sprites_image": null
  }, arg.style) : arg.style;

  // Update style
  this.style(arg.style);

  return this;
};

inherit(geo.geomFeature, geo.feature);
