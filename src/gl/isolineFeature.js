var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var isolineFeature = require('../isolineFeature');

/**
 * Create a new instance of isolineFeature.
 *
 * @class
 * @alias geo.gl.isolineFeature
 * @extends geo.isolineFeature
 * @param {geo.isolineFeature.spec} arg
 * @returns {geo.gl.isolineFeature}
 */
var gl_isolineFeature = function (arg) {
  'use strict';
  if (!(this instanceof gl_isolineFeature)) {
    return new gl_isolineFeature(arg);
  }
  arg = arg || {};
  isolineFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  this._init(arg);
  return this;
};

inherit(gl_isolineFeature, isolineFeature);

// Now register it
registerFeature('vgl', 'isoline', gl_isolineFeature);
module.exports = gl_isolineFeature;
