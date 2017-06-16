var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Create a new instance of class pathFeature
 *
 * @class geo.pathFeature
 * @extends geo.feature
 * @returns {geo.pathFeature}
 */
var pathFeature = function (arg) {
  'use strict';
  if (!(this instanceof pathFeature)) {
    return new pathFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      m_position = arg.position === undefined ? [] : arg.position,
      s_init = this._init;

  /**
   * Get/Set positions
   *
   * @returns {geo.pathFeature}
   */
  this.position = function (val) {
    if (val === undefined) {
      return m_position;
    }
    // Copy incoming array of positions
    m_position = val;
    m_this.dataTime().modified();
    m_this.modified();
    return m_this;
  };

  /**
   * Initialize
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        'strokeWidth': function () { return 1; },
        'strokeColor': function () { return { r: 1.0, g: 1.0, b: 1.0 }; }
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    if (m_position) {
      m_this.dataTime().modified();
    }
  };

  this._init(arg);
  return this;
};

inherit(pathFeature, feature);
module.exports = pathFeature;
