var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pixelmapFeature = require('../pixelmapFeature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pixelmapFeature
 *
 * @class geo.gl.pixelmapFeature
 * @param {Object} arg Options object
 * @extends geo.pixelmapFeature
 * @returns {gl_pixelmapFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var gl_pixelmapFeature = function (arg) {
  'use strict';

  if (!(this instanceof gl_pixelmapFeature)) {
    return new gl_pixelmapFeature(arg);
  }
  pixelmapFeature.call(this, arg);
  var object = require('./object');
  object.call(this);

  this._init(arg);
  return this;
};

inherit(gl_pixelmapFeature, pixelmapFeature);

// Now register it
registerFeature('vgl', 'pixelmap', gl_pixelmapFeature);
module.exports = gl_pixelmapFeature;
