//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class lineFeature
 *
 * @class
 * @returns {gd3.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof gd3.lineFeature)) {
    return new gd3.lineFeature(arg);
  }
  arg = arg || {};
  geo.lineFeature.call(this, arg);
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
        line = d3.svg.line()
                .x(function (d) {
                  return georef(d).x;
                })
                .y(function (d) { return georef(d).y; }),
        tmp, diag;
    s_update.call(this);

    if (s_style.nodelink) {
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
    } else {
      m_style.data = [data];
      m_style.attributes = {
        d: line
      };
    }

    m_style.id = m_this._d3id();
    m_style.append = 'path';
    m_style.classes = [ 'd3LineFeature' ];
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

inherit(gd3.lineFeature, geo.lineFeature);

geo.registerFeature('d3', 'line', gd3.lineFeature);
