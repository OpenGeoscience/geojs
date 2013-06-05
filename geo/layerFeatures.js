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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get drawbles that belong to a layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.features = function(layerName) {
    if (m_layerFeaturesMap.hasOwnProperty(layerName)) {
      return m_layerFeaturesMap[layerName];
    }

    m_layerFeaturesMap[layerName] = null;
    return m_layerFeaturesMap[layerName];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer to a particular time
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setFeatures = function(layerName, features) {
    // TODO Check if drawables are changed for now just set it
    m_layerFeaturesMap[layerName] = features;
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

    var layerName = null;

    for (layerName in m_layerFeaturesMap) {
      if (m_layerFeaturesMap.hasOwnProperty(layerName)) {
        other.setFeatures(layerName, m_layerFeaturesMap[layerName]);
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