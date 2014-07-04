//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class featureLayer
 *
 * @class
 * @dec Layer to draw points, lines, and polygons on the map The polydata layer
 *      provide mechanisms to create and draw geometrical shapes such as points,
 *      lines, and polygons.
 * @returns {geo.featureLayer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.featureLayer = function (arg) {
  "use strict";
  if (!(this instanceof geo.featureLayer)) {
    return new geo.featureLayer(arg);
  }
  geo.layer.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_features = null,
      s_init = this._init,
      s_update = this._update;


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create feature give a name
   *
   * @returns {geo.Feature} Will return a new feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createFeature = function (featureName, arg) {

    var newFeature = geo.createFeature(
      featureName, m_this, m_this.renderer(), arg);

    /// Initialize feature list
    if (!m_features) {
      m_features = [];
    }

    m_this.addChild(newFeature);
    m_features.push(newFeature);
    m_this.features(m_features);
    m_this.modified();
    return newFeature;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete feature
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.deleteFeature = function (feature) {
    return m_this._delete(feature);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set drawables
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.features = function (val) {
    return m_this._features(val);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set drawables
   */
  ////////////////////////////////////////////////////////////////////////////
  this._features = function (val) {
    if (val === undefined) {
      return m_features || [];
    } else {
      m_features = val.slice(0);
      m_this.dataTime().modified();
      m_this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._delete = function (feature) {
    var i;

    for (i = 0; i < m_features.length; i += 1) {
      if (m_features[i] === feature) {
        m_features[i]._exit();
        m_this.dataTime().modified();
        m_this.modified();
        return m_features.splice(i, 1);
      }
    }
    m_this.removeChild(feature);

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   *
   * Do not call parent _init method as its already been executed
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    if (m_this.initialized()) {
      return m_this;
    }

    /// Call super class init
    s_init.call(m_this);

    /// Bind events to handlers
    m_this.on(geo.event.resize, function (event) {
      m_this.renderer()._resize(event.x, event.y, event.width, event.height);
      m_this._update({});
      m_this.renderer()._render();
    });

    m_this.on(geo.event.pan, function (event) {
      m_this._update({event: event});
      m_this.renderer()._render();
    });

    m_this.on(geo.event.zoom, function (event) {
      if (m_this.map()) {
        m_this.map().zoom(event.curr_zoom);
      }
      m_this._update({event: event});
      m_this.renderer()._render();
    });

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function (request) {
    var i, reset = false;

    if (!m_features) {
      return m_this;
    }

    /// Call base class update
    s_update.call(m_this, request);

    if (!m_this.source() && m_features && m_features.length === 0) {
      console.log("[info] No valid data source found.");
      return;
    }

    if (m_this.dataTime().getMTime() > m_this.updateTime().getMTime()) {
      for (i = 0; i < m_features.length; i += 1) {
        m_features[i].renderer(m_this.renderer());
      }
      reset = true;
    }

    for (i = 0; i < m_features.length; i += 1) {
      m_features[i]._update();
    }

    m_this.updateTime().modified();

    if (reset) {
      m_this.renderer().reset();
    }

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Draw
   */
  ////////////////////////////////////////////////////////////////////////////
  this._draw = function () {
    m_this.renderer()._render();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear all features in layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clear = function () {
    var i;

    if (!m_features)
      return m_this;

    for (i = 0; i < m_features.length; i += 1) {
      m_features[i]._exit();
    }

    m_this.dataTime().modified();
    m_this.modified();
    m_features = [];

    return m_this;
  };

  return m_this;
};

inherit(geo.featureLayer, geo.layer);

// Now register it
geo.registerLayer("feature", geo.featureLayer);
