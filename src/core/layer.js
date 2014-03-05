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
 * Layer options object specification
 *
 * @class geo.layerOptions
 */
//////////////////////////////////////////////////////////////////////////////
geo.layerOptions = function() {
  "use strict";

  if (!(this instanceof geo.layerOptions)) {
    return new geo.layerOptions();
  }

  this.opacity = 0.5;
  this.showAttribution = true;
  this.visible = true;

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all layer types geo.layer represents any object that be
 * rendered on top of the map base. This could include image, points, line, and
 * polygons.
 *
 * @class geo.layer
 * @returns {geo.layer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.layer = function(options, source) {
  "use strict";
  this.events = {
    "opacitychange" : "opacitychange"
  };

  if (!(this instanceof geo.layer)) {
    return new geo.layer(options, source);
  }
  geo.object.call(this);

  if (!options) {
    options = geo.layerOptions();
  }

  /** @private */
  var m_that = this,
      m_id = "",
      m_name = "",
      m_opacity = options.opacity || 0.5,
      m_gcs = 'EPSG:4326',
      m_showAttribution = true,
      m_visible = true,
      m_defaultLookupTable = vgl.lookupTable(),
      m_lookupTables = {},
      m_legendOrigin = [20, 60, 0.0],
      m_legendWidth = 400,
      m_legendHeight = 20,
      m_dataSource = source,
      m_container = null,
      m_referenceLayer = false;

  if (options.showAttribution) {
    m_showAttribution = options.showAttribution;
  }

  if (options.m_visible) {
    m_visible = options.m_visible;
  }

  // TODO Write a function for this
  if (m_opacity > 1.0) {
    m_opacity = 1.0;
    console.log("[warning] Opacity cannot be greater than 1.0");
  } else if (m_opacity < 0.0) {
    console.log("[warning] Opacity cannot be less than 1.0");
    m_opacity = 0.0;
  }


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the underlying drawable entity.
   * @returns {geo.feature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.features = function() {
    return null;
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
    // Concrete class should implement this
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get id of the layer
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.id = function() {
    return m_id;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set id of the layer
   *
   * @param {String} name
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setId = function(id) {
    if (m_id !== id) {
      m_id = id;
      this.modified();
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get name of the layer
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.name = function() {
    return m_name;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set name of the layer
   *
   * @param {String} name
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setName = function(name) {
    if (m_name !== name) {
      m_name = name;
      m_id = name;
      this.modified();
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Query opacity of the layer (range[0.0, 1.0])
   */
  ////////////////////////////////////////////////////////////////////////////
  this.opacity = function() {
    return m_opacity;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set opacity of the layer in the range of [0.0, 1.0]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setOpacity = function(val) {
    m_opacity = val;
    this.updateLayerOpacity(m_opacity);
    this.modified();
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get current time of the layer.
   *
   * This should be implemented by the derived class
   */
  ////////////////////////////////////////////////////////////////////////////
  this.time = function() {
    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get GCS of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcs = function() {
    return m_gcs;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set source of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setGcs = function(gcs) {
    if (m_gcs !== gcs) {
      m_gcs = gcs;
      this.modified();
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get if layer is visible. This should be implemented by the derived class
   *
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.visible = function() {
    // return m_feature.visible();
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set layer visible true or false. This should be implemented by the
   * the derived class.
   *
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setVisible = function(flag) {
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get lookup table of the layer
   * @param {string} varname Name of the variable. If null or empty will
   *  return default lookup table
   */
    ////////////////////////////////////////////////////////////////////////////
  this.lookupTable = function(varname) {
    if (varname && m_lookupTables.hasOwnProperty(varname)) {
      return m_lookupTables[varname];
    }

    return m_defaultLookupTable;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set lookup table for this layer for a particular variable if provided.
   * @param {string} varname Name of the variable for which to set the
   *  lookup table
   */
    ////////////////////////////////////////////////////////////////////////////
  this.setLookupTable = function(varname, lut) {
    if (!lut) {
      console.log('[warning] Invalid lookup table');
      return false;
    }

    if (varname) {
      if (m_lookupTables.hasOwnProperty(varname) &&
          m_lookupTables[varname] === lut) {
        return false;
      }
      m_lookupTables[varname] = lut;
      this.updateColorMapping(varname);
      this.modified();
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get source of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.dataSource = function() {
    return m_dataSource;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set source of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setDataSource = function(source) {
    if (m_dataSource !== source) {
      m_dataSource = source;
      this.modified();
      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get origin (bottom left corner) of the legend
   */
  ////////////////////////////////////////////////////////////////////////////
  this.legendOrigin = function() {
    return m_legendOrigin;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set origin (bottom left corner) of the legend
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setLegendOrigin = function(origin) {
    m_legendOrigin = origin.splice(0);
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get width of the legend
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.legendWidth = function() {
    return m_legendWidth;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set width of the legend
   *
   * @param width
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setLegendWidth = function(width) {
    if (width !== m_legendWidth) {
      m_legendWidth = width;
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get height of the legend
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.legendHeight = function() {
    return m_legendHeight;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set height of the legend
   *
   * @param height
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setLegendHeight = function(height) {
    if (height !== m_legendHeight) {
      m_legendHeight = height;
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function that inform if the layer has a legend
   */
  ////////////////////////////////////////////////////////////////////////////
  this.hasLegend = function() {
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to turn on legend
   */
  ////////////////////////////////////////////////////////////////////////////
  this.showLegend = function() {
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to turn on legend
   */
  ////////////////////////////////////////////////////////////////////////////
  this.hideLegend = function() {
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to create legend for the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createLegend = function() {
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to delete legend of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.deleteLegend = function() {
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to update legend of the layer.
   *
   * This should be called manually if the caller modifies the legend's
   * properties.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateLegend = function(deletePrevious) {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to notify deletion of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.destroy = function() {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to update the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.update = function(request) {
    // Concrete class should implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Prepare layer for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.predraw = function(request) {
    // Concrete class should implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Perform actions after draw has happened
   */
  ////////////////////////////////////////////////////////////////////////////
  this.postdraw = function(request) {
    // Concrete class should implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the modified time for the last update that did something
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getUpdateTime = function() {
    // Concrete class should implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual method to return information about a given point.
   *
   * Concrete class should implement this method.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.queryLocation = function(location) {
    // Concrete class should implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual method to handle opacity change.
   * Concrete class should implement this method.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateLayerOpacity = function() {
    // Concrete class should implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /*
   * Virtual method to update color mapping for the layer.
   * Concrete class should implement this method.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateColorMapping = function() {
    // Concrete class should implement this
  };

  this.container = function(container) {

    if(typeof container !== 'undefined') {
      m_container = container;
      return m_that;
    }
    return m_container;
  };

  this.referenceLayer = function(referenceLayer) {

    if(typeof referenceLayer !== 'undefined') {
      m_referenceLayer = referenceLayer;
      return m_that;
    }
    return m_referenceLayer;
  };

  this.worldToGcs = function(x, y) {
    throw "Should be implemented by derivied classes";
  };

  return this;
};

inherit(geo.layer, geo.object);
