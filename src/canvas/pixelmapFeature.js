var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pixelmapFeature = require('../pixelmapFeature');

/**
 * Create a new instance of class pixelmapFeature.
 *
 * @class
 * @alias geo.canvas.pixelmapFeature
 * @extends geo.pixelmapFeature
 * @param {geo.pixelmapFeature.spec} arg
 * @returns {geo.canvas.pixelmapFeature}
 */
var canvas_pixelmapFeature = function (arg) {
  'use strict';

  if (!(this instanceof canvas_pixelmapFeature)) {
    return new canvas_pixelmapFeature(arg);
  }
  pixelmapFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  this._init(arg);
  return this;
};

inherit(canvas_pixelmapFeature, pixelmapFeature);

// Now register it
registerFeature('canvas', 'pixelmap', canvas_pixelmapFeature);
module.exports = canvas_pixelmapFeature;
