//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */
//////////////////////////////////////////////////////////////////////////////

/*jslint devel: true, forin: true, newcap: true, plusplus: true,
   white: true, indent: 2*/
/*global geoModule, ogs, inherit, $*/

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class layerFeatures
 *
 * @class
 * @returns {geoModule.layerFeatures}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.layerFeatures = function() {
  "use strict";
  if (!(this instanceof geoModule.layerFeatures)) {
    return new geoModule.layerFeatures();
  }
  ogs.vgl.object.call(this);

  var m_layerFeaturesMap = {};
  var m_layerExpiredFeaturesMap = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get features that belong to a layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.features = function(layerId) {
    if (m_layerFeaturesMap.hasOwnProperty(layerId)) {
      return m_layerFeaturesMap[layerId];
    }

    m_layerFeaturesMap[layerId] = null;
    return m_layerFeaturesMap[layerId];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set new features of a layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setFeatures = function(layerId, features) {
    // TODO Check if drawables are changed for now just set it
    m_layerFeaturesMap[layerId] = features;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get expired features of a layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.expiredFeatures = function(layerId) {
    if (m_layerExpiredFeaturesMap.hasOwnProperty(layerId)) {
      return m_layerExpiredFeaturesMap[layerId];
    }

    m_layerExpiredFeaturesMap[layerId] = null;
    return m_layerExpiredFeaturesMap[layerId];
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set expired features of a layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setExpiredFeatures = function(layerId, expiredFeatures) {
    // TODO Check if drawables are changed for now just set it
    m_layerExpiredFeaturesMap[layerId] = expiredFeatures;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clone data from one drawable to another
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clone = function(other) {
    if (!other) {
      return;
    }

    var layerId = null;

    for (layerId in m_layerFeaturesMap) {
      if (m_layerFeaturesMap.hasOwnProperty(layerId)) {
        other.setFeatures(layerId, m_layerFeaturesMap[layerId]);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return if empty
   */
  ////////////////////////////////////////////////////////////////////////////
  this.isEmpty = function() {
    // ECMAScript 5 supports the syntax below
    return Object.keys(m_layerFeaturesMap).length === 0;
  };
};

inherit(geoModule.layerFeatures, ogs.vgl.object);