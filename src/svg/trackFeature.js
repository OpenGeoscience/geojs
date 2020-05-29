var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var trackFeature = require('../trackFeature');

/**
 * Create a new instance of class trackFeature.
 *
 * @class
 * @alias geo.svg.trackFeature
 * @extends geo.trackFeature
 * @param {geo.trackFeature.spec} arg
 * @returns {geo.svg.trackFeature}
 */
var svg_trackFeature = function (arg) {
  'use strict';
  if (!(this instanceof svg_trackFeature)) {
    return new svg_trackFeature(arg);
  }

  arg = arg || {};
  trackFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  this._init(arg);
  return this;
};

inherit(svg_trackFeature, trackFeature);

// Now register it
registerFeature('svg', 'track', svg_trackFeature);
module.exports = svg_trackFeature;
