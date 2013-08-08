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
      m_time = null,
      m_features = [],
      m_newFeatures = [],
      m_expiredFeatures = [],
      m_predrawTime = ogs.vgl.timestamp(),
      m_updateTime = ogs.vgl.timestamp(),
      m_legend = null,
      m_visible = true;

  if (feature) {
    m_newFeatures.push(feature);
    m_features.push(feature);
  }
  m_predrawTime.modified();
  m_updateTime.modified();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get current time of the layer.
   *
   * This should be implemented by the derived class
   */
  ////////////////////////////////////////////////////////////////////////////
  this.time = function() {
     return m_time;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the underlying drawable entity.
   * @returns {Array}
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
   * Create legend for this layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createLegend = function() {
    if (m_legend) {
      console.log('[info] Legend already exists for this layer')
      return;
    }

    // Assuming that first variable is the scalar
    var varnames = this.dataSource().variableNames(),
        lut = this.lookupTable();

    if (varnames.length > 0) {
      // Create new lookup table if none exist
      if (!lut) {
        lut = vglModule.lookupTable();
        this.setLookupTable(lut);
      }
      lut.setRange(this.dataSource().getScalarRange());
      m_legend = vglModule.utils.createColorLegend(
        varnames[0], lut, this.legendOrigin(), this.legendWidth(),
        this.legendHeight(), 10, 0);
      m_newFeatures = m_newFeatures.concat(m_legend);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update legend because parameters are changed
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateLegend = function() {
    // For now just delete the last one and create on from scratch
    m_legend = null;
    this.createLegend();
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
        varnames = null,
        geomFeature = null,
        lut = this.lookupTable();

    if (!time) {
      console.log('[info] Timestamp not provided. Using time from previous update.');
      // Use previous time
      time = m_time;
    } else {
      m_time = time;
    }

    data = this.dataSource().getData(time);
    if (!data) {
      return;
    }

    // Clear our existing features
    m_expiredFeatures = m_newFeatures.slice(0);
    m_newFeatures = [];

    // Create legend if not created earlier
    if (!m_legend) {
      this.createLegend();
    }

    for(i = 0; i < data.length; ++i) {
      switch(data[i].type()) {
        case ogs.vgl.data.geometry:
          geomFeature = geoModule.geometryFeature(data[i]);
          geomFeature.material().setBinNumber(this.binNumber());
          geomFeature.setLookupTable(lut);
          m_newFeatures.push(geomFeature);
          break;
        case vglModule.data.raster:
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
    featureCollection.setNewFeatures(this.id(), m_newFeatures);
    featureCollection.setExpiredFeatures(this.id(), m_expiredFeatures);

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

    var i = null,
        j = null,
        mat = null,
        skipFeature = false,
        opacityUniform = null;

    for (i = 0; i < m_features.length; ++i) {
      skipFeature = false;
      if (m_legend && m_legend.length) {
        for (j = 0; j < m_legend.length; ++j) {
          if (m_features[i] === m_legend[j]) {
            skipFeature = true;
            break;
          }
        }

        if (skipFeature) {
          continue;
        }

        mat = m_features[i].material();
        opacityUniform = mat.shaderProgram().uniform('opacity');
        if (opacityUniform !== null) {
          opacityUniform.set(opacity);
          $(m_that).trigger(geoModule.command.updateLayerOpacityEvent);
        }
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update color mapping for the layer for a particular variable.
   * This should be called when lookup table or any other parameters
   * that could affect color mappings changes.
   */
    ////////////////////////////////////////////////////////////////////////////
  this.updateColorMapping = function(varname) {
    var i = null,
        lut = this.lookupTable(varname);

    lut.setRange(this.dataSource().getScalarRange(varname));
    for (i = 0; i < m_features.length; ++i) {
      m_features.setLookupTable(lut);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get if layer is visible.
   *
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.visible = function() {
    return m_visible;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set layer visible true or false. Set the visability of the features in
   * this layer.
   *
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setVisible = function(flag) {
    m_visible = flag

    $.each(m_features, function(i, feature){
      feature.setVisible(flag)
    });
  };


  this.setOpacity(this.opacity());
  return this;
};

inherit(geoModule.featureLayer, geoModule.layer);
