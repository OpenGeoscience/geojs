//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pathFeature
 *
 * @class
 * @returns {gd3.pathFeature}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.pathFeature = function (arg) {
  'use strict';
  if (!(this instanceof gd3.pathFeature)) {
    return new gd3.pathFeature(arg);
  }
  arg = arg || {};
  geo.pathFeature.call(this, arg);
  gd3.object.call(this);

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

  // georeference a point with caching
  function georef(d) {
    var r = m_this.renderer(), p;
    p = r.worldToDisplay(d);
    return p;
  }
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(this, arg);
    return this;
  };

  this._build = function () {
    var data = this.positions(),
        s_style = this.style(),
        tmp, diag;
    s_update.call(this);

    diag = function (d) {
        var source = georef(d.source),
            target = georef(d.target),
          p = {
          source: source,
          target: target
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
          source: src,
          target: trg
        });
      }
    });
    m_style.data = tmp;
    m_style.attributes = {
      d: diag
    };

    m_style.id = m_this._d3id();
    m_style.append = 'path';
    m_style.classes = [ 'd3PathFeature' ];
    m_style.style = {
      fill: 'none',
      stroke: d3.rgb(
        s_style.color[0] * 255,
        s_style.color[1] * 255,
        s_style.color[2] * 255
      ),
      'stroke-width': s_style.width[0].toString() + 'px',
      'stroke-opacity': s_style.opacity
    };

    this.renderer().drawFeatures(m_style);

    m_buildTime.modified();
    this.updateTime().modified();
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    s_update.call(this);

    if (this.dataTime().getMTime() >= m_buildTime.getMTime()) {
      this._build();
    }

    return this;
  };
  
  this._init(arg);
  return this;
};

inherit(gd3.pathFeature, geo.pathFeature);

geo.registerFeature('d3', 'path', gd3.pathFeature);
