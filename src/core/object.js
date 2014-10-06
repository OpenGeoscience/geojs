//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class object
 *
 * @class
 * @returns {geo.object}
 */
//////////////////////////////////////////////////////////////////////////////
geo.object = function () {
  "use strict";
  if (!(this instanceof geo.object)) {
    return new geo.object();
  }

  var m_this = this,
      $this = $(this),
      m_idleHandlers = [],
      m_deferredCount = 0;

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Bind a handler that will be called once when all deferreds are resolved.
   */
  //////////////////////////////////////////////////////////////////////////////
  this.onIdle = function (handler) {
    if (m_deferredCount) {
      m_idleHandlers.push(handler);
    } else {
      handler();
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Add a new deferred object preventing idle event handlers from being called.
   *  Takes a $.Deferred object as an argument.
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
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Bind an event handler to this object
   */
  //////////////////////////////////////////////////////////////////////////////
  this.on = function (event, handler) {
    if (Array.isArray(event)) {
      event = event.join(" ");
    }
    $this.on(event, function (evt, args) { handler(args); });
    return m_this;
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
      return m_this;
    }

    $this.trigger(event, args);

    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   *  Remove handlers from an event (or an array of events).
   */
  //////////////////////////////////////////////////////////////////////////////
  this.off = function (event) {
    if (Array.isArray(event)) {
      event = event.join(" ");
    }

    $this.off(event);
    return m_this;
  };

  vgl.object.call(this);

  return this;
};

inherit(geo.object, vgl.object);
