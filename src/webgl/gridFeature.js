var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var gridFeature = require('../gridFeature');

/**
 * Create a new instance of gridFeature.
 *
 * @class
 * @alias geo.webgl.gridFeature
 * @extends geo.gridFeature
 * @extends geo.webgl.meshColored
 * @param {geo.gridFeature.spec} arg
 * @returns {geo.webgl.gridFeature}
 */
var webgl_gridFeature = function (arg) {
  'use strict';

  if (!(this instanceof webgl_gridFeature)) {
    return new webgl_gridFeature(arg);
  }
  arg = arg || {};
  gridFeature.call(this, arg);

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

    m_this.createGLMeshColored(m_this._createGrids());

    m_this.renderer().contextRenderer().addActor(m_this.actors()[0]);
    m_this.buildTime().modified();
  };

  this._init(arg);
  return this;
};

inherit(webgl_gridFeature, gridFeature);

// Now register it
registerFeature('webgl', 'grid', webgl_gridFeature);

module.exports = webgl_gridFeature;
