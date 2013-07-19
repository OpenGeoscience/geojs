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
 * Layer options object specification
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.layerOptions = function() {
  "use strict";

  if (!(this instanceof geoModule.layerOptions)) {
    return new geoModule.layerOptions();
  }

  this.opacity = 1;
  this.showAttribution = true;
  this.visible = true;
  this.binNumber = ogs.vgl.material.RenderBin.Default;

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all layer types ogs.geo.layer represents any object that be
 * rendered on top of the map base. This could include image, points, line, and
 * polygons.
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.layer = function(options, source) {
  "use strict";
  this.events = {
    "opacitychange" : "opacitychange"
  };

  if (!(this instanceof geoModule.layer)) {
    return new geoModule.layer(options, source);
  }
  ogs.vgl.object.call(this);

  if (!options) {
    options = geoModule.layerOptions();
  }

  /** @private */
  var m_that = this,
      m_id = "",
      m_name = "",
      m_opacity = options.opacity || 1.0,
      m_gcs = 'EPSG:4326',
      m_showAttribution = options.showAttribution || true,
      m_visible = options.visible || true,
      m_binNumber = ogs.vgl.material.RenderBin.Transparent,
      m_defaultLookupTable = vglModule.lookupTable(),
      m_lookupTables = {},
      m_dataSource = source;

  // TODO Write a function for this
  if (m_opacity > 1.0) {
    m_opacity = 1.0;
    console.log("[warning] Opacity cannot be greater than 1.0");
  } else if (m_opacity < 0.0) {
    console.log("[warning] Opacity cannot be less than 1.0");
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the underlying drawable entity.
   * @returns {geoModule.feature}
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
   * Get bin number of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.binNumber = function() {
    return m_binNumber;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set bin number of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setBinNumber = function(binNumber) {
    if (m_binNumber && m_binNumber === binNumber) {
      return false;
    }

    m_binNumber = binNumber;
    this.modified();
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get lookup table of the layer
   * @param {string} varname Name of the variable. If null or empty will
   *  return default lookup table
   */
    ////////////////////////////////////////////////////////////////////////////
  this.lookupTable = function(varname) {
    if (varname && varname in m_lookupTables) {
      return m_lookupTables[varname]
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
      m_lookupTables[varname] = lut;

      // TODO Make sure that all of the existing feature use this lookup table
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
   * Virtual method to handle opacity change.
   * Concrete class should implement this method.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateLayerOpacity = function() {
    // Concrete class should implement this
  };

  return this;
};

inherit(geoModule.layer, ogs.vgl.object);