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

  var m_this = this,
      s_init = this._init,
      m_features = {},
      m_translate = [0, 0];

  function setAttrs(select, attrs) {
    var key;
    for (key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        select.attr(key, attrs[key]);
      }
    }
  }

  function getMap() {
    var layer = m_this.layer();
    if (!layer) {
      return null;
    }
    return layer.map();
  }

  function getBaseLayer() {
    var map = getMap();
    if (!map) {
      return null;
    }
    return map.baseLayer();
  }

  function getBaseRenderer() {
    var base = getBaseLayer();
    if (!base) {
      return null;
    }
    return base.renderer();
  }
  
  // translate the layer by a vector delta
  function translate (delta) {
    if (delta === undefined) {
      m_translate[0] = 0;
      m_translate[1] = 0;
    } else {
      m_translate[0] += delta.x;
      m_translate[1] += delta.y;
    }
    m_this.canvas()
      .selectAll('.group-' + m_this._d3id())
        .attr('transform', 'translate(' + m_translate.join() + ')');
  }

  this.latLngToDisplayGenerator = function () {
    var baseRenderer = getBaseRenderer();
    return function (pt) {
      var xy = baseRenderer.worldToDisplay(pt.lat(), pt.lng());
      return { 'x': function () { return xy[0]; },
               'y': function () { return xy[1]; }
      };
    };
  }
  
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
      canvas.attr('width', this.layer().node().width());
      canvas.attr('height', this.layer().node().height());
      this.canvas(canvas);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Projection functions, for now we pass values to the base layer renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function (pt) {
    var baseRenderer = getBaseRenderer();
    if (!baseRenderer) {
      throw "Cannot project until this layer is connected to a map with a base layer.";
    }
    return baseRenderer.displayToWorld(pt);
  };

  this.worldToDisplay = function (pt) {
    var baseRenderer = getBaseRenderer();
    if (!baseRenderer) {
      throw "Cannot project until this layer is connected to a map with a base layer.";
    }
    return baseRenderer.worldToDisplay(pt);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.api = function() {
    return 'd3';
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function(x, y, w, h) {
    m_this.canvas().attr('width', w);
    m_this.canvas().attr('height', h);
    translate();
    m_this.updateFeatures();
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

  function getGroup(grp) {
    var svg = m_this.canvas(),
        selection = svg.selectAll('.group-' + grp)
       .data([0]);
    selection
      .enter()
        .append('g')
          .attr('class', 'group-' + grp);
    return selection;
  }

  this.drawFeatures = function (arg) {
    m_features[arg.id] = {
      data: arg.data,
      index: arg.dataIndex,
      style: arg.style,
      attributes: arg.attributes,
      classes: arg.classes,
      append: arg.append
    };
    return m_this.updateFeatures(arg.id);
  };

  this.updateFeatures = function (id) {
    if (id === undefined) {
      for (id in m_features) {
        if (m_features.hasOwnProperty(id)) {
          m_this.updateFeatures(id);
        }
      }
      return this;
    }
    var svg = getGroup(m_this._d3id()),
        data = m_features[id].data,
        index = m_features[id].index,
        style = m_features[id].style,
        attributes = m_features[id].attributes,
        classes = m_features[id].classes,
        append = m_features[id].append,
        selection = svg.selectAll('.' + id).data(data, index);
    selection.enter().append(append);
    selection.exit().remove();
    setAttrs(selection, attributes);
    selection.attr('class', classes.concat([id]).join(' '));
    selection.style(style);
    return this;
  };


  // connect to pan event
  this.on(geo.event.pan, function (event) {
    translate({
      x: event.curr_display_pos.x - event.last_display_pos.x,
      y: event.curr_display_pos.y - event.last_display_pos.y
    });
  });

  this.on(geo.event.resize, function (event) {
    m_this._resize(event.x, event.y, event.width, event.height);
  });

  this._init(arg);
  return this;
};

inherit(gd3.d3Renderer, geo.renderer);

geo.registerRenderer('d3Renderer', gd3.d3Renderer);
