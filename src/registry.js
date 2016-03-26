var $ = require('jquery');
var widgets = {
  dom: {}
};
var layers = {};
var renderers = {};
var features = {};
var fileReaders = {};
var rendererLayerAdjustments = {};
var util = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new file reader type
 */
//////////////////////////////////////////////////////////////////////////////
util.registerFileReader = function (name, func) {
  fileReaders[name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new file reader
 */
//////////////////////////////////////////////////////////////////////////////
util.createFileReader = function (name, opts) {
  if (fileReaders.hasOwnProperty(name)) {
    return fileReaders[name](opts);
  }
  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new renderer type
 */
//////////////////////////////////////////////////////////////////////////////
util.registerRenderer = function (name, func) {
  renderers[name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of the renderer
 */
//////////////////////////////////////////////////////////////////////////////
util.createRenderer = function (name, layer, canvas, options) {
  if (renderers.hasOwnProperty(name)) {
    var ren = renderers[name](
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
util.checkRenderer = function (name, noFallback) {
  if (name === null) {
    return name;
  }
  if (renderers.hasOwnProperty(name)) {
    var ren = renderers[name];
    if (!ren.supported || ren.supported()) {
      return name;
    }
    if (!ren.fallback || noFallback) {
      return false;
    }
    var fallback = util.checkRenderer(ren.fallback(), true);
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
util.registerFeature = function (category, name, func) {
  if (features === undefined) {
    features = {};
  }

  if (!(category in features)) {
    features[category] = {};
  }

  // TODO Add warning if the name already exists
  features[category][name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of the renderer
 */
//////////////////////////////////////////////////////////////////////////////
util.createFeature = function (name, layer, renderer, arg) {
  var category = renderer.api(),
      options = {'layer': layer, 'renderer': renderer};
  if (category in features && name in features[category]) {
    if (arg !== undefined) {
      $.extend(true, options, arg);
    }
    var feature = features[category][name](options);
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
util.registerLayerAdjustment = function (category, name, func) {
  if (rendererLayerAdjustments === undefined) {
    rendererLayerAdjustments = {};
  }

  if (!(category in rendererLayerAdjustments)) {
    rendererLayerAdjustments[category] = {};
  }

  // TODO Add warning if the name already exists
  rendererLayerAdjustments[category][name] = func;
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
util.adjustLayerForRenderer = function (name, layer) {
  var rendererName = layer.rendererName();
  if (rendererName) {
    if (rendererLayerAdjustments &&
        rendererLayerAdjustments[rendererName] &&
        rendererLayerAdjustments[rendererName][name]) {
      rendererLayerAdjustments[rendererName][name].apply(layer);
    }
  }
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new layer type
 */
//////////////////////////////////////////////////////////////////////////////
util.registerLayer = function (name, func) {
  layers[name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of the layer
 */
//////////////////////////////////////////////////////////////////////////////
util.createLayer = function (name, map, arg) {
  /// Default renderer is vgl
  var options = {'map': map, 'renderer': 'vgl'},
      layer = null;

  if (name in layers) {
    if (arg !== undefined) {
      $.extend(true, options, arg);
    }
    layer = layers[name](options);
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
util.registerWidget = function (category, name, func) {
  if (!(category in widgets)) {
    widgets[category] = {};
  }

  // TODO Add warning if the name already exists
  widgets[category][name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of the widget
 */
//////////////////////////////////////////////////////////////////////////////
util.createWidget = function (name, layer, arg) {
  var options = {
    layer: layer
  };

  if (name in widgets.dom) {
    if (arg !== undefined) {
      $.extend(true, options, arg);
    }

    return widgets.dom[name](options);
  }

  throw new Error('Cannot create unknown widget ' + name);
};

module.exports = util;
