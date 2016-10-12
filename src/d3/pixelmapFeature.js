var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pixelmapFeature = require('../pixelmapFeature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pixelmapFeature
 *
 * @class geo.d3.pixelmapFeature
 * @param {Object} arg Options object
 * @extends geo.pixelmapFeature
 * @returns {d3_pixelmapFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var d3_pixelmapFeature = function (arg) {
  'use strict';

  if (!(this instanceof d3_pixelmapFeature)) {
    return new d3_pixelmapFeature(arg);
  }
  pixelmapFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  this._init(arg);
  return this;
};

inherit(d3_pixelmapFeature, pixelmapFeature);

// Now register it
registerFeature('d3', 'pixelmap', d3_pixelmapFeature);
module.exports = d3_pixelmapFeature;
