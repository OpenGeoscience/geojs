var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pathFeature = require('../pathFeature');

/**
 * Create a new instance of class pathFeature
 *
 * @class geo.d3.pathFeature
 * @extends geo.pathFeature
 * @extends geo.d3.object
 * @returns {geo.d3.pathFeature}
 */
var d3_pathFeature = function (arg) {
  'use strict';
  if (!(this instanceof d3_pathFeature)) {
    return new d3_pathFeature(arg);
  }

  var $ = require('jquery');
  var d3 = require('./d3Renderer').d3;
  var object = require('./object');
  var timestamp = require('../timestamp');

  arg = arg || {};
  pathFeature.call(this, arg);
  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_init = this._init,
      m_buildTime = timestamp(),
      s_update = this._update,
      m_style = {};

  m_style.style = {};

  /**
   * Initialize
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);
    return m_this;
  };

  /**
   * Build
   *
   * @override
   */
  this._build = function () {
    var data = m_this.data() || [],
        s_style = m_this.style(),
        tmp, diag;
    s_update.call(m_this);

    diag = function (d) {
      var p = {
        source: d.source,
        target: d.target
      };
      return d3.svg.diagonal()(p);
    };
    tmp = [];
    data.forEach(function (d, i) {
      var src, trg;
      if (i < data.length - 1) {
        src = d;
        trg = data[i + 1];
        tmp.push({
          source: m_this.featureGcsToDisplay(src),
          target: m_this.featureGcsToDisplay(trg)
        });
      }
    });
    m_style.data = tmp;
    m_style.attributes = {
      d: diag
    };

    m_style.id = m_this._d3id();
    m_style.append = 'path';
    m_style.classes = ['d3PathFeature'];
    m_style.style = $.extend({
      'fill': function () { return false; },
      'fillColor': function () { return { r: 0, g: 0, b: 0 }; }
    }, s_style);
    m_style.visible = m_this.visible;

    m_this.renderer()._drawFeatures(m_style);

    m_buildTime.modified();
    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Update
   *
   * @override
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_buildTime.getMTime()) {
      m_this._build();
    }

    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(d3_pathFeature, pathFeature);

registerFeature('d3', 'path', d3_pathFeature);

module.exports = d3_pathFeature;
