//////////////////////////////////////////////////////////////////////////////
/**
 * @class
 * @extends geo.sceneObject
 * @param {Object?} arg An options argument
 * @param {string} arg.attribution An attribution string to display
 * @param {number} arg.zIndex The z-index to assign to the layer (defaults
 *   to the index of the layer inside the map)
 * @returns {geo.layer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.layer = function (arg) {
  'use strict';

  if (!(this instanceof geo.layer)) {
    return new geo.layer(arg);
  }
  arg = arg || {};
  geo.sceneObject.call(this, arg);

  //////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  //////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_exit = this._exit,
      m_id = arg.id === undefined ? geo.layer.newLayerId() : arg.id,
      m_name = '',
      m_map = arg.map === undefined ? null : arg.map,
      m_node = null,
      m_canvas = null,
      m_renderer = null,
      m_initialized = false,
      m_rendererName = arg.renderer === undefined ? 'vgl' : arg.renderer,
      m_dataTime = geo.timestamp(),
      m_updateTime = geo.timestamp(),
      m_sticky = arg.sticky === undefined ? true : arg.sticky,
      m_active = arg.active === undefined ? true : arg.active,
      m_opacity = arg.opacity === undefined ? 1 : arg.opacity,
      m_attribution = arg.attribution || null,
      m_zIndex;

  if (!m_map) {
    throw new Error('Layers must be initialized on a map.');
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the name of the renderer.
   *
   * @returns {string}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.rendererName = function () {
    return m_rendererName;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the z-index of the layer.  The z-index controls the display
   * order of the layers in much the same way as the CSS z-index property.
   *
   * @param {number} [zIndex] The new z-index
   * @returns {number|this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zIndex = function (zIndex) {
    if (zIndex === undefined) {
      return m_zIndex;
    }
    m_zIndex = zIndex;
    m_node.css('z-index', m_zIndex);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bring the layer above the given number of layers.  This will rotate the
   * current z-indices for this and the next `n` layers.
   *
   * @param {number} [n=1] The number of positions to move
   * @returns {this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.moveUp = function (n) {
    var order, i, me = null, tmp, sign;

    // set the default
    if (n === undefined) {
      n = 1;
    }

    // set the sort direction that controls if we are moving up
    // or down the z-index
    sign = 1;
    if (n < 0) {
      sign = -1;
      n = -n;
    }

    // get a sorted list of layers
    order = m_this.map().layers().sort(
      function (a, b) { return sign * (a.zIndex() - b.zIndex()); }
    );

    for (i = 0; i < order.length; i += 1) {
      if (me === null) {
        // loop until we get to the current layer
        if (order[i] === m_this) {
          me = i;
        }
      } else if (i - me <= n) {
        // swap the next n layers
        tmp = m_this.zIndex();
        m_this.zIndex(order[i].zIndex());
        order[i].zIndex(tmp);
      } else {
        // all the swaps are done now
        break;
      }
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bring the layer below the given number of layers.  This will rotate the
   * current z-indices for this and the previous `n` layers.
   *
   * @param {number} [n=1] The number of positions to move
   * @returns {this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.moveDown = function (n) {
    if (n === undefined) {
      n = 1;
    }
    return m_this.moveUp(-n);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bring the layer to the top of the map layers.
   *
   * @returns {this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.moveToTop = function () {
    return m_this.moveUp(m_this.map().children().length - 1);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bring the layer to the bottom of the map layers.
   *
   * @returns {this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.moveToBottom = function () {
    return m_this.moveDown(m_this.map().children().length - 1);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get whether or not the layer is sticky (navigates with the map).
   *
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sticky = function () {
    return m_sticky;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get whether or not the layer is active.  An active layer will receive
   * native mouse when the layer is on top.  Non-active layers will never
   * receive native mouse events.
   *
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.active = function () {
    return m_active;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set root node of the layer
   *
   * @returns {div}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.node = function () {
    return m_node;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set id of the layer
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.id = function (val) {
    if (val === undefined) {
      return m_id;
    }
    m_id = geo.newLayerId();
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set name of the layer
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.name = function (val) {
    if (val === undefined) {
      return m_name;
    }
    m_name = val;
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set map of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.map = function () {
    return m_map;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get renderer for the layer if any
   */
  ////////////////////////////////////////////////////////////////////////////
  this.renderer = function () {
    return m_renderer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get canvas of the layer
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.canvas = function () {
    return m_canvas;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return last time data got changed
   */
  ////////////////////////////////////////////////////////////////////////////
  this.dataTime = function () {
    return m_dataTime;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the modified time for the last update that did something
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateTime = function () {
    return m_updateTime;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set if the layer has been initialized
   */
  ////////////////////////////////////////////////////////////////////////////
  this.initialized = function (val) {
    if (val !== undefined) {
      m_initialized = val;
      return m_this;
    }
    return m_initialized;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform coordinates from world coordinates into a local coordinate
   * system specific to the underlying renderer.  This method is exposed
   * to allow direct access the rendering context, but otherwise should
   * not be called directly.  The default implementation is the identity
   * operator.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.toLocal = function (input) {
    if (this._toLocalMatrix) {
      geo.camera.applyTransform(this._toLocalMatrix, input);
    }
    return input;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform coordinates from a local coordinate system to world coordinates.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.fromLocal = function (input) {
    if (this._fromLocalMatrix) {
      geo.camera.applyTransform(this._fromLocalMatrix, input);
    }
    return input;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the attribution html content that will displayed with the
   * layer.  By default, nothing will be displayed.  Note, this content
   * is **not** html escaped, so care should be taken when renderering
   * user provided content.
   * @param {string?} arg An html fragment
   * @returns {string|this} Chainable as a setter
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attribution = function (arg) {
    if (arg !== undefined) {
      m_attribution = arg;
      m_this.map().updateAttribution();
      return m_this;
    }
    return m_attribution;
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Init layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    if (m_initialized) {
      return m_this;
    }

    m_map.node().append(m_node);

    /* Pass along the arguments, but not the map reference */
    var options = $.extend({}, arg);
    delete options.map;

    if (m_rendererName === null) {
      // if given a "null" renderer, then pass the map element as the
      // canvas
      m_renderer = null;
      m_canvas = m_node;
    } else if (m_canvas) { // Share context if have valid one
      m_renderer = geo.createRenderer(m_rendererName, m_this, m_canvas,
                                      options);
    } else {
      m_renderer = geo.createRenderer(m_rendererName, m_this, undefined,
                                      options);
      m_canvas = m_renderer.canvas();
    }

    if (!m_this.active()) {
      m_node.css('pointerEvents', 'none');
    }

    m_initialized = true;

    /// Bind events to handlers
    m_this.geoOn(geo.event.resize, function (event) {
      m_this._update({event: event});
    });

    m_this.geoOn(geo.event.pan, function (event) {
      m_this._update({event: event});
    });

    m_this.geoOn(geo.event.zoom, function (event) {
      m_this._update({event: event});
    });

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clean up resouces
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    m_this.geoOff();
    if (m_renderer) {
      m_renderer._exit();
    }
    m_node.off();
    m_node.remove();
    arg = {};
    m_canvas = null;
    m_renderer = null;
    s_exit();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the width of the layer in pixels.
   * **DEPRECIATED: use map.size instead.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.width = function () {
    return m_this.map().size().width;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the height of the layer in pixels
   * **DEPRECIATED: use map.size instead.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.height = function () {
    return m_this.map().size().height;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the current layer opacity.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.opacity = function (opac) {
    if (opac !== undefined) {
      m_opacity = opac;
      m_node.css('opacity', m_opacity);
      return m_this;
    }
    return m_opacity;
  };

  if (arg.zIndex === undefined) {
    arg.zIndex = m_map.children().length;
  }
  m_zIndex = arg.zIndex;

  // Create top level div for the layer
  m_node = $(document.createElement('div'));
  m_node.attr('id', m_name);
  m_node.css('position', 'absolute');
  m_node.css('width', '100%');
  m_node.css('height', '100%');
  m_this.opacity(m_opacity);

  // set the z-index
  m_this.zIndex(m_zIndex);

  return this;
};

/**
 * Gets a new id number for a layer.
 * @protected
 * @instance
 * @returns {number}
 */
geo.layer.newLayerId = (function () {
    'use strict';
    var currentId = 1;
    return function () {
      var id = currentId;
      currentId += 1;
      return id;
    };
  }()
);

/**
 * General object specification for feature types.
 * @typedef geo.layer.spec
 * @type {object}
 * @property {string} [type='feature'] For feature compatibility
 * with more than one kind of creatable layer
 * @property {object[]} [data=[]] The default data array to
 * apply to each feature if none exists
 * @property {string} [renderer='vgl'] The renderer to use
 * @property {geo.feature.spec[]} [features=[]] Features
 * to add to the layer
 */

/**
 * Create a layer from an object.  Any errors in the creation
 * of the layer will result in returning null.
 * @param {geo.map} map The map to add the layer to
 * @param {geo.layer.spec} spec The object specification
 * @returns {geo.layer|null}
 */
geo.layer.create = function (map, spec) {
  'use strict';

  spec = spec || {};

  // add osmLayer later
  spec.type = 'feature';
  if (spec.type !== 'feature') {
    console.warn('Unsupported layer type');
    return null;
  }

  spec.renderer = spec.renderer || 'vgl';
  if (spec.renderer !== 'd3' && spec.renderer !== 'vgl') {
    console.warn('Invalid renderer');
    return null;
  }

  var layer = map.createLayer(spec.type, spec);
  if (!layer) {
    console.warn('Unable to create a layer');
    return null;
  }

  // probably move this down to featureLayer eventually
  spec.features.forEach(function (f) {
    f.data = f.data || spec.data;
    f.feature = geo.feature.create(layer, f);
  });

  return layer;
};

inherit(geo.layer, geo.sceneObject);
