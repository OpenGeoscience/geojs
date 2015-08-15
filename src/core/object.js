//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class object
 *
 * @class
 * @extends vgl.object
 * @returns {geo.object}
 */
//////////////////////////////////////////////////////////////////////////////
geo.object = function () {
  "use strict";
  if (!(this instanceof geo.object)) {
    return new geo.object();
  }

  var m_this = this,
      m_eventHandlers = {},
      m_idleHandlers = [],
      m_deferredCount = 0;

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Bind a handler that will be called once when all deferreds are resolved.
   *
   *  @param {function} handler A function taking no arguments
   *  @returns {geo.object[]|geo.object} this
   */
  //////////////////////////////////////////////////////////////////////////////
  this.onIdle = function (handler) {
    if (m_deferredCount) {
      m_idleHandlers.push(handler);
    } else {
      handler();
    }
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Add a new deferred object preventing idle event handlers from being called.
   *
   *  @param {$.defer} defer A jquery defered object
   */
  //////////////////////////////////////////////////////////////////////////////
  this.addDeferred = function (defer) {
    m_deferredCount += 1;
    defer.done(function () {
      m_deferredCount -= 1;
      if (!m_deferredCount) {
        m_idleHandlers.splice(0, m_idleHandlers.length)
          .forEach(function (handler) {
            handler();
          });
      }
    });
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Bind an event handler to this object
   *
   *  @param {String} event
   *    An event from {geo.events}
   *  @param {function} handler
   *    A function that will be called when ``event`` is triggered.  The
   *    function will be given an event object as a first parameter and
   *    optionally a second argument provided by the triggerer.
   */
  //////////////////////////////////////////////////////////////////////////////
  this.geoOn = function (event, handler) {
    if (Array.isArray(event)) {
      event.forEach(function (e) {
        m_this.geoOn(e, handler);
      });
      return m_this;
    }
    if (!m_eventHandlers.hasOwnProperty(event)) {
      m_eventHandlers[event] = [];
    }
    m_eventHandlers[event].push(handler);
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Trigger an event (or events) on this object and call all handlers
   *
   *  @param {String} event An event from {geo.event}
   *  @param {Object} args An optional argument to pass to handlers
   */
  //////////////////////////////////////////////////////////////////////////////
  this.geoTrigger = function (event, args) {

    // if we have an array of events, recall with single events
    if (Array.isArray(event)) {
      event.forEach(function (e) {
        m_this.geoTrigger(e, args);
      });
      return m_this;
    }

    // append the event type to the argument object
    args = args || {};
    args.event = event;

    if (m_eventHandlers.hasOwnProperty(event)) {
      m_eventHandlers[event].forEach(function (handler) {
        handler.call(m_this, args);
      });
    }

    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Remove handlers from an event (or an array of events).  If no event is
   *  provided all hanlders will be removed.
   *
   *  @param {string?} event An event from {geo.events}
   *  @param {object?} arg A function or array of functions to remove from the events
   *                      or if falsey remove all handlers from the events
   */
  //////////////////////////////////////////////////////////////////////////////
  this.geoOff = function (event, arg) {
    if (event === undefined) {
      m_eventHandlers = {};
      m_idleHandlers = [];
      m_deferredCount = 0;
    }
    if (Array.isArray(event)) {
      event.forEach(function (e) {
        m_this.geoOff(e, arg);
      });
      return m_this;
    }
    if (!arg) {
      m_eventHandlers[event] = [];
    } else if (Array.isArray(arg)) {
      arg.forEach(function (handler) {
        m_this.geoOff(event, handler);
      });
      return m_this;
    }
    // What do we do if the handler is not already bound?
    //   ignoring for now...
    if (m_eventHandlers.hasOwnProperty(event)) {
      m_eventHandlers[event] = m_eventHandlers[event].filter(function (f) {
          return f !== arg;
        }
      );
    }
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Free all resources and destroy the object.
   */
  //////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    m_this.geoOff();
  };

  vgl.object.call(this);

  return this;
};

inherit(geo.object, vgl.object);
