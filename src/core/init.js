/** @namespace */
var geo = {};     // jshint ignore: line
window.geo = geo; // jshint ignore: line

geo.renderers = {};
geo.features = {};
geo.fileReaders = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convenient function to define JS inheritance
 */
//////////////////////////////////////////////////////////////////////////////
geo.inherit = function (C, P) { // jshint ignore: line
  "use strict";

  var F = inherit.func();
  F.prototype = P.prototype;
  C.prototype = new F();
  C.prototype.constructor = C;
};
geo.inherit.func = function () {
  "use strict";
  return function () {};
};

// Should get rid of this at some point.
window.inherit = geo.inherit;

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new file reader type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerFileReader = function (name, func) {
  "use strict";

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
  "use strict";

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
  "use strict";

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
geo.createRenderer  = function (name, layer, canvas) {
  "use strict";

  if (geo.renderers.hasOwnProperty(name)) {
    var ren = geo.renderers[name](
      {"layer": layer, "canvas": canvas}
    );
    ren._init();
    return ren;
  }
  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new feature type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerFeature = function (category, name, func) {
  "use strict";

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
  "use strict";

  var category = renderer.api(),
      options = {"layer": layer, "renderer": renderer};
  if (category in geo.features && name in geo.features[category]) {
    if (arg !== undefined) {
      $.extend(true, options, arg);
    }
    return geo.features[category][name](options);
  }
  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new layer type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerLayer = function (name, func) {
  "use strict";

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
  "use strict";

  /// Default renderer is vgl
  var options = {"map": map, "renderer": "vgl"},
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
  "use strict";

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
geo.createWidget  = function (name, layer, renderer, arg) {
  "use strict";

  var category = renderer.api(),
      options = {"layer": layer, "renderer": renderer};
  if (category in geo.widgets && name in geo.widgets[category]) {
    if (arg !== undefined) {
      $.extend(true, options, arg);
    }
    return geo.widgets[category][name](options);
  }
  return null;
};

// Add a polyfill for window.requestAnimationFrame.
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function (func) {
    "use strict";

    window.setTimeout(func, 15);
  };
}

// Add a polyfill for Math.log2
if (!Math.log2) {
  Math.log2 = function () {
    "use strict";

    return Math.log.apply(Math, arguments) / Math.LN2;
  };
}
