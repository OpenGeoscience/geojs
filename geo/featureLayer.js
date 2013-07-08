//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class featureLayer
 *
 * @class
 * @dec Layer to draw points, lines, and polygons on the map The polydata layer
 *      provide mechanisms to create and draw geometrical shapes such as points,
 *      lines, and polygons.
 * @returns {geoModule.featureLayer}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.featureLayer = function(options, feature) {
  "use strict";
  if (!(this instanceof geoModule.featureLayer)) {
    return new geoModule.featureLayer(options, feature);
  }
  geoModule.layer.call(this, options);

  /** @private */
  var m_that = this,
      m_features = [],
      m_newFeatures = [],
      m_expiredFeatures = [],
      m_predrawTime = ogs.vgl.timestamp(),
      m_updateTime = ogs.vgl.timestamp();

  if (feature) {
    m_newFeatures.push(feature);
    m_features.push(feature);
  }
  m_predrawTime.modified();
  m_updateTime.modified();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the underlying drawable entity.
   * @returns {geoModule.feature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.features = function() {
    return m_features;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set feature.
   *
   * @param {Array} Array of feature
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setFeatures = function(features) {
    if (features.length > 0) {
      m_newFeatures = features.slice(0);
      m_features = features.slice(0);
      this.modified();
      m_updateTime. modified();
      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer to a particular time
   */
  ////////////////////////////////////////////////////////////////////////////
  this.update = function(request) {
    if (!this.dataSource()) {
      console.log('[info] No valid data source found.');
      return;
    }

    var i = 0,
        time = request.time(),
        data = null,
        geomFeature = null;

    if (!time) {
      return;
    }

    data = this.dataSource().getData(time);

    // Clear our existing features
    m_expiredFeatures = m_newFeatures.slice(0);
    m_newFeatures = [];

    for(i = 0; i < data.length; ++i) {
      switch(data[i].type()) {
        case ogs.vgl.data.geometry:
          geomFeature = geoModule.geometryFeature(data[i]);
          geomFeature.material().setBinNumber(this.binNumber());
          m_newFeatures.push(geomFeature);
          break;
        case ogs.vgl.data.raster:
          break;
        default:
          console.log('[warning] Data type not handled', data.type());
      }
    }

    m_features = m_newFeatures.slice(0);

    if (data.length > 0) {
      m_updateTime. modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Prepare layer for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.predraw = function(request) {
    if (m_predrawTime.getMTime() > m_updateTime.getMTime()) {
      return;
    }

    var featureCollection = request.featureCollection();
    featureCollection.setNewFeatures(this.name(), m_newFeatures);
    featureCollection.setExpiredFeatures(this.name(), m_expiredFeatures);

    m_predrawTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update opacity for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateLayerOpacity = function(opacity) {
    if (!m_features) {
      return;
    }

    var  i = 0,
         mat,
         opacityUniform;

    for (i = 0; i < m_features.length; ++i) {
      mat = m_features[i].material();
      opacityUniform = mat.shaderProgram().uniform('opacity');
      if (opacityUniform !== null) {
        opacityUniform.set(opacity);
        $(m_that).trigger(geoModule.command.updateLayerOpacityEvent);
      }
    }
  };

  this.setOpacity(this.opacity());
  return this;
};

inherit(geoModule.featureLayer, geoModule.layer);