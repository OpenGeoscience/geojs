var inherit = require('./inherit');
var feature = require('./feature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class geomFeature
 *
 * @class geo.geomFeature
 * @extends geo.feature
 * @returns {geo.geomFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var geomFeature = function (arg) {
  'use strict';
  if (!(this instanceof geomFeature)) {
    return new geomFeature(arg);
  }

  var $ = require('jquery');

  arg = arg || {};
  feature.call(this, arg);

  arg.style = arg.style === undefined ? $.extend({}, {
    'color': [1.0, 1.0, 1.0],
    'point_sprites': false,
    'point_sprites_image': null
  }, arg.style) : arg.style;

  // Update style
  this.style(arg.style);

  return this;
};

inherit(geomFeature, feature);
module.exports = geomFeature;
