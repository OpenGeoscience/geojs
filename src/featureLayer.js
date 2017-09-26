var inherit = require('./inherit');
var layer = require('./layer');
var geo_event = require('./event');
var registry = require('./registry');

/**
 * Layer to draw points, lines, and polygons on the map The polydata layer
 * provide mechanisms to create and draw geometrical shapes such as points,
 * lines, and polygons.
 * @class
 * @alias geo.featureLayer
 * @extends geo.layer
 * @param {object} arg Options for the new layer.
 * @returns {geo.featureLayer}
 */
var featureLayer = function (arg) {
  'use strict';
  if (!(this instanceof featureLayer)) {
    return new featureLayer(arg);
  }
  layer.call(this, arg);

  /**
   * private
   */
  var m_this = this,
      m_features = [],
      s_init = this._init,
      s_exit = this._exit,
      s_update = this._update,
      s_visible = this.visible,
      s_selectionAPI = this.selectionAPI,
      s_draw = this.draw;

  /**
   * Create a feature by name.
   *
   * @param {string} featureName The name of the feature to create.
   * @param {object} arg Properties for the new feature.
   * @returns {geo.feature} The created feature.
   */
  this.createFeature = function (featureName, arg) {

    var newFeature = registry.createFeature(
      featureName, m_this, m_this.renderer(), arg);
    if (newFeature) {
      this.addFeature(newFeature);
    }
    return newFeature;
  };

  /**
   * Add a feature to the layer if it is not already present.
   *
   * @param {object} feature the feature to add.
   * @returns {this}
   */
  this.addFeature = function (feature) {
    /* try to remove the feature first so that we don't have two copies */
    this.removeFeature(feature);
    m_this.addChild(feature);
    m_features.push(feature);
    m_this.dataTime().modified();
    m_this.modified();
    return m_this;
  };

  /**
   * Remove a feature without destroying it.
   *
   * @param {geo.feature} feature The feature to remove.
   * @returns {this}
   */
  this.removeFeature = function (feature) {
    var pos;

    pos = m_features.indexOf(feature);
    if (pos >= 0) {
      m_features.splice(pos, 1);
      m_this.removeChild(feature);
      m_this.dataTime().modified();
      m_this.modified();
    }

    return m_this;
  };

  /**
   * Delete feature.
   *
   * @param {geo.feature} feature The feature to delete.
   * @returns {this}
   */
  this.deleteFeature = function (feature) {

    // call _exit first, as destroying the feature affect other features
    if (feature) {
      if (m_features.indexOf(feature) >= 0) {
        feature._exit();
      }
      this.removeFeature(feature);
    }

    return m_this;
  };

  /**
   * Get/Set drawables.
   *
   * @param {geo.feature[]} val A list of features, or unspecified to return
   *    the current feature list.  If a list is provided, features are added or
   *    removed as needed.
   * @returns {geo.feature[]|this} The current features associated with the
   *    layer or the current layer.
   */
  this.features = function (val) {
    if (val === undefined) {
      return m_features.slice();
    } else {
      // delete existing features that aren't in the new array.  Since features
      // can affect other features during their exit process, make sure each
      // feature still exists as we work through the list.
      var existing = m_features.slice();
      var i;
      for (i = 0; i < existing.length; i += 1) {
        if (val.indexOf(existing[i]) < 0 && m_features.indexOf(existing[i]) >= 0) {
          this.deleteFeature(existing[i]);
        }
      }
      for (i = 0; i < val.length; i += 1) {
        this.addFeature(val[i]);
      }
      return m_this;
    }
  };

  /**
   * Initialize.
   *
   * @returns {this}
   */
  this._init = function () {
    if (m_this.initialized()) {
      return m_this;
    }

    // Call super class init
    s_init.call(m_this, true);

    // Bind events to handlers
    m_this.geoOn(geo_event.resize, function (event) {
      if (m_this.renderer()) {
        m_this.renderer()._resize(event.x, event.y, event.width, event.height);
        m_this._update({event: event});
        m_this.renderer()._render();
      } else {
        m_this._update({event: event});
      }
    });

    m_this.geoOn(geo_event.pan, function (event) {
      m_this._update({event: event});
      if (m_this.renderer()) {
        m_this.renderer()._render();
      }
    });

    m_this.geoOn(geo_event.rotate, function (event) {
      m_this._update({event: event});
      if (m_this.renderer()) {
        m_this.renderer()._render();
      }
    });

    m_this.geoOn(geo_event.zoom, function (event) {
      m_this._update({event: event});
      if (m_this.renderer()) {
        m_this.renderer()._render();
      }
    });

    return m_this;
  };

  /**
   * Update layer.
   *
   * @param {object} request A value to pass to the parent class.
   * @returns {this}
   */
  this._update = function (request) {
    var i;

    if (!m_features.length) {
      return m_this;
    }

    // Call base class update
    s_update.call(m_this, request);

    if (m_this.dataTime().getMTime() > m_this.updateTime().getMTime()) {
      for (i = 0; i < m_features.length; i += 1) {
        m_features[i].renderer(m_this.renderer());
      }
    }

    for (i = 0; i < m_features.length; i += 1) {
      m_features[i]._update();
    }

    m_this.updateTime().modified();

    return m_this;
  };

  /**
   * Free all resources.
   */
  this._exit = function () {
    m_this.clear();
    s_exit();
  };

  /**
   * Draw.  If the layer is visible, call the parent class's draw function and
   * the renderer's render function.
   *
   * @returns {this}
   */
  this.draw = function () {
    if (m_this.visible()) {
      // Call sceneObject.draw, which calls draw on all child objects.
      s_draw();

      // Now call render on the renderer. In certain cases it may not do
      // anything if the child objects are drawn on the screen already.
      if (m_this.renderer()) {
        m_this.renderer()._render();
      }
    }
    return m_this;
  };

  /**
   * Get/Set visibility of the layer.
   *
   * @param {boolean} [val] If specified, change the visibility, otherwise
   *    return it.
   * @returns {boolean|this} The current visibility or the layer.
   */
  this.visible = function (val) {
    if (val === undefined) {
      return s_visible();
    }
    if (m_this.visible() !== val) {
      s_visible(val);

      // take a copy of the features; changing visible could mutate them.
      var features = m_features.slice(), i;

      for (i = 0; i < features.length; i += 1) {
        features[i].visible(features[i].visible(undefined, true), true);
      }
      if (val) {
        m_this.draw();
      }
    }
    return m_this;
  };

  /**
   * Get/Set selectionAPI of the layer.
   *
   * @param {boolean} [val] If specified change the selectionAPI state of the
   *    layer, otherwise return the current state.
   * @returns {boolean|this} The selectionAPI state or the current layer.
   */
  this.selectionAPI = function (val) {
    if (val === undefined) {
      return s_selectionAPI();
    }
    if (m_this.selectionAPI() !== val) {
      s_selectionAPI(val);

      // take a copy of the features; changing selectionAPI could mutate them.
      var features = m_features.slice(), i;

      for (i = 0; i < features.length; i += 1) {
        features[i].selectionAPI(features[i].selectionAPI(undefined, true), true);
      }
    }
    return m_this;
  };

  /**
   * Clear all features in layer.
   *
   * @returns {this}
   */
  this.clear = function () {
    while (m_features.length) {
      m_this.deleteFeature(m_features[0]);
    }
    return m_this;
  };

  return m_this;
};

inherit(featureLayer, layer);
registry.registerLayer('feature', featureLayer);
module.exports = featureLayer;
