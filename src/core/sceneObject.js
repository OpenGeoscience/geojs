//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, unparam: true*/

/*global geo, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sceneObject, which extends the object's
 * event handling with a tree-based event propagation.
 *
 * @class
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
      s_trigger = this.trigger;

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Get/set parent of the object
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
   *  Trigger an event (or events) on this object and call all handlers
   */
  //////////////////////////////////////////////////////////////////////////////
  this.trigger = function (event, args) {
    args = args || {};

    // If the event was not triggered by the parent, just propagate up the tree
    if (m_parent && args._triggeredBy !== m_parent) {
      args._triggeredBy = m_this;
      m_parent.trigger(event, args);
      return m_this;
    }

    // call the object's own handlers
    s_trigger.call(m_this, event, args);

    // trigger the event on the children
    m_children.forEach(function (child) {
      args._triggeredBy = m_this;
      child.trigger(event, args);
    });

    return m_this;
  };

  return this;
};

inherit(geo.sceneObject, geo.object);
