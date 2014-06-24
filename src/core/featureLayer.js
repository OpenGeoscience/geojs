//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true, */
/*jslint white: true, indent: 2, continue:true*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document, gl, vec3*/
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
geo.featureLayer = function(arg) {
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
  this.createFeature = function(featureName, arg) {

    var newFeature = geo.createFeature(
      featureName, m_this, this.renderer(), arg);

    /// Initialize feature list
    if (!m_features) {
      m_features = [];
    }

    m_features.push(newFeature);
    this.features(m_features);
    this.modified();
    return newFeature;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete feature
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.deleteFeature = function() {
    // TODO:
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set drawables
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.features = function(val) {
    return this._features(val);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set drawables
   */
  ////////////////////////////////////////////////////////////////////////////
  this._features = function(val) {
    var i = 0;
    if (val === undefined) {
      return m_features || [];
    } else {
      m_features = val.slice(0);
      this.dataTime().modified();
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._delete = function(feature) {
    var i;

    for(i = 0; i < m_features.length; ++i) {
      if (m_features[i] === feature) {
        m_features[i]._exit();
        this.dataTime().modified();
        this.modified();
        return m_features.splice(i, 1);
      }
    }

    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   *
   * Do not call parent _init method as its already been executed
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function() {
    if (this.initialized()) {
      return this;
    }

    /// Call super class init
    s_init.call(this);

    /// Bind events to handlers
    this.on(geo.event.resize, function(event) {
      m_this.renderer()._resize(event.x, event.y, event.width, event.height);
      m_this._update({});
      m_this.renderer()._render();
    });

    this.on(geo.event.pan, function(event) {
      m_this._update({event: event});
      m_this.renderer()._render();
    });

    this.on(geo.event.zoom, function(event) {
      if (m_this.map()) {
        m_this.map().zoom(event.curr_zoom);
      }
      m_this._update({event: event});
      m_this.renderer()._render();
    });

    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function(request) {
    var i, reset = false;

    if (!m_features) {
      return this;
    }

    /// Call base class update
    s_update.call(this, request);

    if (!this.source() && m_features && m_features.length === 0) {
      console.log('[info] No valid data source found.');
      return;
    }

    if (this.dataTime().getMTime() > this.updateTime().getMTime()) {
      for (i = 0; i < m_features.length; ++i) {
          m_features[i].renderer(this.renderer());
      }
      reset = true;
    }

    for (i = 0; i < m_features.length; ++i) {
      m_features[i]._update();
    }

    this.updateTime().modified();

    if (reset) {
      m_this.renderer().reset();
    }

    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Draw
   */
  ////////////////////////////////////////////////////////////////////////////
  this._draw = function() {
    this.renderer()._render();
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear all features in layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clear = function() {
    var i;

    if (!m_features)
      return this;

    for(i = 0; i < m_features.length; ++i) {
      m_features[i]._exit();
    }

    this.dataTime().modified();
    this.modified();
    m_features = [];

    return this;
  };

  return this;
};

inherit(geo.featureLayer, geo.layer);

// Now register it
geo.registerLayer('feature', geo.featureLayer);