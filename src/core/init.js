/** @namespace */
var geo = {};     // jshint ignore: line
window.geo = geo; // jshint ignore: line

geo.renderers = {};
geo.features = {};
geo.fileReaders = {};
geo.rendererLayerAdjustments = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convenient function to define JS inheritance
 */
//////////////////////////////////////////////////////////////////////////////
geo.inherit = function (C, P) { // jshint ignore: line
  'use strict';

  var F = inherit.func();
  F.prototype = P.prototype;
  C.prototype = new F();
  C.prototype.constructor = C;
};
geo.inherit.func = function () {
  'use strict';
  return function () {};
};

// Should get rid of this at some point.
window.inherit = geo.inherit;

//////////////////////////////////////////////////////////////////////////////
/**
 * This is a helper method for generating new-style subclasses as an
 * alternative to the older `inherit` classes.  Note: these classes
 * intentionally don't support constructors for the moment.  We may
 * consider alternate semantics such as ES6 classes or stampit
 * (https://github.com/stampit-org/stampit) as an alternative to handling
 * private variables.
 *
 * @param {object?} props Instance methods and properties to add/override
 * @returns {object} The inherited object
 */
//////////////////////////////////////////////////////////////////////////////
geo.extend = function (props) {
  'use strict';
  var child = Object.create(this.prototype);
  $.extend(child.prototype, props || {});
  return child;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new file reader type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerFileReader = function (name, func) {
  'use strict';

  if (geo.fileReaders === undefined) {
    geo.fileReaders = {};
  }

  geo.fileReaders[name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new file reader
 */
//////////////////////////////////////////////////////////////////////////////
geo.createFileReader = function (name, opts) {
  'use strict';

  if (geo.fileReaders.hasOwnProperty(name)) {
    return geo.fileReaders[name](opts);
  }
  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new renderer type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerRenderer = function (name, func) {
  'use strict';

  if (geo.renderers === undefined) {
    geo.renderers = {};
  }

  geo.renderers[name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of the renderer
 */
//////////////////////////////////////////////////////////////////////////////
geo.createRenderer = function (name, layer, canvas, options) {
  'use strict';

  if (geo.renderers.hasOwnProperty(name)) {
    var ren = geo.renderers[name](
      {layer: layer, canvas: canvas, options: options}
    );
    ren._init();
    return ren;
  }
  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Check if the named renderer is supported.  If not, display a warning and get
 * the name of a fallback renderer.  Ideally, we would pass a list of desired
 * features, and, if the renderer is unavailable, this would choose a fallback
 * that would support those features.
 *
 * @params {string|null} name name of the desired renderer
 * @params {boolean} noFallack if true, don't recommend a fallback
 * @return {string|null|false} the name of the renderer that should be used
 *      of false if no valid renderer can be determined.
 */
//////////////////////////////////////////////////////////////////////////////
geo.checkRenderer = function (name, noFallback) {
  'use strict';
  if (name === null) {
    return name;
  }
  if (geo.renderers.hasOwnProperty(name)) {
    var ren = geo.renderers[name];
    if (!ren.supported || ren.supported()) {
      return name;
    }
    if (!ren.fallback || noFallback) {
      return false;
    }
    var fallback = geo.checkRenderer(ren.fallback(), true);
    if (fallback !== false) {
      console.warn(name + ' renderer is unavailable, using ' + fallback +
                   ' renderer instead');
    }
    return fallback;
  }
  return false;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new feature type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerFeature = function (category, name, func) {
  'use strict';

  if (geo.features === undefined) {
    geo.features = {};
  }

  if (!(category in geo.features)) {
    geo.features[category] = {};
  }

  // TODO Add warning if the name already exists
  geo.features[category][name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of the renderer
 */
//////////////////////////////////////////////////////////////////////////////
geo.createFeature  = function (name, layer, renderer, arg) {
  'use strict';

  var category = renderer.api(),
      options = {'layer': layer, 'renderer': renderer};
  if (category in geo.features && name in geo.features[category]) {
    if (arg !== undefined) {
      $.extend(true, options, arg);
    }
    var feature = geo.features[category][name](options);
    layer.gcs = function () {
      return layer.map().gcs();
    };
    return feature;
  }
  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a layer adjustment.
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerLayerAdjustment = function (category, name, func) {
  'use strict';

  if (geo.rendererLayerAdjustments === undefined) {
    geo.rendererLayerAdjustments = {};
  }

  if (!(category in geo.rendererLayerAdjustments)) {
    geo.rendererLayerAdjustments[category] = {};
  }

  // TODO Add warning if the name already exists
  geo.rendererLayerAdjustments[category][name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * If a layer needs to be adjusted based on the renderer, call the function
 * that adjusts it.
 *
 * @param {string} name Name of the layer.
 * @param {object} layer Instantiated layer object.
 */
//////////////////////////////////////////////////////////////////////////////
geo.adjustLayerForRenderer = function (name, layer) {
  'use strict';
  var rendererName = layer.rendererName();
  if (rendererName) {
    if (geo.rendererLayerAdjustments &&
        geo.rendererLayerAdjustments[rendererName] &&
        geo.rendererLayerAdjustments[rendererName][name]) {
      geo.rendererLayerAdjustments[rendererName][name].apply(layer);
    }
  }
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new layer type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerLayer = function (name, func) {
  'use strict';

  if (geo.layers === undefined) {
    geo.layers = {};
  }

  geo.layers[name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of the layer
 */
//////////////////////////////////////////////////////////////////////////////
geo.createLayer = function (name, map, arg) {
  'use strict';

  /// Default renderer is vgl
  var options = {'map': map, 'renderer': 'vgl'},
      layer = null;

  if (name in geo.layers) {
    if (arg !== undefined) {
      $.extend(true, options, arg);
    }
    layer = geo.layers[name](options);
    layer._init();
    return layer;
  } else {
    return null;
  }
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new widget type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerWidget = function (category, name, func) {
  'use strict';

  if (geo.widgets === undefined) {
    geo.widgets = {};
  }

  if (!(category in geo.widgets)) {
    geo.widgets[category] = {};
  }

  // TODO Add warning if the name already exists
  geo.widgets[category][name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of the widget
 */
//////////////////////////////////////////////////////////////////////////////
geo.createWidget  = function (name, layer, arg) {
  'use strict';

  var options = {
    layer: layer
  };

  if (name in geo.widgets.dom) {
    if (arg !== undefined) {
      $.extend(true, options, arg);
    }

    return geo.widgets.dom[name](options);
  }

  throw new Error('Cannot create unknown widget ' + name);
};

// Add a polyfill for window.requestAnimationFrame.
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function (func) {
    'use strict';

    window.setTimeout(func, 15);
  };
}

// Add a polyfill for Math.log2
if (!Math.log2) {
  Math.log2 = function () {
    'use strict';

    return Math.log.apply(Math, arguments) / Math.LN2;
  };
}

// Add a polyfill for Math.sinh
Math.sinh = Math.sinh || function (x) {
  'use strict';
  var y = Math.exp(x);
  return (y - 1 / y) / 2;
};
