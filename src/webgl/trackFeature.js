var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var trackFeature = require('../trackFeature');

/**
 * Create a new instance of trackFeature.
 *
 * @class
 * @alias geo.webgl.trackFeature
 * @extends geo.trackFeature
 * @param {geo.trackFeature.spec} arg
 * @returns {geo.webgl.trackFeature}
 */
var webgl_trackFeature = function (arg) {
  'use strict';
  if (!(this instanceof webgl_trackFeature)) {
    return new webgl_trackFeature(arg);
  }
  arg = arg || {};
  trackFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  this._init(arg);
  return this;
};

inherit(webgl_trackFeature, trackFeature);

// Now register it
registerFeature('webgl', 'track', webgl_trackFeature);
module.exports = webgl_trackFeature;
