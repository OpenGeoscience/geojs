//////////////////////////////////////////////////////////////////////////////
/**
 * @module gd3
 */

/*jslint devel: true, unparam: true, indent: 2*/

/*global window, geo, gd3, ogs, vec4, inherit, d3*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class d3Renderer
 *
 * @param canvas
 * @returns {gd3.d3Renderer}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.d3Renderer = function(arg) {
  'use strict';

  if (!(this instanceof gd3.d3Renderer)) {
    return new gd3.d3Renderer(arg);
  }
  geo.renderer.call(this, arg);
  gd3.object.call(this);

  function setAttrs(select, attrs) {
    var key;
    for (key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        select.attr(key, attrs[key]);
      }
    }
  }
  
  var m_this = this,
      s_init = this._init,
      m_features = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function(arg) {
    s_init.call(this, arg);

    if (!this.canvas()) {
      var canvas = d3.select(this.layer().node().get(0)).append('svg');
      canvas.attr('class', this._d3id());
      this._canvas(canvas);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._api = function() {
    return 'd3';
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function(x, y, w, h) {
    this.canvas().attr('width', w);
    this.canvas().attr('height', h);
    // recenter?
    // propagate resize event here?
    //m_viewer.renderWindow().positionAndResize(x, y, w, h);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this._render = function() {
    // unnecessary here?
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function() {
    this.canvas().remove();
  };

  this.drawFeatures = function (arg) {
    var svg = this._canvas(),
        selection = svg.selectAll('.' + arg.id)
                        .data(arg.data, arg.dataIndex);
    selection.enter().append(arg.append);
    selection.exit().remove();
    setAttrs(selection, arg.attributes);
    selection.attr('class', arg.classes.concat([arg.id]).join(' '));
    selection.style(arg.style);
    arg.selection = selection;
    m_features[arg.id] = selection;
    return selection;
  };

  this._init(arg);
  return this;
};

inherit(gd3.d3Renderer, geo.renderer);

geo.registerRenderer('d3Renderer', gd3.d3Renderer);
