//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of mapInteractor
 *
 * @class geo.mapInteractor
 * @returns {geo.mapInteractor}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mapInteractor = function (args) {
  'use strict';
  if (!(this instanceof geo.mapInteractor)) {
    return new geo.mapInteractor(args);
  }
  geo.object.call(this);

  var m_options = args || {},
      m_this = this,
      m_mouse,
      m_keyboard,
      m_state,
      $node,
      m_wheelQueue = { x: 0, y: 0 },
      m_throttleTime = 10,
      m_wait = false,
      m_disableThrottle = true;

  // Helper method to decide if the current button/modifiers match a set of
  // conditions.
  // button: 'left' | 'right' | 'middle'
  // modifiers: [ 'alt' | 'meta' | 'ctrl' | 'shift' ]
  function eventMatch(button, modifiers) {
    /* jshint -W018 */
    return (button === 'wheel' || m_mouse.buttons[button]) &&
      (!!m_mouse.modifiers.alt)   === (!!modifiers.alt)   &&
      (!!m_mouse.modifiers.meta)  === (!!modifiers.meta)  &&
      (!!m_mouse.modifiers.shift) === (!!modifiers.shift) &&
      (!!m_mouse.modifiers.ctrl)  === (!!modifiers.ctrl);
    /* jshint +W018 */
  }

  // Helper method to calculate the speed from a velocity
  function calcSpeed(v) {
    var x = v.x, y = v.y;
    return Math.sqrt(x * x + y * y);
  }

  // For throttling mouse events this is a function that
  // returns true if no actions are in progress and starts
  // a timer to block events for the next `m_throttleTime` ms.
  // If it returns false, the caller should ignore the
  // event.
  function doRespond() {
    if (m_disableThrottle) {
      return true;
    }
    if (m_wait) {
      return false;
    }
    m_wait = true;
    window.setTimeout(function () {
      m_wait = false;
      m_wheelQueue = {
        x: 0,
        y: 0
      };
    }, m_throttleTime);
    return true;
  }

  // copy the options object with defaults
  m_options = $.extend(
    true,
    {
      panMoveButton: 'left',
      panMoveModifiers: {},
      zoomMoveButton: 'right',
      zoomMoveModifiers: {},
      panWheelEnabled: false,
      panWheelModifiers: {},
      zoomWheelEnabled: true,
      zoomWheelModifiers: {},
      wheelScaleX: 1,
      wheelScaleY: 1,
      zoomScale: 1,
      selectionButton: 'left',
      selectionModifiers: {'shift': true},
      momentum: {
        enabled: true,
        maxSpeed: 10,
        minSpeed: 0.01,
        drag: 0.005
      }
    },
    m_options
  );

  // options supported:
  // {
  //   // button that must be pressed to initiate a pan on mousedown
  //   panMoveButton: 'right' | 'left' | 'middle'
  //
  //   // modifier keys that must be pressed to initiate a pan on mousemove
  //   panMoveModifiers: { 'ctrl' | 'alt' | 'meta' | 'shift' }
  //
  //   // button that must be pressed to initiate a zoom on mousedown
  //   zoomMoveButton: 'right' | 'left' | 'middle'
  //
  //   // modifier keys that must be pressed to initiate a zoom on mousemove
  //   zoomMoveModifiers: { 'ctrl' | 'alt' | 'meta' | 'shift' }
  //
  //   // enable or disable panning with the mouse wheel
  //   panWheelEnabled: true | false
  //
  //   // modifier keys that must be pressed to trigger a pan on wheel
  //   panWheelModifiers: {...}
  //
  //   // enable or disable zooming with the mouse wheel
  //   zoomWheelEnabled: true | false
  //
  //   // modifier keys that must be pressed to trigger a zoom on wheel
  //   zoomWheelModifiers: {...}
  //
  //   // wheel scale factor to change the magnitude of wheel interactions
  //   wheelScaleX: 1
  //   wheelScaleY: 1
  //
  //   // zoom scale factor to change the magnitude of zoom move interactions
  //   zoomScale: 1
  //
  //   // button that must be pressed to enable drag selection
  //    selectionButton: 'right' | 'left' | 'middle'
  //
  //   // keyboard modifiers that must be pressed to initiate a selection
  //   selectionModifiers: {...}
  //
  //   // enable momentum when panning
  //   momentum: {
  //     enabled: true | false,
  //     drag: number, // drag coefficient
  //     maxSpeed: number, // don't allow animation to pan faster than this
  //     minSpeed: number  // stop animations if the speed is less than this
  //   }
  // }

  // default mouse object
  m_mouse = {
    page: { // mouse position relative to the page
      x: 0,
      y: 0
    },
    map: { // mouse position relative to the map
      x: 0,
      y: 0
    },
    // mouse button status
    buttons: {
      left: false,
      right: false,
      middle: false
    },
    // keyboard modifier status
    modifiers: {
      alt: false,
      ctrl: false,
      shift: false,
      meta: false
    },
    // time the event was captured
    time: new Date(),
    // time elapsed since the last mouse event
    deltaTime: 1,
    // pixels/ms
    velocity: 0
  };

  // default keyboard object
  // (keyboard events not implemented yet)
  m_keyboard = {
  };

  // The interactor state determines what actions are taken in response to
  // core browser events.
  //
  // i.e.
  // {
  //    'action': 'pan',      // an ongoing pan event
  //    'origin': {...},      // mouse object at the start of the action
  //    'delta': {x: *, y: *} // mouse movement since action start
  //                          // not including the current event
  //  }
  //
  //  {
  //    'action': 'zoom',  // an ongoing zoom event
  //    ...
  //  }
  //
  //  {
  //    'acton': 'select',
  //    'origin': {...},
  //    'delta': {x: *, y: *}
  //  }
  //
  //  {
  //    'action': 'momentum',
  //    'origin': {...},
  //    'handler': function () { }, // called in animation loop
  //    'timer': animate loop timer
  //  }
  m_state = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connects events to a map.  If the map is not set, then this does nothing.
   * @returns {geo.mapInteractor}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._connectEvents = function () {
    if (!m_options.map) {
      return m_this;
    }

    // prevent double binding to dom elements
    m_this._disconnectEvents();

    // store the connected element
    $node = $(m_options.map.node());


    // add event handlers
    $node.on('mousemove.geojs', m_this._handleMouseMove);
    $node.on('mousedown.geojs', m_this._handleMouseDown);
    $node.on('mouseup.geojs', m_this._handleMouseUp);
    $node.on('mousewheel.geojs', m_this._handleMouseWheel);
    if (m_options.panMoveButton === 'right' ||
        m_options.zoomMoveButton === 'right') {
      $node.on('contextmenu.geojs', function () { return false; });
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Disonnects events to a map.  If the map is not set, then this does nothing.
   * @returns {geo.mapInteractor}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._disconnectEvents = function () {
    if ($node) {
      $node.off('.geojs');
      $node = null;
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets map for this interactor, adds draw region layer if needed
   *
   * @param {geo.map} newMap optional
   * @returns {geo.interactorStyle|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.map = function (val) {
    if (val !== undefined) {
      m_options.map = val;
      m_this._connectEvents();
      return m_this;
    }
    return m_options.map;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gets/sets the options object for the interactor.
   *
   * @param {Object} opts optional
   * @returns {geo.interactorStyle|Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.options = function (opts) {
    if (opts === undefined) {
      return $.extend({}, m_options);
    }
    $.extend(m_options, opts);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Stores the current mouse position from an event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._getMousePosition = function (evt) {
    var offset = $node.offset(), dt, t;

    t = (new Date()).valueOf();
    dt = t - m_mouse.time;
    m_mouse.time = t;
    m_mouse.deltaTime = dt;
    m_mouse.velocity = {
      x: (evt.pageX - m_mouse.page.x) / dt,
      y: (evt.pageY - m_mouse.page.y) / dt
    };
    m_mouse.page = {
      x: evt.pageX,
      y: evt.pageY
    };
    m_mouse.map = {
      x: evt.pageX - offset.left,
      y: evt.pageY - offset.top
    };
    m_mouse.geo = m_this.map().displayToGcs(m_mouse.map);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Stores the current mouse button
   */
  ////////////////////////////////////////////////////////////////////////////
  this._getMouseButton = function (evt) {
    if (evt.which === 1)
      m_mouse.buttons.left = evt.type !== 'mouseup';
    else if (evt.which === 3) {
      m_mouse.buttons.right = evt.type !== 'mouseup';
    } else if (evt.which === 2) {
      m_mouse.buttons.middle = evt.type !== 'mouseup';
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Stores the current keyboard modifiers
   */
  ////////////////////////////////////////////////////////////////////////////
  this._getMouseModifiers = function (evt) {
    m_mouse.modifiers.alt = evt.altKey;
    m_mouse.modifiers.ctrl = evt.ctrlKey;
    m_mouse.modifiers.meta = evt.metaKey;
    m_mouse.modifiers.shift = evt.shiftKey;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute a selection information object.
   * @private
   * @returns {Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._getSelection = function () {
    var origin = m_state.origin,
        mouse = m_this.mouse(),
        map = m_this.map(),
        display = {}, gcs = {};

    // TODO: clamp to map bounds
    // Get the display coordinates
    display.upperLeft = {
      x: Math.min(origin.map.x, mouse.map.x),
      y: Math.min(origin.map.y, mouse.map.y)
    };

    display.lowerRight = {
      x: Math.max(origin.map.x, mouse.map.x),
      y: Math.max(origin.map.y, mouse.map.y)
    };

    display.upperRight = {
      x: display.lowerRight.x,
      y: display.upperLeft.y
    };

    display.lowerLeft = {
      x: display.upperLeft.x,
      y: display.lowerRight.y
    };

    // Get the gcs coordinates
    gcs.upperLeft = map.displayToGcs(display.upperLeft);
    gcs.lowerRight = map.displayToGcs(display.lowerRight);
    gcs.upperRight = map.displayToGcs(display.upperRight);
    gcs.lowerLeft = map.displayToGcs(display.lowerLeft);

    return {
      display: display,
      gcs: gcs,
      mouse: mouse,
      origin: $.extend({}, m_state.origin)
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when a mouse button is pressed
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseDown = function (evt) {
    var action = null;

    if (m_state.action === 'momentum') {
      // cancel momentum on click
      m_state = {};
    }

    m_this._getMousePosition(evt);
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    if (eventMatch(m_options.panMoveButton, m_options.panMoveModifiers)) {
      action = 'pan';
    } else if (eventMatch(m_options.zoomMoveButton, m_options.zoomMoveModifiers)) {
      action = 'zoom';
    } else if (eventMatch(m_options.selectionButton, m_options.selectionModifiers)) {
      action = 'select';
    }

    if (action) {
      // store the state object
      m_state = {
        action: action,
        origin: $.extend(true, {}, m_mouse),
        delta: {x: 0, y: 0}
      };

      if (action === 'select') {
        m_this.map().geoTrigger(geo.event.brushstart, m_this._getSelection());
      }

      // bind temporary handlers to document
      $(document).on('mousemove.geojs', m_this._handleMouseMoveDocument);
      $(document).on('mouseup.geojs', m_this._handleMouseUpDocument);
    }

  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseMove = function (evt) {
    if (m_state.action) {
      // If currently performing a navigation action, the mouse
      // coordinates will be captured by the document handler.
      return;
    }
    m_this._getMousePosition(evt);
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);
    m_this.map().geoTrigger(geo.event.mousemove, m_this.mouse());
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event on the document (temporary bindings)
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseMoveDocument = function (evt) {
    var dx, dy, selectionObj;
    m_this._getMousePosition(evt);
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    if (!m_state.action) {
      // This shouldn't happen
      console.log('WARNING: Invalid state in mapInteractor.');
      return;
    }

    // when throttled, do nothing
    if (!doRespond()) {
      return;
    }

    // calculate the delta from the origin point to avoid
    // accumulation of floating point errors
    dx = m_mouse.map.x - m_state.origin.map.x - m_state.delta.x;
    dy = m_mouse.map.y - m_state.origin.map.y - m_state.delta.y;
    m_state.delta.x += dx;
    m_state.delta.y += dy;

    if (m_state.action === 'pan') {
      m_this.map().pan({x: dx, y: dy});
    } else if (m_state.action === 'zoom') {
      m_this.map().zoom(
        m_this.map().zoom() - dy * m_options.zoomScale / 120
      );
    } else if (m_state.action === 'select') {
      // Get the bounds of the current selection
      selectionObj = m_this._getSelection();
      m_this.map().geoTrigger(geo.event.brush, selectionObj);
    }

    // Prevent default to stop text selection in particular
    evt.preventDefault();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when a mouse button is unpressed on the document.
   * Removes temporary bindings.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseUpDocument = function (evt) {
    var selectionObj, oldAction;

    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    // unbind temporary handlers on document
    $(document).off('.geojs');

    if (m_mouse.buttons.right) {
      evt.preventDefault();
    }

    if (m_state.action === 'select') {
      selectionObj = m_this._getSelection();
      m_this.map().geoTrigger(geo.event.brushend, selectionObj);
    }

    // reset the interactor state
    oldAction = m_state.action;
    m_state = {};

    // if momentum is enabled, start the action here
    if (m_options.momentum.enabled && oldAction === 'pan') {
      m_state.action = 'momentum';
      m_state.origin = m_this.mouse();
      m_state.handler = function () {
        var vx, vy, speed, s;

        if (m_state.action !== 'momentum' || !m_this.map()) {
          // cancel if a new action was performed
          return;
        }

        vx = m_mouse.velocity.x;
        vy = m_mouse.velocity.y;

        // get the current speed
        speed = calcSpeed(m_mouse.velocity);
        s = speed;

        // normalize the velocity components
        vx = vx / speed;
        vy = vy / speed;

        // modify current speed by constraints
        speed = Math.min(speed, m_options.momentum.maxSpeed);

        // calculate the new speed
        speed = speed * Math.exp(-m_options.momentum.drag * m_mouse.deltaTime);

        // stop panning when the speed is below the threshold
        if (speed < m_options.momentum.minSpeed) {
          m_state = {};
          return;
        }

        m_mouse.velocity.x = speed * vx;
        m_mouse.velocity.y = speed * vy;

        m_this.map().pan({
          x: m_mouse.velocity.x * m_mouse.deltaTime,
          y: m_mouse.velocity.y * m_mouse.deltaTime
        });

        window.requestAnimationFrame(m_state.handler);
      };
      window.requestAnimationFrame(m_state.handler);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when a mouse button is unpressed
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseUp = function (evt) {
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    // fire a click event here
    m_this.map().geoTrigger(geo.event.mouseclick, m_this.mouse());
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse wheel event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseWheel = function (evt) {
    var zoomFactor, direction;

    // In case jquery-mousewheel isn't loaded for some reason
    evt.deltaFactor = evt.deltaFactor || 1;

    m_this._getMouseModifiers(evt);
    evt.deltaX = evt.deltaX * m_options.wheelScaleX * evt.deltaFactor / 120;
    evt.deltaY = evt.deltaY * m_options.wheelScaleY * evt.deltaFactor / 120;

    evt.preventDefault();
    if (!doRespond()) {
      m_wheelQueue.x += evt.deltaX;
      m_wheelQueue.y += evt.deltaY;
      return;
    }

    evt.deltaX += m_wheelQueue.x;
    evt.deltaY += m_wheelQueue.y;

    m_wheelQueue = {
      x: 0,
      y: 0
    };

    if (m_options.panWheelEnabled &&
        eventMatch('wheel', m_options.panWheelModifiers)) {

      m_this.map().pan({
        x: evt.deltaX,
        y: evt.deltaY
      });

    } else if (m_options.zoomWheelEnabled &&
               eventMatch('wheel', m_options.zoomWheelModifiers)) {

      zoomFactor = evt.deltaY;
      direction = m_mouse.map;

      m_this.map().zoom(
        m_this.map().zoom() + zoomFactor,
        direction
      );
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle double click event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleDoubleClick = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Public method that unbinds all events
   */
  ////////////////////////////////////////////////////////////////////////////
  this.destroy = function () {
    m_this._disconnectEvents();
    m_this.map(null);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get current mouse information
   */
  ////////////////////////////////////////////////////////////////////////////
  this.mouse = function () {
    return $.extend(true, {}, m_mouse);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get current keyboard information
   */
  ////////////////////////////////////////////////////////////////////////////
  this.keyboard = function () {
    return $.extend(true, {}, m_keyboard);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the current interactor state
   */
  ////////////////////////////////////////////////////////////////////////////
  this.state = function () {
    return $.extend(true, {}, m_state);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Simulate a DOM mouse event on connected map.
   *
   * The options for creating the events are as follows, not all
   * options are required for every event type.
   *
   * options = {
   *   page: {x, y} // position on the page
   *   map: {x, y}  // position on the map (overrides page)
   *   button: 'left' | 'right' | 'middle'
   *   modifiers: [ 'alt' | 'ctrl' | 'meta' | 'shift' ]
   *   wheelDelta: {x, y}
   * }
   *
   * @param {string} type Event type 'mousemove', 'mousedown', 'mouseup', ...
   * @param {object} options
   * @returns {mapInteractor}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.simulateEvent = function (type, options) {
    var evt, page, offset, which;

    if (!m_this.map()) {
      return m_this;
    }

    page = options.page || {};

    if (options.map) {
      offset = $node.offset();
      page.x = options.map.x + offset.left;
      page.y = options.map.y + offset.top;
    }

    if (options.button === 'left') {
      which = 1;
    } else if (options.button === 'right') {
      which = 3;
    } else if (options.button === 'middle') {
      which = 2;
    }

    options.modifiers = options.modifiers || [];
    options.wheelDelta = options.wheelDelta || {};

    evt = $.Event(
      type,
      {
        pageX: page.x,
        pageY: page.y,
        which: which,
        altKey: options.modifiers.indexOf('alt') >= 0,
        ctrlKey: options.modifiers.indexOf('ctrl') >= 0,
        metaKey: options.modifiers.indexOf('meta') >= 0,
        shiftKey: options.modifiers.indexOf('shift') >= 0,
        deltaX: options.wheelDelta.x,
        deltaY: options.wheelDelta.y,
        deltaFactor: 1
      }
    );
    $node.trigger(evt);
  };
  this._connectEvents();
  return this;
};

inherit(geo.mapInteractor, geo.object);
