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
 * Layer options object specification
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.layerOptions = function() {
  "use strict";
  // Check against no use of new()
  if (!(this instanceof geoModule.layerOptions)) {
    return new geoModule.layerOptions();
  }

  this.opacity = 1;
  this.showAttribution = true;
  this.visible = true;
  this.binNumber = -1;

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
    "opacitychange" : "opacitychange",
    "update" : "update"
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
      m_name = "",
      m_dataSource = source,
      m_opacity = options.opacity || 1.0,
      m_showAttribution = options.showAttribution || true,
      m_visible = options.visible || true,
      m_binNumber = -1;

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
   * @param {ogs.vgl.actor}
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setFeatures = function(features) {
    // if (actor === m_feature) {
    //   return false;
    // }

    // m_feature = actor;
    // this.modified();

    // return true;

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
    $(m_that).trigger({
      type : this.events.opacitychange,
      opacity : m_opacity
    });

    this.modified();
    return true;
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
    // if (m_feature.visible() === flag) {
    //   return false;
    // }

    // this.modified();
    // return m_feature.setVisible(flag);
    return false;
  };

  /**
   * Get source of the layer
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.dataSource = function() {
    return m_dataSource;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set source of the layer
   *
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
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to update the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.update = function(time) {
    // TODO Call source update here
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Prepare layer for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.prepareForRendering = function(layersDrawables) {
    // var layerDrawables = layersDrawables.get(this);
    // if (layerDrawables) {
    // } else {
    //   layersDrawables.add(this, ...)
    // }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the modified time for the last update that did something
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getUpdateTime = function() {
    // TODO Implement this
    // m_updateTime.getMTime();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual slot to handle opacity change Concrete class should implement this
   * method.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateLayerOpacity = function() {
  };

  return this;
};

inherit(geoModule.layer, ogs.vgl.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class featureLayer
 *
 * @class
 * @dec Layer to draw points, lines, and polygons on the map The polydata layer
 * provide mechanisms to create and draw geometrical shapes such as points,
 * lines, and polygons.
 * @returns {geoModule.featureLayer}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.featureLayer = function(options, feature) {
  "use strict";
  if (!(this instanceof geoModule.featureLayer)) {
    return new geoModule.featureLayer(options, feature);
  }
  geoModule.layer.call(this, options);

  /** @priave */
  var m_that = this,
      m_features = [],
      m_prepareRenderTime = ogs.vgl.timestamp(),
      m_updateFeaturesTime = ogs.vgl.timestamp();

  if (feature) {
    m_features.push(feature);
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

    console.log('data is ', data);
    console.log('time is ', time);

    for(i = 0; i < data.length; ++i) {
      switch(data[i].type()) {
        case vglModule.data.geometry:
          console.log("adding new geometry");
          var geomFeature = geoModule.geometryFeature(data[i]);
          m_features.push(geomFeature);
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

    // Update the source
    // Get updated data
    // If feature is not created yet, create new feature
    // Update feature with the data
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

    // TODO Finish this
    var currentFeatures = layersDrawables.features(this.name());
    if (currentFeatures === null) {
      layersDrawables.setFeatures(this.name(), m_features);
    }

    m_prepareRenderTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Slot to handle opacity change
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateLayerOpacity = function(event) {
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
        opacityUniform.set(event.opacity);
        $(m_that).trigger(this.events.update);
      }
    }
  };

  $(m_that).on(this.events.opacitychange, m_that.updateLayerOpacity);
  this.setOpacity(this.opacity());
  return this;
};

inherit(geoModule.featureLayer, geoModule.layer);
