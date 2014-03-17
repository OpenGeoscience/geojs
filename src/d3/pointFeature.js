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

  var d_attr = {
        cx: function (d) { return d.x; },
        cy: function (d) { return d.y; },
        r: '3pt'
      },
      d_style = {},
      m_style;


  function unpackArg (arg) {
    // convert from geojs argument conventions (to be determined) 
    // to what is used by d3Renderer
    return {
      'id': this._d3id(),
      'append': 'circle',
      'dataIndex': arg.dataIndex || function (d, i) { return i; },
      'attributes': $.extend({}, d_attr, arg.attributes || {}),
      'classes': arg.classes || [],
      'style': $.extend({}, d_style, arg.style || {})
    };
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var s_init = this._init,
      s_update = this._update;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function(arg) {
    s_init.call(this, arg);
    return this;
  };

  this.style = function (arg) {
    if (arg !== undefined) {
      m_style = unpackArg.call(this, arg);
      return this;
    }
    return m_style;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function() {
    var data = this.positions();
    if (!data) { data = []; }
    s_update.call(this);
    m_style.data = data;
    this.renderer().drawFeatures(m_style);
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
    this._build();
    return this;
  };

  this._init(arg);
  return this;
};

inherit(gd3.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature('d3', 'pointFeature', gd3.pointFeature);
