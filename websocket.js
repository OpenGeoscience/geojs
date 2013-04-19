/**
 * Websocket wrapper to more easily communicate with geoweb server
 */
goeWebsocket = function(options) {

  this.events = {
    "opacitychange" : "opacitychange",
    "update" : "update"
  };

  if (!(this instanceof geoModule.layer)) {
    return new geoModule.layer(options);
  }

  ogs.vgl.object.call(this);

  /** @private */
  var m_that = this;

  /** @private */
  var m_name = "";

  /** @private */
  var m_opacity = options.opacity || 1.0;

  // TODO Write a function for this
  if (m_opacity > 1.0) {
    m_opacity = 1.0;
    console.log("[WARNING] Opacity cannot be greater than 1.0");
  }
  else if (m_opacity < 0.0) {
    console.log("[WARNING] Opacity cannot be less than 1.0");
  }

  /** @private */
  var m_showAttribution = options.showAttribution || true;

  /** @private */
  var m_visible = options.visible || true;

  /**
   * Return the underlying drawable entity This function should be implemented
   * by the derived classes
   */
  this.actor = function() {
    return null;
  };

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
    m_opacity = val;
    $(m_that).trigger({
      type : this.events.opacitychange,
      opacity : m_opacity
    });
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
