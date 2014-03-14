//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2, unparam: true*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class object
 *
 * @class
 * @returns {geo.object}
 */
//////////////////////////////////////////////////////////////////////////////
geo.object = function(cfg) {
  "use strict";
  if (!(this instanceof geo.object)) {
    return new geo.object();
  }
  
  var m_this = this,
      m_eventHandlers = {},
      m_parent = null,
      m_children = [];


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
    return this;
  };

//////////////////////////////////////////////////////////////////////////////
/**
 *  Add a child to the object
 */
//////////////////////////////////////////////////////////////////////////////
  this.addChild = function (child) {
    m_children.push(child);
    return this;
  };

//////////////////////////////////////////////////////////////////////////////
/**
 *  Add a child to the object
 */
//////////////////////////////////////////////////////////////////////////////
  this.removeChild = function (child) {
    m_children = m_children.filter(function (c) { return c !== child; });
    return this;
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
 *  Bind an event handler to this object
 */
//////////////////////////////////////////////////////////////////////////////
  this.on = function (event, handler) {
    if (Array.isArray(event)) {
      event.forEach(function (e) {
        this.on(e, handler);
      });
      return this;
    }
    if (!m_eventHandlers.hasOwnProperty(event)) {
      m_eventHandlers[event] = [];
    }
    m_eventHandlers[event].push(handler);
    return this;
  };

//////////////////////////////////////////////////////////////////////////////
/**
 *  Trigger an event (or events) on this object and call all handlers
 */
//////////////////////////////////////////////////////////////////////////////
  this.trigger = function (event, args) {
    // If the event was not triggered by the parent, just propagate up the tree
    if (m_parent && args._triggeredBy !== m_parent) {
      args._triggeredBy = m_this;
      m_parent.trigger(event, args);
      return this;
    }

    // if we have an array of events, recall with single events
    if (Array.isArray(event)) {
      event.forEach(function (e) {
        m_this.trigger(e, args);
      });
      return this;
    }

    // call the object's own handlers
    if (m_eventHandlers.hasOwnProperty(event)) {
      m_eventHandlers[event].forEach(function (handler) {
        handler(args);
      });
    }

    // trigger the event on the children
    m_children.forEach(function (child) {
      args._triggeredBy = m_this;
      child.trigger(event, args);
    });

    return this;
  };

//////////////////////////////////////////////////////////////////////////////
/**
 *  Remove handlers from an event (or an array of events).
 *
 *  @param arg a function or array of functions to remove from the events
 *             or if falsey remove all handlers from the events
 */
//////////////////////////////////////////////////////////////////////////////
  this.off = function (event, arg) {
    if (Array.isArray(event)) {
      event.forEach(function (e) {
        this.off(e, arg);
      });
      return this;
    }
    if (!arg) {
      m_eventHandlers[event] = [];
    } else if (Array.isArray(arg)) {
      arg.forEach(function (handler) {
        this.off(event, handler);
      });
      return this;
    }
    // What do we do if the handler is not already bound?
    //   ignoring for now...
    if (m_eventHandlers.hasOwnProperty(event)) {
      m_eventHandlers[event] = m_eventHandlers[event].filter(function (f) {
          return f !== arg;
      });
    }
    return this;
  };

  vgl.object.call(this);

  return this;
};

inherit(geo.object, vgl.object);
