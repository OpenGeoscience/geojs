/**
 * @module ogs.geo
 */

/**
 * Layer options object specification
 */
geoModule.layerOptions = function() {

  // Check against no use of new()
  if (!(this instanceof geoModule.layerOptions)) {
    return new geoModule.layerOptions();
  }

  this.opacity = 1;
  this.showAttribution = true;
  this.visible = true;

  return this;
};

/**
 * Base class for all layer types ogs.geo.layer represents any object that be
 * rendered on top of the map base. This could include image, points, line, and
 * polygons.
 */
geoModule.layer = function(options, feature) {

  this.events = {
    "opacitychange" : "opacitychange",
    "update" : "update"
  };

  if (!(this instanceof geoModule.layer)) {
    return new geoModule.layer(options, feature);
  }

  ogs.vgl.object.call(this);

  /** @private */
  var m_that = this;

  /** @private */
  var m_name = "";

  /** @private */
  var m_actor = feature;

  /** @private */
  var m_opacity = options.opacity || 1.0;

  // TODO Write a function for this
  if (m_opacity > 1.0) {
    m_opacity = 1.0;
    console.log("[warning] Opacity cannot be greater than 1.0");
  }
  else if (m_opacity < 0.0) {
    console.log("[warning] Opacity cannot be less than 1.0");
  }

  /** @private */
  var m_showAttribution = options.showAttribution || true;

  /** @private */
  var m_visible = options.visible || true;

  /**
   * Return the underlying drawable entity This function should be implemented
   * by the derived classes
   */
  this.feature = function() {
    return m_actor;
  };

  /**
   * Set feature
   *
   * @param {ogs.vgl.actor}
   */
  this.setFeature = function(actor) {
    if (actor === m_actor) {
      return false;
    }

    m_actor = actor;
    this.modified();

    return true;
  }

  /**
   * Get name of the layer
   *
   * @returns {String}
   */
  this.name = function() {
    return m_name;
  };

  /**
   * Set name of the layer
   *
   * @param {String} name
   */
  this.setName = function(name) {
    if (m_name !== name) {
      m_name = name;
      this.modified();
      return true;
    }

    return false;
  }

  /**
   * Query opacity of the layer (range[0.0, 1.0])
   */
  this.opacity = function() {
    return m_opacity;
  };

  /**
   * Set opacity of the layer in the range of [0.0, 1.0]
   */
  this.setOpacity = function(val) {

    // @todo For now set the opacity every time
    // if (m_opacity === val) {
    //   return false;
    // }

    m_opacity = val;
    $(m_that).trigger({
      type : this.events.opacitychange,
      opacity : m_opacity
    });

    this.modified();
    return true;
  };

  /**
   * Get if layer is visible
   *
   * @returns {Boolean}
   */
  this.visible = function() {
    return m_actor.visible();
  };

  /**
   * Set layer visible true or false
   *
   */
  this.setVisible = function(flag) {

    if (m_actor.visible() === flag) {
      return false;
    }

    this.modified();
    return m_actor.setVisible(flag);
  };

  /**
   * Virtual function to update the layer *
   */
  this.update = function() {
  };

  /**
   * Virtual slot to handle opacity change Concrete class should implement this
   * method.
   */
  this.updateLayerOpacity = function(event) {
  };

  return this;
};

inherit(geoModule.layer, ogs.vgl.object);

/**
 * Create a new instance of class featureLayer
 *
 * @class
 * @dec Layer to draw points, lines, and polygons on the map The polydata layer
 * provide mechanisms to create and draw geometrical shapes such as points,
 * lines, and polygons.
 * @returns {geoModule.featureLayer}
 */
geoModule.featureLayer = function(options, feature) {

  if (!(this instanceof geoModule.featureLayer)) {
    return new geoModule.featureLayer(options, feature);
  }
  geoModule.layer.call(this, options, feature);

  /** @priave */
  var m_that = this;

  /**
   * Slot to handle opacity change
   */
  this.updateLayerOpacity = function(event) {
    var mat = this.feature().material();
    var opacityUniform = mat.shaderProgram().uniform('opacity');
    if (opacityUniform != null) {
      opacityUniform.set(event.opacity);
      $(m_that).trigger(this.events.update);
    }
  };

  $(m_that).on(this.events.opacitychange, m_that.updateLayerOpacity);

  this.setOpacity(this.opacity());

  return this;
};

inherit(geoModule.featureLayer, geoModule.layer);
