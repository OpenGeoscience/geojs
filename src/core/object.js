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
      m_eventHandlers = {};

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

    // if we have an array of events, recall with single events
    if (Array.isArray(event)) {
      event.forEach(function (e) {
        m_this.trigger(e, args);
      });
      return this;
    }

    if (m_eventHandlers.hasOwnProperty(event)) {
      m_eventHandlers[event].forEach(function (handler) {
        handler(args);
      });
    }

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
