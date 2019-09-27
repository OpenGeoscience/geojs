var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var trackFeature = require('../trackFeature');

/**
 * Create a new instance of class trackFeature.
 *
 * @class
 * @alias geo.canvas.trackFeature
 * @extends geo.trackFeature
 * @param {geo.trackFeature.spec} arg
 * @returns {geo.canvas.trackFeature}
 */
var canvas_trackFeature = function (arg) {
  'use strict';
  if (!(this instanceof canvas_trackFeature)) {
    return new canvas_trackFeature(arg);
  }

  arg = arg || {};
  trackFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  this._init(arg);
  return this;
};

inherit(canvas_trackFeature, trackFeature);

// Now register it
registerFeature('canvas', 'track', canvas_trackFeature);
module.exports = canvas_trackFeature;
