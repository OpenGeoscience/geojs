var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var isolineFeature = require('../isolineFeature');

/**
 * Create a new instance of isolineFeature.
 *
 * @class
 * @alias geo.webgl.isolineFeature
 * @extends geo.isolineFeature
 * @param {geo.isolineFeature.spec} arg
 * @returns {geo.webgl.isolineFeature}
 */
var webgl_isolineFeature = function (arg) {
  'use strict';
  if (!(this instanceof webgl_isolineFeature)) {
    return new webgl_isolineFeature(arg);
  }
  arg = arg || {};
  isolineFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  this._init(arg);
  return this;
};

inherit(webgl_isolineFeature, isolineFeature);

// Now register it
registerFeature('webgl', 'isoline', webgl_isolineFeature);
module.exports = webgl_isolineFeature;
