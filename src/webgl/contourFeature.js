var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var contourFeature = require('../contourFeature');

/**
 * Create a new instance of contourFeature.
 *
 * @class
 * @alias geo.webgl.contourFeature
 * @extends geo.contourFeature
 * @extends geo.webgl.meshColored
 * @param {geo.contourFeature.spec} arg
 * @returns {geo.webgl.contourFeature}
 */
var webgl_contourFeature = function (arg) {
  'use strict';

  if (!(this instanceof webgl_contourFeature)) {
    return new webgl_contourFeature(arg);
  }
  arg = arg || {};
  contourFeature.call(this, arg);

  var meshColored = require('./meshColored');
  meshColored.call(this, arg);

  var m_this = this;

  /**
   * Build.
   */
  this._build = function () {
    if (m_this.actors()[0]) {
      m_this.renderer().contextRenderer().removeActor(m_this.actors()[0]);
    }

    m_this.createGLMeshColored(m_this._createContours());

    m_this.renderer().contextRenderer().addActor(m_this.actors()[0]);
    m_this.buildTime().modified();
  };

  this._init(arg);
  return this;
};

inherit(webgl_contourFeature, contourFeature);

// Now register it
registerFeature('webgl', 'contour', webgl_contourFeature);

module.exports = webgl_contourFeature;
