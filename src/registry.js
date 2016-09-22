var $ = require('jquery');
var widgets = {
  dom: {}
};
var layers = {};
var layerDefaultFeatures = {};
var renderers = {};
var features = {};
var featureCapabilities = {};
var fileReaders = {};
var rendererLayerAdjustments = {};
var annotations = {};
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
 * @params {boolean} noFallback if true, don't recommend a fallback
 * @return {string|null|false} the name of the renderer that should be used
 *      or false if no valid renderer can be determined.
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
 * Check if there is a renderer that is supported and supports a list of
 * features.  If not, display a warning.  This picks the first renderer that
 * supports all of the listed features.
 *
 * @param {array|undefined} featureList A list of features that will be used
 *      with this renderer.  Features are the basic feature names (e.g.,
 *      'quad'), or the feature name followed by a required capability (e.g.,
 *      'quad.image').  If more than one feature or more than one capability of
 *      a feature is required, include each feature and capability combination
 *      in the list (e.g., ['quad.image', 'plane']).  If no capability is
 *      specified for a feature (or that feature was registered without a
 *      capability object), then the feature will match regardless of
 *      capabilities.
 * @return {string|null|false} the name of the renderer that should be used
 *      or false if no valid renderer can be determined.
 */
//////////////////////////////////////////////////////////////////////////////
util.rendererForFeatures = function (featureList) {
  var preferredRenderers = ['vgl', 'canvas', 'd3', null];

  var renderer, ridx, feature, fidx, capability, available;
  for (ridx = 0; ridx < preferredRenderers.length; ridx += 1) {
    renderer = preferredRenderers[ridx];
    if (util.checkRenderer(renderer, true) === false) {
      continue;
    }
    if (!featureList) {
      return renderer;
    }
    if (!features[renderer]) {
      continue;
    }
    available = true;
    for (fidx = 0; fidx < featureList.length; fidx += 1) {
      feature = featureList[fidx];
      capability = null;
      if (feature.indexOf('.') >= 0) {
        capability = feature;
        feature = feature.substr(0, feature.indexOf('.'));
      }
      if (features[renderer][feature] === undefined) {
        available = false;
        break;
      }
      if (capability && featureCapabilities[renderer][feature] &&
          !featureCapabilities[renderer][feature][capability]) {
        available = false;
        break;
      }
    }
    if (available) {
      return renderer;
    }
  }
  console.warn('There is no renderer available for the feature list "' +
               (featureList || []).join(', ') + '".');
  return false;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new feature type
 *
 * @param {string} category The feature category -- this is the renderer name.
 * @param {string} name The feature name
 * @param {function} func A function to call to create the feature.
 * @param {object|undefined} capabilities A map of capabilities that this
 *      feature supports.  If the feature is implemented with different
 *      capabilities in multiple categories (renderers), then the feature
 *      should expose a simple dictionary of supported and unsupported
 *      features.  For instance, the quad feature has color quads, image quads,
 *      and image quads that support full transformations.  The capabailities
 *      should be defined in the base feature in a capabilities object so that
 *      they can be referenced by that rather than an explicit string.
 * @returns {object} if this feature replaces an existing one, this was the
 *      feature that was replaced.  In this case, a warning is issued.
 */
//////////////////////////////////////////////////////////////////////////////
util.registerFeature = function (category, name, func, capabilities) {
  if (!(category in features)) {
    features[category] = {};
    featureCapabilities[category] = {};
  }

  var old = features[category][name];
  if (old) {
    console.warn('The ' + category + '.' + name + ' feature is already registered');
  }
  features[category][name] = func;
  featureCapabilities[category][name] = capabilities;
  return old;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of a feature
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
    if (layer.gcs === undefined) {
      layer.gcs = function () {
        return layer.map().gcs();
      };
    }
    return feature;
  }
  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a layer adjustment.
 *
 * @returns {object} if this layer adjustment replaces an existing one, this
 *      was the value that was replaced.  In this case, a warning is issued.
 */
//////////////////////////////////////////////////////////////////////////////
util.registerLayerAdjustment = function (category, name, func) {
  if (!(category in rendererLayerAdjustments)) {
    rendererLayerAdjustments[category] = {};
  }

  var old = rendererLayerAdjustments[category][name];
  if (old) {
    console.warn('The ' + category + '.' + name + ' layer adjustment is already registered');
  }
  rendererLayerAdjustments[category][name] = func;
  return old;
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
util.registerLayer = function (name, func, defaultFeatures) {
  layers[name] = func;
  layerDefaultFeatures[name] = defaultFeatures;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of the layer
 */
//////////////////////////////////////////////////////////////////////////////
util.createLayer = function (name, map, arg) {
  /// Default renderer is vgl
  var options = {map: map},
      layer = null;

  if (name in layers) {
    if (!arg.renderer && !arg.features && layerDefaultFeatures) {
      options.features = layerDefaultFeatures[name];
    }
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
 *
 * @returns {object} if this widget replaces an existing one, this was the
 *      value that was replaced.  In this case, a warning is issued.
 */
//////////////////////////////////////////////////////////////////////////////
util.registerWidget = function (category, name, func) {
  if (!(category in widgets)) {
    widgets[category] = {};
  }

  var old = widgets[category][name];
  if (old) {
    console.warn('The ' + category + '.' + name + ' widget is already registered');
  }
  widgets[category][name] = func;
  return old;
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

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new annotation type
 *
 * @param {string} name The annotation name
 * @param {function} func A function to call to create the annotation.
 * @param {object|undefined} features A map of features that are used by this
 *      annotation.  Each key is a feature that is used.  If the value is true,
 *      the that feature is always needed.  If a list, then it is the set of
 *      annotation states for which that feature is required.  These can be
 *      used to pick an pparopriate renderer when creating an annotation layer.
 * @returns {object} if this annotation replaces an existing one, this was the
 *      value that was replaced.  In this case, a warning is issued.
 */
//////////////////////////////////////////////////////////////////////////////
util.registerAnnotation = function (name, func, features) {
  var old = annotations[name];
  if (old) {
    console.warn('The ' + name + ' annotation is already registered');
  }
  annotations[name] = {func: func, features: features || {}};
  return old;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Get a list of registered annotation types.
 *
 * @return {array} a list of registered annotations.
 */
//////////////////////////////////////////////////////////////////////////////
util.listAnnotations = function () {
  return Object.keys(annotations);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Get a list of required features for a set of annotations.
 *
 * @param {array|object|undefined} annotationList A list of annotations that
 *   will be used.  Instead of a list, if this is an object, the keys are the
 *   annotation names, and the values are each a list of modes that will be
 *   used with that annotation.  For example, ['polygon', 'rectangle'] lists
 *   features required to show those annotations in any mode,  whereas
 *   {polygon: [annotationState.done], rectangle: [annotationState.done]} only
 *   lists features thatre are needed to show the completed annotations.
 * @return {array} a list of features needed for the specified annotations.
 *   There may be duplicates in the list.
 */
//////////////////////////////////////////////////////////////////////////////
util.featuresForAnnotations = function (annotationList) {
  var features = [];

  var annList = Array.isArray(annotationList) ? annotationList : Object.keys(annotationList);
  annList.forEach(function (ann) {
    if (!annotations[ann]) {
      return;
    }
    Object.keys(annotations[ann].features).forEach(function (feature) {
      if (Array.isArray(annotationList) || annotationList[ann] === true ||
          !Array.isArray(annotations[ann].features[feature])) {
        features.push(feature);
      } else {
        annotationList[ann].forEach(function (state) {
          if ($.inArray(state, annotations[ann].features[feature]) >= 0) {
            features.push(feature);
          }
        });
      }
    });
  });
  return features;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Check if there is a renderer that is supported and supports a list of
 * annotations.  If not, display a warning.  This generates a list of required
 * features, then picks the first renderer that supports all of thse features.
 *
 * @param {array|object|undefined} annotationList A list of annotations that
 *   will be used with this renderer.  Instead of a list, if this is an object,
 *   the keys are the annotation names, and the values are each a list of modes
 *   that will be used with that annotation.  See featuresForAnnotations for
 *   more details.
 * @return {string|null|false} the name of the renderer that should be used or
 *   false if no valid renderer can be determined.
 */
//////////////////////////////////////////////////////////////////////////////
util.rendererForAnnotations = function (annotationList) {
  return util.rendererForFeatures(util.featuresForAnnotations(annotationList));
};

module.exports = util;
