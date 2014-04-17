//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class featureCollection
 *
 * @class
 * @returns {geo.featureCollection}
 */
//////////////////////////////////////////////////////////////////////////////
geo.featureCollection = function() {
  "use strict";
  if (!(this instanceof geo.featureCollection)) {
    return new geo.featureCollection();
  }
  vgl.object.call(this);

  var m_newFeaturesMap = {},
      m_expiredFeaturesMap = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get features that belong to a layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.newFeatures = function(layerId) {
    if (m_newFeaturesMap.hasOwnProperty(layerId)) {
      return m_newFeaturesMap[layerId];
    }

    m_newFeaturesMap[layerId] = [];
    return m_newFeaturesMap[layerId];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set new features of a layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setNewFeatures = function(layerId, features) {
    // TODO Check if drawables are changed for now just set it
    m_newFeaturesMap[layerId] = features;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get expired features of a layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.expiredFeatures = function(layerId) {
    if (m_expiredFeaturesMap.hasOwnProperty(layerId)) {
      return m_expiredFeaturesMap[layerId];
    }

    m_expiredFeaturesMap[layerId] = [];
    return m_expiredFeaturesMap[layerId];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set expired features of a layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setExpiredFeatures = function(layerId, expiredFeatures) {
    // TODO Check if drawables are changed for now just set it
    m_expiredFeaturesMap[layerId] = expiredFeatures;
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

    for (layerId in m_newFeaturesMap) {
      if (m_newFeaturesMap.hasOwnProperty(layerId)) {
        other.setFeatures(layerId, m_newFeaturesMap[layerId]);
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
    return (Object.keys(m_newFeaturesMap).length === 0 &&
            Object.keys(m_expiredFeaturesMap).length === 0) ;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset all states of feature collection
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resetAll = function() {
    m_newFeaturesMap = {};
    m_expiredFeaturesMap = {};
  };
};

inherit(geo.featureCollection, vgl.object);
