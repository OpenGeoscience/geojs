//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class event
 *
 * @class
 * @returns {geo.event}
 */
 //////////////////////////////////////////////////////////////////////////////
geo.event = function (arg) {
  "use strict";
  if (!(this instanceof geo.event)) {
    return new geo.event(arg);
  }
  vgl.event.call(this);

  var m_this = this,
      m_namespace = (arg || {}).namespace || null,
      key;

  for (key in geo.event) {
    if (geo.event.hasOwnProperty(key) && typeof geo.event[key] === "string") {
      this[key] = geo.event[key];
      if (m_namespace !== null) {
        this[key] = this[key] + "." + m_namespace;
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Return a namespaced event object.  For example,
   *
   *   nsEvent = geo.event.namespace('plugin')
   *
   * returns
   *
   *   {
   *     update: "geo.update.plugin",
   *     zoom: "geo.zoom.plugin"
   *     ...
   *   }
   *
   * All events from a namespace can be unbound from an object with:
   *
   *   obj.off('.plugin')
   *
   * Namespaces can also be nested:
   *
   *   nsEvent = geo.event.namespace('plugin').namespace('view')
   */
  //////////////////////////////////////////////////////////////////////////////
  this.namespace = function (ns) {
    var new_ns;

    if (!ns) {
      if (!m_namespace) {
        return [];
      }
      return m_namespace.split(".");
    }

    new_ns = m_this.namespace();
    new_ns.push(ns);

    return geo.event({
      namespace: new_ns.join(".")
    });
  };

  return this;
};

inherit(geo.event, vgl.event);

//////////////////////////////////////////////////////////////////////////////
/**
 * Event types
 */
//////////////////////////////////////////////////////////////////////////////

// TODO Add documentation
geo.event.update = "geo.update";
geo.event.opacityUpdate = "geo.opacityUpdate";
geo.event.layerAdd = "geo.layerAdd";
geo.event.layerRemove = "geo.layerRemove";
geo.event.layerToggle = "geo.layerToggle";
geo.event.layerSelect = "geo.layerSelect";
geo.event.layerUnselect = "geo.layerUnselect";
geo.event.zoom = "geo.zoom";
geo.event.center = "geo.center";
geo.event.pan = "geo.pan";
geo.event.rotate = "geo.rotate";
geo.event.resize = "geo.resize";
geo.event.animate = "geo.animate";
geo.event.query = "geo.query";
geo.event.draw = "geo.draw";
geo.event.drawEnd = "geo.drawEnd";
geo.event.animationPause = "geo.animationPause";
geo.event.animationStop = "geo.animationStop";
geo.event.animationComplete = "geo.animationComplete";
geo.event.namespace = function (ns) {
  "use strict";
  return geo.event({namespace: ns});
};
