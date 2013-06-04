geoModule.layerDrawables = function() {
  "use strict";
  if (!(this instanceof geoModule.layerDrawables)) {
    return new geoModule.layerDrawables();
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
};

inherit(geoModule.layerDrawables, ogs.vgl.object);