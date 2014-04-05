//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.d3
 */

/*jslint devel: true, unparam: true*/

/*global geo, gd3, inherit, d3, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @returns {gd3.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.pointFeature = function(arg) {
  "use strict";
  if (!(this instanceof gd3.pointFeature)) {
    return new gd3.pointFeature(arg);
  }
  arg = arg || {};
  geo.pointFeature.call(this, arg);
  gd3.object.call(this);

  var m_this = this;

  // georeference a point with caching
  function georef(d, refresh) {
    if (!refresh && d.hasOwnProperty('_dispx') && d.hasOwnProperty('_dispy')) {
      return d;
    }
    var r = m_this.renderer(), p;
    p = r.worldToDisplay([d.lng(), d.lat()]);
    d._dispx = function () { return p[0][0]; };
    d._dispy = function () { return p[0][1]; };
    return d;
  }

  var d_attr = {
        cx: function (d) { return georef(d, true)._dispx(); },
        cy: function (d) { return georef(d)._dispy(); },
        r: '1px'
      },
      d_style = {
        fill: 'black',
        stroke: 'none'
      };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var s_init = this._init,
      s_update = this._update,
      m_buildTime = geo.timestamp(),
      m_style = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function(arg) {
    s_init.call(this, arg);
    return this;
  };

  this._drawables = function () {
    return d3.selectAll('.' + this._d3id());
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function() {
    var data = this.positions(),
        s_style = this.style();

    // call super-method
    s_update.call(this);
    
    // default to empty data array
    if (!data) { data = []; }

    // fill in d3 renderer style object defaults
    m_style.id = m_this._d3id();
    m_style.data = data;
    m_style.append = 'circle';
    m_style.style = $.extend({}, d_style);
    m_style.attributes = $.extend({}, d_attr);
    m_style.classes = [ 'd3PointFeature' ];

    // replace with user defined styles
    m_style.style.fill = d3.rgb(s_style.color[0]*255, s_style.color[1]*255, s_style.color[2]*255);
    m_style.attributes.r = s_style.size[0].toString() + "px";
    m_style.style['fill-opacity'] = s_style.opacity;

    // pass to renderer to draw
    this.renderer().drawFeatures(m_style);

    // update time stamps
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
  this._update = function() {
    s_update.call(this);

    if (this.dataTime().getMTime() >= m_buildTime.getMTime()) {
      this._build();
    }

    return this;
  };

  this._init(arg);
  return this;
};

inherit(gd3.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature('d3', 'pointFeature', gd3.pointFeature);
