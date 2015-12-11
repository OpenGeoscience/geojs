//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pathFeature
 *
 * @class
 * @extends geo.pathFeature
 * @extends geo.d3.object
 * @returns {geo.d3.pathFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.d3.pathFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.d3.pathFeature)) {
    return new geo.d3.pathFeature(arg);
  }
  arg = arg || {};
  geo.pathFeature.call(this, arg);
  geo.d3.object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      m_buildTime = geo.timestamp(),
      s_update = this._update,
      m_style = {};

  m_style.style = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
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
          source: this.featureGcsToDisplay(src),
          target: this.featureGcsToDisplay(trg)
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

    m_this.renderer()._drawFeatures(m_style);

    m_buildTime.modified();
    m_this.updateTime().modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
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

inherit(geo.d3.pathFeature, geo.pathFeature);

geo.registerFeature('d3', 'path', geo.d3.pathFeature);
