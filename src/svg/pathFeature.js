var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pathFeature = require('../pathFeature');

/**
 * Create a new instance of class geo.svg.pathFeature.
 *
 * @class
 * @alias geo.svg.pathFeature
 * @extends geo.pathFeature
 * @extends geo.svg.object
 * @param {geo.pathFeature.spec} arg
 * @returns {geo.svg.pathFeature}
 */
var svg_pathFeature = function (arg) {
  'use strict';
  if (!(this instanceof svg_pathFeature)) {
    return new svg_pathFeature(arg);
  }

  var $ = require('jquery');
  var d3 = require('./svgRenderer').d3;
  var object = require('./object');
  var timestamp = require('../timestamp');

  arg = arg || {};
  pathFeature.call(this, arg);
  object.call(this);

  var m_this = this,
      m_buildTime = timestamp(),
      s_update = this._update,
      m_style = {};

  m_style.style = {};

  /**
   * Build.
   *
   * @returns {this}
   */
  this._build = function () {
    var data = m_this.data() || [],
        s_style = m_this.style.get(),
        posFunc = m_this.style.get('position'),
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
        src = posFunc(d, i);
        trg = posFunc(data[i + 1], i + 1);
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

    m_style.id = m_this._svgid();
    m_style.append = 'path';
    m_style.classes = ['svgPathFeature'];
    m_style.style = $.extend({
      fill: function () { return false; },
      fillColor: {r: 0, g: 0, b: 0}
    }, s_style);
    m_style.visible = m_this.visible;

    m_this.renderer()._drawFeatures(m_style);

    m_buildTime.modified();
    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Update.
   *
   * @returns {this}
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().timestamp() >= m_buildTime.timestamp()) {
      m_this._build();
    }

    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(svg_pathFeature, pathFeature);

registerFeature('svg', 'path', svg_pathFeature);

module.exports = svg_pathFeature;
