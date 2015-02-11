//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class d3Renderer
 *
 * @class
 * @extends geo.renderer
 * @returns {geo.d3.d3Renderer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.d3.d3Renderer = function (arg) {
  'use strict';

  if (!(this instanceof geo.d3.d3Renderer)) {
    return new geo.d3.d3Renderer(arg);
  }
  geo.renderer.call(this, arg);
  geo.d3.object.call(this, arg);

  arg = arg || {};

  var m_this = this,
      s_exit = this._exit,
      m_sticky = null,
      m_features = {},
      m_corners = null,
      m_width = null,
      m_height = null,
      m_scale = 1,
      m_dx = 0,
      m_dy = 0,
      m_svg = null,
      m_defs = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set attributes to a d3 selection.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function setAttrs(select, attrs) {
    var key;
    for (key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        select.attr(key, attrs[key]);
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Meta functions for converting from geojs styles to d3.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  this._convertColor = function (color, iscolor) {
    return function (d, i) {
      if (iscolor[i]) {
        return d3.rgb(255 * color[i].r, 255 * color[i].g, 255 * color[i].b);
      }
      return 'none';
    };
  };

  this._convertPosition = function (positions) {
    return function (d, i) {
      return m_this.worldToDisplay(positions[i]);
    };
  };

  this._convertScale = function (size) {
    return function (d, i) {
      return size[i] / m_scale;
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set styles to a d3 selection. Ignores unkown style keys.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function setStyles(select, styles) {
    /* jshint validthis:true */

    function defaultAccessor(key) {
      return function (d, i) {
        return styles[key][i];
      };
    }
    var key, k, f;
    for (key in styles) {
      if (styles.hasOwnProperty(key)) {
        f = null;
        k = null;
        if (key === 'strokeColor') {
          k = 'stroke';
          f = m_this._convertColor(styles[key], styles.stroke);
        } else if (key === 'strokeWidth') {
          k = 'stroke-width';
          f = m_this._convertScale(styles[key]);
        } else if (key === 'strokeOpacity') {
          k = 'stroke-opacity';
          f = defaultAccessor(key);
        } else if (key === 'fillColor') {
          k = 'fill';
          f = m_this._convertColor(styles[key], styles.fill);
        } else if (key === 'fillOpacity') {
          k = 'fill-opacity';
          f = defaultAccessor(key);
        }
        if (k) {
          select.style(k, f);
        }
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the map instance or return null if not connected to a map.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function getMap() {
    var layer = m_this.layer();
    if (!layer) {
      return null;
    }
    return layer.map();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the svg group element associated with this renderer instance.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function getGroup() {
    return m_svg.select('.group-' + m_this._d3id());
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set the initial lat-lon coordinates of the map view.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function initCorners() {
    var layer = m_this.layer(),
        map = layer.map(),
        width = m_this.layer().width(),
        height = m_this.layer().height();

    m_width = width;
    m_height = height;
    if (!m_width || !m_height) {
      throw 'Map layer has size 0';
    }
    m_corners = {
      'upperLeft': map.displayToGcs({'x': 0, 'y': 0}),
      'lowerRight': map.displayToGcs({'x': width, 'y': height})
    };
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set the translation, scale, and zoom for the current view.
   * @note rotation not yet supported
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function setTransform() {

    if (!m_corners) {
      initCorners();
    }

    if (!m_sticky) {
      return;
    }

    var layer = m_this.layer(),
        map = layer.map(),
        upperLeft = map.gcsToDisplay(m_corners.upperLeft),
        lowerRight = map.gcsToDisplay(m_corners.lowerRight),
        group = getGroup(),
        dx, dy, scale;

    // calculate the translation
    dx = upperLeft.x;
    dy = upperLeft.y;

    // calculate the scale
    scale = (lowerRight.y - upperLeft.y) / m_height;

    // set the group transform property
    group.attr('transform', 'matrix(' + [scale, 0, 0, scale, dx, dy].join() + ')');

    // set internal variables
    m_scale = scale;
    m_dx = dx;
    m_dy = dy;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from screen pixel coordinates to the local coordinate system
   * in the SVG group element taking into account the transform.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function baseToLocal(pt) {
    return {
      x: (pt.x - m_dx) / m_scale,
      y: (pt.y - m_dy) / m_scale
    };
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from the local coordinate system in the SVG group element
   * to screen pixel coordinates.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function localToBase(pt) {
    return {
      x: pt.x * m_scale + m_dx,
      y: pt.y * m_scale + m_dy
    };
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    if (!m_this.canvas()) {
      var canvas;
      m_svg = d3.select(m_this.layer().node().get(0)).append('svg');

      // create a global svg definitions element
      m_defs = m_svg.append('defs');

      var shadow = m_defs
        .append('filter')
          .attr('id', 'geo-highlight')
          .attr('x', '-100%')
          .attr('y', '-100%')
          .attr('width', '300%')
          .attr('height', '300%');
      shadow
        .append('feMorphology')
          .attr('operator', 'dilate')
          .attr('radius', 2)
          .attr('in', 'SourceAlpha')
          .attr('result', 'dilateOut');
      shadow
        .append('feGaussianBlur')
          .attr('stdDeviation', 5)
          .attr('in', 'dilateOut')
          .attr('result', 'blurOut');
      shadow
        .append('feColorMatrix')
          .attr('type', 'matrix')
          .attr('values', '-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0')
          .attr('in', 'blurOut')
          .attr('result', 'invertOut');
      shadow
        .append('feBlend')
          .attr('in', 'SourceGraphic')
          .attr('in2', 'invertOut')
          .attr('mode', 'normal');
      canvas = m_svg.append('g');

      shadow = m_defs.append('filter')
          .attr('id', 'geo-blur')
          .attr('x', '-100%')
          .attr('y', '-100%')
          .attr('width', '300%')
          .attr('height', '300%');

      shadow
        .append('feGaussianBlur')
          .attr('stdDeviation', 20)
          .attr('in', 'SourceGraphic');

      m_sticky = m_this.layer().sticky();
      m_svg.attr('class', m_this._d3id());
      m_svg.attr('width', m_this.layer().node().width());
      m_svg.attr('height', m_this.layer().node().height());

      canvas.attr('class', 'group-' + m_this._d3id());

      m_this.canvas(canvas);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from coordinates in the svg group element to lat/lon.
   * Supports objects or arrays of objects.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function (pt) {
    var map = getMap();
    if (!map) {
      throw 'Cannot project until this layer is connected to a map.';
    }
    if (Array.isArray(pt)) {
      pt = pt.map(function (x) {
        return map.displayToGcs(localToBase(x));
      });
    } else {
      pt = map.displayToGcs(localToBase(pt));
    }
    return pt;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from lat/lon to pixel coordinates in the svg group element.
   * Supports objects or arrays of objects.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToDisplay = function (pt) {
    var map = getMap();
    if (!map) {
      throw 'Cannot project until this layer is connected to a map.';
    }
    var v;
    if (Array.isArray(pt)) {
      v = pt.map(function (x) {
        return baseToLocal(map.gcsToDisplay(x));
      });
    } else {
      v = baseToLocal(map.gcsToDisplay(pt));
    }
    return v;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.api = function () {
    return 'd3';
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the current scaling factor to build features that shouldn't
   * change size during zooms.  For example:
   *
   *  selection.append('circle')
   *    .attr('r', r0 / renderer.scaleFactor());
   *
   * This will create a circle element with radius r0 independent of the
   * current zoom level.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.scaleFactor = function () {
    return m_scale;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function (x, y, w, h) {
    if (!m_corners) {
      initCorners();
    }
    m_svg.attr('width', w);
    m_svg.attr('height', h);
    setTransform();
    m_this.layer().geoTrigger(geo.event.d3Rescale, { scale: m_scale }, true);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update noop for geo.d3.object api.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    m_features = {};
    m_this.canvas().remove();
    s_exit();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a new feature element from an object that describes the feature
   * attributes.  To be called from feature classes only.
   *
   * Input:
   *  {
   *    id:         A unique string identifying the feature.
   *    data:       Array of data objects used in a d3 data method.
   *    index:      A function that returns a unique id for each data element.
   *    style:      An object containing element CSS styles.
   *    attributes: An object containing element attributes.
   *    classes:    An array of classes to add to the elements.
   *    append:     The element type as used in d3 append methods.
   *  }
   */
  ////////////////////////////////////////////////////////////////////////////
  this._drawFeatures = function (arg) {
    m_features[arg.id] = {
      data: arg.data,
      index: arg.dataIndex,
      style: arg.style,
      attributes: arg.attributes,
      classes: arg.classes,
      append: arg.append
    };
    return m_this.__render(arg.id);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Updates a feature by performing a d3 data join.  If no input id is
  *  provided then this method will update all features.
  */
  ////////////////////////////////////////////////////////////////////////////
  this.__render = function (id) {
    var key;
    if (id === undefined) {
      for (key in m_features) {
        if (m_features.hasOwnProperty(key)) {
          m_this.__render(key);
        }
      }
      return m_this;
    }
    var data = m_features[id].data,
        index = m_features[id].index,
        style = m_features[id].style,
        attributes = m_features[id].attributes,
        classes = m_features[id].classes,
        append = m_features[id].append,
        selection = m_this.select(id).data(data, index);
    selection.enter().append(append);
    selection.exit().remove();
    setAttrs(selection, attributes);
    selection.attr('class', classes.concat([id]).join(' '));
    setStyles(selection, style);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Returns a d3 selection for the given feature id.
  */
  ////////////////////////////////////////////////////////////////////////////
  this.select = function (id) {
    return getGroup().selectAll('.' + id);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Removes a feature from the layer.
  */
  ////////////////////////////////////////////////////////////////////////////
  this._removeFeature = function (id) {
    m_this.select(id).remove();
    delete m_features[id];
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Override draw method to do nothing.
  */
  ////////////////////////////////////////////////////////////////////////////
  this.draw = function () {
  };

  // connect to pan event
  this.layer().geoOn(geo.event.pan, setTransform);

  // connect to zoom event
  this.layer().geoOn(geo.event.zoom, function () {
    setTransform();
    m_this.__render();
    m_this.layer().geoTrigger(geo.event.d3Rescale, { scale: m_scale }, true);
  });

  this.layer().geoOn(geo.event.resize, function (event) {
    m_this._resize(event.x, event.y, event.width, event.height);
  });

  this._init(arg);
  return this;
};

inherit(geo.d3.d3Renderer, geo.renderer);

geo.registerRenderer('d3', geo.d3.d3Renderer);
