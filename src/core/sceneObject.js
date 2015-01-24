//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sceneObject, which extends the object's
 * event handling with a tree-based event propagation.
 *
 * @class
 * @extends geo.object
 * @returns {geo.sceneObject}
 */
//////////////////////////////////////////////////////////////////////////////
geo.sceneObject = function (arg) {
  "use strict";
  if (!(this instanceof geo.sceneObject)) {
    return new geo.sceneObject();
  }
  geo.object.call(this, arg);

  var m_this = this,
      m_parent = null,
      m_children = [],
      s_trigger = this.geoTrigger,
      s_addDeferred = this.addDeferred,
      s_onIdle = this.onIdle;

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Override object.addDeferred to propagate up the scene tree.
   */
  //////////////////////////////////////////////////////////////////////////////
  this.addDeferred = function (defer) {
    if (m_parent) {
      m_parent.addDeferred(defer);
    } else {
      s_addDeferred(defer);
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Override object.onIdle to propagate up the scene tree.
   */
  //////////////////////////////////////////////////////////////////////////////
  this.onIdle = function (handler) {
    if (m_parent) {
      m_parent.onIdle(handler);
    } else {
      s_onIdle(handler);
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Get/set parent of the object
   *  @param {?geo.sceneObject} parent
   */
  //////////////////////////////////////////////////////////////////////////////
  this.parent = function (arg) {
    if (arg === undefined) {
      return m_parent;
    }
    m_parent = arg;
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Add a child (or an array of children) to the object
   */
  //////////////////////////////////////////////////////////////////////////////
  this.addChild = function (child) {
    if (Array.isArray(child)) {
      child.forEach(m_this.addChild);
      return m_this;
    }
    child.parent(m_this);
    m_children.push(child);
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Remove a child (or array of children) from the object
   */
  //////////////////////////////////////////////////////////////////////////////
  this.removeChild = function (child) {
    if (Array.isArray(child)) {
      child.forEach(m_this.removeChild);
      return m_this;
    }
    m_children = m_children.filter(function (c) { return c !== child; });
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Get an array of child objects
   */
  //////////////////////////////////////////////////////////////////////////////
  this.children = function () {
    return m_children.slice();
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Force redraw of a scene object, to be implemented by subclasses.
   *  Base class just calls draw of child objects.
   */
  //////////////////////////////////////////////////////////////////////////////
  this.draw = function (arg) {
    m_this.children().forEach(function (child) {
      child.draw(arg);
    });
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Trigger an event (or events) on this object and call all handlers.
   *  @param {String} event the event to trigger
   *  @param {Object} args arbitrary argument to pass to the handler
   *  @param {Boolean} childrenOnly if true, only propagate down the tree
   */
  //////////////////////////////////////////////////////////////////////////////
  this.geoTrigger = function (event, args, childrenOnly) {

    var geoArgs;

    args = args || {};
    geoArgs = args.geo || {};
    args.geo = geoArgs;

    // stop propagation if requested by the handler
    if (geoArgs.stopPropagation) {
      return m_this;
    }

    // If the event was not triggered by the parent, just propagate up the tree
    if (!childrenOnly && m_parent && geoArgs._triggeredBy !== m_parent) {
      geoArgs._triggeredBy = m_this;
      m_parent.geoTrigger(event, args);
      return m_this;
    }

    // call the object's own handlers
    s_trigger.call(m_this, event, args);

    // stop propagation if requested by the handler
    if (geoArgs.stopPropagation) {
      return m_this;
    }

    // trigger the event on the children
    m_children.forEach(function (child) {
      geoArgs._triggeredBy = m_this;
      child.geoTrigger(event, args);
    });

    return m_this;
  };

  return this;
};

inherit(geo.sceneObject, geo.object);
