/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true, white: true, indent: 2*/
/*global geoModule, ogs, inherit, $, Image, vglModule, document*/

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
      m_newFeatures = [],
      m_expiredFeatures = [],
      m_prepareRenderTime = ogs.vgl.timestamp(),
      m_updateFeaturesTime = ogs.vgl.timestamp();

  if (feature) {
    m_newFeatures.push(feature);
  }
  m_prepareRenderTime.modified();
  m_updateFeaturesTime.modified()

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer to a particular time
   */
  ////////////////////////////////////////////////////////////////////////////
  this.update = function(time) {
    if (!this.dataSource()) {
      console.log('[info] No valid data source found.');
      return;
    }

    var i = 0,
        data = this.dataSource().getData(time);

    // Clear our existing features
    m_expiredFeatures = m_newFeatures.slice(0);
    m_newFeatures = [];

    for(i = 0; i < data.length; ++i) {
      switch(data[i].type()) {
        case vglModule.data.geometry:
          var geomFeature = geoModule.geometryFeature(data[i]);
          m_newFeatures.push(geomFeature);
          break;
        case vglModule.data.raster:
          break;
        default:
          console.log('[warning] Data type not handled', data.type());
      }
    }

    if (data.length > 0) {
      m_updateFeaturesTime. modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Prepare layer for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.prepareForRendering = function(layersDrawables) {
    if (m_prepareRenderTime.getMTime() > m_updateFeaturesTime.getMTime()) {
      return;
    }

    layersDrawables.setNewFeatures(this.name(), m_newFeatures);
    layersDrawables.setExpiredFeatures(this.name(), m_expiredFeatures);

    m_prepareRenderTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update opacity for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateLayerOpacity = function(opacity) {
    if (!m_newFeatures) {
      return;
    }

    var  i = 0,
         mat,
         opacityUniform;

    for (i = 0; i < m_newFeatures.length; ++i) {
      mat = m_newFeatures[i].material();
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