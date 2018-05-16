var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var isolineFeature = require('../isolineFeature');

/**
 * Create a new instance of class isolineFeature.
 *
 * @class
 * @alias geo.canvas.isolineFeature
 * @extends geo.isolineFeature
 * @param {geo.isolineFeature.spec} arg
 * @returns {geo.canvas.isolineFeature}
 */
var canvas_isolineFeature = function (arg) {
  'use strict';
  if (!(this instanceof canvas_isolineFeature)) {
    return new canvas_isolineFeature(arg);
  }

  arg = arg || {};
  isolineFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  this._init(arg);
  return this;
};

inherit(canvas_isolineFeature, isolineFeature);

// Now register it
registerFeature('canvas', 'isoline', canvas_isolineFeature);
module.exports = canvas_isolineFeature;
