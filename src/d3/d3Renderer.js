var inherit = require('../inherit');
var registerRenderer = require('../registry').registerRenderer;
var renderer = require('../renderer');

/**
 * Create a new instance of class d3Renderer.
 *
 * @class geo.d3.renderer
 * @extends geo.renderer
 * @param {object} arg Options for the renderer.
 * @param {geo.layer} [arg.layer] Layer associated with the renderer.
 * @param {HTMLElement} [arg.canvas] Canvas element associated with the
 *   renderer.
 * @param {boolean} [arg.widget=false] Set to `true` if this is a stand-alone
 *   widget.  If it is not a widget, svg elements are wrapped in a parent
 *   group.
 * @param {HTMLElement} [arg.d3Parent] If specified, the parent for any
 *   rendered objects; otherwise the renderer's layer's main node is used.
 * @returns {geo.d3.d3Renderer}
 */
var d3Renderer = function (arg) {
  'use strict';

  var d3 = d3Renderer.d3;
  var object = require('./object');
  var util = require('../util');
  var geo_event = require('../event');
  var d3Rescale = require('./rescale');

  if (!(this instanceof d3Renderer)) {
    return new d3Renderer(arg);
  }
  renderer.call(this, arg);

  var s_exit = this._exit;

  object.call(this, arg);

  arg = arg || {};

  var m_this = this,
      m_sticky = null,
      m_features = {},
      m_corners = null,
      m_width = null,
      m_height = null,
      m_diagonal = null,
      m_scale = 1,
      m_transform = {dx: 0, dy: 0, rx: 0, ry: 0, rotation: 0},
      m_renderIds = {},
      m_removeIds = {},
      m_svg = null,
      m_defs = null;

  /**
   * Set attributes to a d3 selection.
   * @private
   * @param {d3Selector} select The d3 selector with the elements to change.
   * @param {object} attrs A map of attributes to set on the elements.
   */
  function setAttrs(select, attrs) {
    var key;
    for (key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        select.attr(key, attrs[key]);
      }
    }
  }

  /**
   * Meta functions for converting from geojs styles to d3.
   * @private
   * @param {function|object} f The style value or function to convert.
   * @param {function} [g] An optional function that returns a boolean; if it
   *    returns false, the style is set to `'none'`.
   * @returns {function} A function for converting styles.
   */
  this._convertColor = function (f, g) {
    f = util.ensureFunction(f);
    g = g || function () { return true; };
    return function () {
      var c = 'none';
      if (g.apply(m_this, arguments)) {
        c = f.apply(m_this, arguments);
        if (c.hasOwnProperty('r') &&
            c.hasOwnProperty('g') &&
            c.hasOwnProperty('b')) {
          c = d3.rgb(255 * c.r, 255 * c.g, 255 * c.b);
        }
      }
      return c;
    };
  };

  /**
   * Return a function for converting a size in pixels to an appropriate
   * d3 scale.
   * @private
   * @param {function|object} f The style value or function to convert.
   * @returns {function} A function for converting scale.
   */
  this._convertScale = function (f) {
    f = util.ensureFunction(f);
    return function () {
      return f.apply(m_this, arguments) / m_scale;
    };
  };

  /**
   * Set styles to a d3 selection. Ignores unknown style keys.
   * @private
   * @param {d3Selector} select The d3 selector with the elements to change.
   * @param {object} styles Style object associated with a feature.
   */
  function setStyles(select, styles) {
    var key, k, f;
    /**
     * Check if the fill parameter is truthy.
     *
     * @returns {null|'none'} `null` to fill the element, `'none'` to skip
     *  filling it.
     */
    function fillFunc() {
      if (styles.fill.apply(m_this, arguments)) {
        return null;
      } else {
        return 'none';
      }
    }
    /**
     * Check if the stroke parameter is truthy.
     *
     * @returns {null|'none'} `null` to fill the element, `'none'` to skip
     *  filling it.
     */
    function strokeFunc() {
      if (styles.stroke.apply(m_this, arguments)) {
        return null;
      } else {
        return 'none';
      }
    }
    for (key in styles) {
      if (styles.hasOwnProperty(key)) {
        f = null;
        k = null;
        if (key === 'strokeColor') {
          k = 'stroke';
          f = m_this._convertColor(styles[key], styles.stroke);
        } else if (key === 'stroke' && styles[key] &&
                   !styles.hasOwnProperty('strokeColor')) {
          k = 'stroke';
          f = strokeFunc;
        } else if (key === 'strokeWidth') {
          k = 'stroke-width';
          f = m_this._convertScale(styles[key]);
        } else if (key === 'strokeOpacity') {
          k = 'stroke-opacity';
          f = styles[key];
        } else if (key === 'fillColor') {
          k = 'fill';
          f = m_this._convertColor(styles[key], styles.fill);
        } else if (key === 'fill' && !styles.hasOwnProperty('fillColor')) {
          k = 'fill';
          f = fillFunc;
        } else if (key === 'fillOpacity') {
          k = 'fill-opacity';
          f = styles[key];
        } else if (key === 'lineCap') {
          k = 'stroke-linecap';
          f = styles[key];
        } else if (key === 'lineJoin') {
          k = 'stroke-linejoin';
          f = styles[key];
        } else if (key === 'miterLimit') {
          k = 'stroke-miterlimit';
          f = styles[key];
        }
        if (k) {
          select.style(k, f);
        }
      }
    }
  }

  /**
   * Get the svg group element associated with this renderer instance, or of a
   * group within the render instance.
   *
   * @private
   * @param {string} [parentId] Optional parent ID name.
   * @returns {d3Selector} Selector with the d3 group.
   */
  function getGroup(parentId) {
    if (parentId) {
      return m_svg.select('.group-' + parentId);
    }
    return m_svg.select('.group-' + m_this._d3id());
  }

  /**
   * Set the initial lat-lon coordinates of the map view.
   * @private
   */
  function initCorners() {
    var layer = m_this.layer(),
        map = layer.map(),
        width = map.size().width,
        height = map.size().height;

    m_width = width;
    m_height = height;
    if (!m_width || !m_height) {
      throw new Error('Map layer has size 0');
    }
    m_diagonal = Math.pow(width * width + height * height, 0.5);
    m_corners = {
      upperLeft: map.displayToGcs({x: 0, y: 0}, null),
      lowerRight: map.displayToGcs({x: width, y: height}, null),
      center: map.displayToGcs({x: width / 2, y: height / 2}, null)
    };
  }

  /**
   * Set the translation, scale, and zoom for the current view.
   * @private
   */
  this._setTransform = function () {
    if (!m_corners) {
      initCorners();
    }

    if (!m_sticky) {
      return;
    }

    var layer = m_this.layer();

    var map = layer.map(),
        upperLeft = map.gcsToDisplay(m_corners.upperLeft, null),
        lowerRight = map.gcsToDisplay(m_corners.lowerRight, null),
        center = map.gcsToDisplay(m_corners.center, null),
        group = getGroup(),
        dx, dy, scale, rotation, rx, ry;

    scale = Math.sqrt(
      Math.pow(lowerRight.y - upperLeft.y, 2) +
      Math.pow(lowerRight.x - upperLeft.x, 2)) / m_diagonal;
    // calculate the translation
    rotation = map.rotation();
    rx = -m_width / 2;
    ry = -m_height / 2;
    dx = scale * rx + center.x;
    dy = scale * ry + center.y;

    // set the group transform property
    if (!rotation) {
      dx = Math.round(dx);
      dy = Math.round(dy);
    }
    var transform = 'matrix(' + [scale, 0, 0, scale, dx, dy].join() + ')';
    if (rotation) {
      transform += ' rotate(' + [
        rotation * 180 / Math.PI, -rx, -ry].join() + ')';
    }
    group.attr('transform', transform);

    // set internal variables
    m_scale = scale;
    m_transform.dx = dx;
    m_transform.dy = dy;
    m_transform.rx = rx;
    m_transform.ry = ry;
    m_transform.rotation = rotation;
  };

  /**
   * Convert from screen pixel coordinates to the local coordinate system
   * in the SVG group element taking into account the transform.
   * @private
   * @param {geo.screenPosition} pt The coordinates to convert.
   * @returns {geo.geoPosition} The converted coordinates.
   */
  this.baseToLocal = function (pt) {
    pt = {
      x: (pt.x - m_transform.dx) / m_scale,
      y: (pt.y - m_transform.dy) / m_scale
    };
    if (m_transform.rotation) {
      var sinr = Math.sin(-m_transform.rotation),
          cosr = Math.cos(-m_transform.rotation);
      var x = pt.x + m_transform.rx, y = pt.y + m_transform.ry;
      pt = {
        x: x * cosr - y * sinr - m_transform.rx,
        y: x * sinr + y * cosr - m_transform.ry
      };
    }
    return pt;
  };

  /**
   * Convert from the local coordinate system in the SVG group element
   * to screen pixel coordinates.
   * @private
   * @param {geo.geoPosition} pt The coordinates to convert.
   * @returns {geo.screenPosition} The converted coordinates.
   */
  this.localToBase = function (pt) {
    if (m_transform.rotation) {
      var sinr = Math.sin(m_transform.rotation),
          cosr = Math.cos(m_transform.rotation);
      var x = pt.x + m_transform.rx, y = pt.y + m_transform.ry;
      pt = {
        x: x * cosr - y * sinr - m_transform.rx,
        y: x * sinr + y * cosr - m_transform.ry
      };
    }
    pt = {
      x: pt.x * m_scale + m_transform.dx,
      y: pt.y * m_scale + m_transform.dy
    };
    return pt;
  };

  /**
   * Initialize.
   *
   * @param {object} arg The options used to create the renderer.
   * @param {boolean} [arg.widget=false] Set to `true` if this is a stand-alone
   *   widget.  If it is not a widget, svg elements are wrapped in a parent
   *   group.
   * @param {HTMLElement} [arg.d3Parent] If specified, the parent for any
   *   rendered objects; otherwise the renderer's layer's main node is used.
   * @returns {this}
   */
  this._init = function (arg) {
    if (!m_this.canvas()) {
      var canvas;
      arg.widget = arg.widget || false;

      if ('d3Parent' in arg) {
        m_svg = d3.select(arg.d3Parent).append('svg');
      } else {
        m_svg = d3.select(m_this.layer().node().get(0)).append('svg');
      }
      m_svg.attr('display', 'block');

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

      if (!arg.widget) {
        canvas = m_svg.append('g');
      }

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

      if (!arg.widget) {
        canvas.attr('class', 'group-' + m_this._d3id());

        m_this.canvas(canvas);
      } else {
        m_this.canvas(m_svg);
      }
    }
    m_this._setTransform();
    return m_this;
  };

  /**
   * Get API used by the renderer.
   *
   * @returns {string} 'd3'.
   */
  this.api = function () {
    return 'd3';
  };

  /**
   * Return the current scaling factor to build features that shouldn't
   * change size during zooms.  For example:
   *
   *  selection.append('circle')
   *    .attr('r', r0 / renderer.scaleFactor());
   *
   * This will create a circle element with radius r0 independent of the
   * current zoom level.
   *
   * @returns {number} The current scale factor.
   */
  this.scaleFactor = function () {
    return m_scale;
  };

  /**
   * Handle resize event.
   *
   * @param {number} x Ignored.
   * @param {number} y Ignored.
   * @param {number} w New width in pixels.
   * @param {number} h New height in pixels.
   * @returns {this}
   */
  this._resize = function (x, y, w, h) {
    if (!m_corners) {
      initCorners();
    }
    m_svg.attr('width', w);
    m_svg.attr('height', h);
    m_this._setTransform();
    m_this.layer().geoTrigger(d3Rescale, { scale: m_scale }, true);
    return m_this;
  };

  /**
   * Exit.
   */
  this._exit = function () {
    m_features = {};
    m_this.canvas().remove();
    m_svg.remove();
    m_svg = undefined;
    m_defs.remove();
    m_defs = undefined;
    m_renderIds = {};
    m_removeIds = {};
    s_exit();
  };

  /**
   * Get the definitions DOM element for the layer.
   * @protected
   * @returns {HTMLElement} The definitions DOM element.
   */
  this._definitions = function () {
    return m_defs;
  };

  /**
   * Create a new feature element from an object that describes the feature
   * attributes.  To be called from feature classes only.
   *
   * @param {object} arg Options for the features.
   * @param {string} arg.id A unique string identifying the feature.
   * @param {array} arg.data Array of data objects used in a d3 data method.
   * @param {function} [aeg.dataIndex] A function that returns a unique id for
   *    each data element.  This is passed to the data access function.
   * @param {object} arg.style An object with style values or functions.
   * @param {object} arg.attributes An object containing element attributes.
   *    The keys are the attribute names, and the values are either constants
   *    or functions that get passed a data element and a data index.
   * @param {string[]} arg.classes An array of classes to add to the elements.
   * @param {string} arg.append The element type as used in d3 append methods.
   *    This is something like `'path'`, `'circle'`, or `'line'`.
   * @param {boolean} [arg.onlyRenderNew] If truthy, features only get
   *    attributes and styles set when new.  If falsy, features always have
   *    attributes and styles updated.
   * @param {boolean} [arg.sortByZ] If truthy, sort features by the `d.zIndex`.
   * @param {string} [parentId] If set, the group ID of the parent element.
   * @returns {this}
   */
  this._drawFeatures = function (arg) {
    m_features[arg.id] = {
      data: arg.data,
      index: arg.dataIndex,
      style: arg.style,
      visible: arg.visible,
      attributes: arg.attributes,
      classes: arg.classes,
      append: arg.append,
      onlyRenderNew: arg.onlyRenderNew,
      sortByZ: arg.sortByZ,
      parentId: arg.parentId
    };
    return m_this.__render(arg.id, arg.parentId);
  };

  /**
   * Updates a feature by performing a d3 data join.  If no input id is
   * provided then this method will update all features.
   *
   * @param {string} [id] The id of the feature to update.  `undefined` to
   *    update all features.
   * @param {string} [parentId] The parent of the feature(s).  If not
   *    specified, features are rendered on the next animation frame.
   * @returns {this}
   */
  this.__render = function (id, parentId) {
    var key;
    if (id === undefined) {
      for (key in m_features) {
        if (m_features.hasOwnProperty(key)) {
          m_this.__render(key);
        }
      }
      return m_this;
    }
    if (parentId) {
      m_this._renderFeature(id, parentId);
    } else {
      m_renderIds[id] = true;
      m_this.layer().map().scheduleAnimationFrame(m_this._renderFrame);
    }
    return m_this;
  };

  /**
   * Render all features that are marked as needing an update.  This should
   * only be called duration an animation frame.
   */
  this._renderFrame = function () {
    var id;
    for (id in m_removeIds) {
      m_this.select(id).remove();
      m_defs.selectAll('.' + id).remove();
    }
    m_removeIds = {};
    var ids = m_renderIds;
    m_renderIds = {};
    for (id in ids) {
      if (ids.hasOwnProperty(id)) {
        m_this._renderFeature(id);
      }
    }
  };

  /**
   * Render a single feature.
   *
   * @param {string} id The id of the feature to update.
   * @param {string} [parentId] The parent of the feature.  This is used to
   *    select the feature.
   * @returns {this}
   */
  this._renderFeature = function (id, parentId) {
    if (!m_features[id]) {
      return m_this;
    }
    var data = m_features[id].data,
        index = m_features[id].index,
        style = m_features[id].style,
        visible = m_features[id].visible,
        attributes = m_features[id].attributes,
        classes = m_features[id].classes,
        append = m_features[id].append,
        selection = m_this.select(id, parentId).data(data, index),
        entries, rendersel;
    entries = selection.enter().append(append);
    selection.exit().remove();
    rendersel = m_features[id].onlyRenderNew ? entries : selection;
    setAttrs(rendersel, attributes);
    rendersel.attr('class', classes.concat([id]).join(' '));
    setStyles(rendersel, style);
    if (visible) {
      rendersel.style('visibility', visible() ? 'visible' : 'hidden');
    }
    if (entries.size() && m_features[id].sortByZ) {
      selection.sort(function (a, b) {
        return (a.zIndex || 0) - (b.zIndex || 0);
      });
    }
    return m_this;
  };

  /**
   * Returns a d3 selection for the given feature id.
   *
   * @param {string} id The id of the feature to select.
   * @param {string} [parentId] The parent of the feature.  This is used to
   *    determine the feature's group.
   * @returns {d3Selector}
   */
  this.select = function (id, parentId) {
    return getGroup(parentId).selectAll('.' + id);
  };

  /**
   * Removes a feature from the layer.
   *
   * @param {string} id The id of the feature to remove.
   * @returns {this}
   */
  this._removeFeature = function (id) {
    m_removeIds[id] = true;
    m_this.layer().map().scheduleAnimationFrame(m_this._renderFrame);
    delete m_features[id];
    if (m_renderIds[id]) {
      delete m_renderIds[id];
    }
    return m_this;
  };

  /**
   * Override draw method to do nothing.
   */
  this.draw = function () {
  };

  // connect to pan event
  this.layer().geoOn(geo_event.pan, m_this._setTransform);

  // connect to rotate event
  this.layer().geoOn(geo_event.rotate, m_this._setTransform);

  // connect to zoom event
  this.layer().geoOn(geo_event.zoom, function () {
    m_this._setTransform();
    m_this.__render();
    m_this.layer().geoTrigger(d3Rescale, { scale: m_scale }, true);
  });

  this.layer().geoOn(geo_event.resize, function (event) {
    m_this._resize(event.x, event.y, event.width, event.height);
  });

  this._init(arg);
  return this;
};

inherit(d3Renderer, renderer);

registerRenderer('d3', d3Renderer);

(function () {
  'use strict';

  /**
   * Report if the d3 renderer is supported.  This is just a check if d3 is
   * available.
   *
   * @returns {boolean} true if available.
   */
  d3Renderer.supported = function () {
    delete d3Renderer.d3;
    // webpack expects optional dependencies to be wrapped in a try-catch
    try {
      d3Renderer.d3 = require('d3');
    } catch (_error) {}
    return d3Renderer.d3 !== undefined;
  };

  /**
   * If the d3 renderer is not supported, supply the name of a renderer that
   * should be used instead.  This asks for the null renderer.
   *
   * @returns {null} `null` for the null renderer.
   */
  d3Renderer.fallback = function () {
    return null;
  };

  d3Renderer.supported();  // cache reference to d3 if it is available
})();

module.exports = d3Renderer;
