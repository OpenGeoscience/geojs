var inherit = require('./inherit');
var object = require('./object');

//////////////////////////////////////////////////////////////////////////////
/**
 * The mapInteractor class is responsible for handling raw events from the
 * browser and interpreting them as map navigation interactions.  This class
 * will call the navigation methods on the connected map, which will make
 * modifications to the camera directly.
 *
 * @class geo.mapInteractor
 * @extends geo.object
 * @returns {geo.mapInteractor}
 */
//////////////////////////////////////////////////////////////////////////////
var mapInteractor = function (args) {
  'use strict';
  if (!(this instanceof mapInteractor)) {
    return new mapInteractor(args);
  }
  object.call(this);

  var $ = require('jquery');
  var geo_event = require('./event');
  var throttle = require('./util').throttle;
  var debounce = require('./util').debounce;

  var m_options = args || {},
      m_this = this,
      m_mouse,
      m_keyboard,
      m_state,
      m_queue,
      $node,
      m_selectionLayer = null,
      m_selectionPlane = null,
      m_paused = false,
      m_clickMaybe = false,
      m_callZoom = function () {};

  // Helper method to decide if the current button/modifiers match a set of
  // conditions.
  // button: 'left' | 'right' | 'middle'
  // modifiers: [ 'alt' | 'meta' | 'ctrl' | 'shift' ]
  function eventMatch(button, modifiers) {
    return (button === 'wheel' || m_mouse.buttons[button]) &&
      (!!m_mouse.modifiers.alt) === (!!modifiers.alt) &&
      (!!m_mouse.modifiers.meta) === (!!modifiers.meta) &&
      (!!m_mouse.modifiers.shift) === (!!modifiers.shift) &&
      (!!m_mouse.modifiers.ctrl) === (!!modifiers.ctrl);
  }

  // Helper method to calculate the speed from a velocity
  function calcSpeed(v) {
    var x = v.x, y = v.y;
    return Math.sqrt(x * x + y * y);
  }

  // copy the options object with defaults
  m_options = $.extend(
    true,
    {},
    {
      throttle: 30,
      discreteZoom: false,
      panMoveButton: 'left',
      panMoveModifiers: {},
      zoomMoveButton: 'right',
      zoomMoveModifiers: {},
      rotateMoveButton: 'left',
      rotateMoveModifiers: {'ctrl': true},
      panWheelEnabled: false,
      panWheelModifiers: {},
      zoomWheelEnabled: true,
      zoomWheelModifiers: {},
      rotateWheelEnabled: true,
      rotateWheelModifiers: {'ctrl': true},
      wheelScaleX: 1,
      wheelScaleY: 1,
      zoomScale: 1,
      rotateWheelScale: 6 * Math.PI / 180,
      selectionButton: 'left',
      selectionModifiers: {'shift': true},
      momentum: {
        enabled: true,
        maxSpeed: 2.5,
        minSpeed: 0.01,
        stopTime: 250,
        drag: 0.01,
        actions: ['pan', 'zoom']
      },
      spring: {
        enabled: false,
        springConstant: 0.00005
      },
      click: {
        enabled: true,
        buttons: {left: true, right: true, middle: true},
        duration: 0,
        cancelOnMove: true
      },
      zoomAnimation: {
        enabled: true,
        duration: 500,
        ease: function (t) { return (2 - t) * t; }
      }
    },
    m_options
  );

  // options supported:
  // {
  //   // throttle mouse events to at most this many milliseconds each (default 30)
  //   throttle: number
  //
  //   // Clamp zoom events to discrete (integer) zoom levels.  If a number is
  //   // provided then zoom events will be debounced (and accumulated)
  //   // with the given delay.  The default debounce interval is 400 ms.
  //   discreteZoom: boolean | number > 0
  //
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
  //   // button that must be pressed to initiate a rotate on mousedown
  //   rotateMoveButton: 'right' | 'left' | 'middle'
  //
  //   // modifier keys that must be pressed to initiate a rotate on mousemove
  //   rotateMoveModifiers: { 'ctrl' | 'alt' | 'meta' | 'shift' }
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
  //   // enable or disable rotation with the mouse wheel
  //   rotateWheelEnabled: true | false
  //
  //   // modifier keys that must be pressed to trigger a rotate on wheel
  //   rotateWheelModifiers: {...}
  //
  //   // wheel scale factor to change the magnitude of wheel interactions
  //   wheelScaleX: 1
  //   wheelScaleY: 1
  //
  //   // zoom scale factor to change the magnitude of zoom move interactions
  //   zoomScale: 1
  //
  //   // scale factor to change the magnitude of wheel rotation interactions
  //   rotateWheelScale: 1
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
  //     maxSpeed: number, // don't allow animation to pan faster than this
  //     minSpeed: number, // stop animations if the speed is less than this
  //     stopTime: number, // if the mouse hasn't moved for this many
  //                       // milliseconds, don't apply momentum
  //     drag: number, // drag coefficient
  //     actions: ['pan', 'zoom']  // actions on which to apply momentum
  //   }
  //
  //   // enable spring clamping to screen edges to enforce clamping
  //   spring: {
  //     enabled: true | false,
  //     springConstant: number,
  //   }
  //
  //   // enable animation for both discrete and continuous zoom
  //   zoomAnimation: {
  //     enabled: true | false,
  //     duration: number,  // milliseconds
  //     ease: function     // easing function
  //   }
  //
  //   // enable the "click" event
  //   // A click will be registered when a mouse down is followed
  //   // by a mouse up in less than the given number of milliseconds
  //   // and the standard handler will *not* be called
  //   // If the duration is <= 0, then clicks will only be canceled by
  //   // a mousemove.
  //   click: {
  //     enabled: true | false,
  //     buttons: {'left': true, 'right': true, 'middle': true}
  //     duration: 0,
  //     cancelOnMove: true // cancels click if the mouse is moved before release
  //   }
  // }

  // A bunch of type definitions for api documentation:
  /**
   * General representation of rectangular bounds in world coordinates
   * @typedef geo.geoBounds
   * @type {object}
   * @property {geo.geoPosition} upperLeft Upper left corner
   * @property {geo.geoPosition} upperRight Upper right corner
   * @property {geo.geoPosition} lowerLeft Lower left corner
   * @property {geo.geoPosition} lowerRight Lower right corner
   */

  /**
   * General representation of rectangular bounds in pixel coordinates
   * @typedef geo.screenBounds
   * @type {object}
   * @property {geo.screenPosition} upperLeft Upper left corner
   * @property {geo.screenPosition} upperRight Upper right corner
   * @property {geo.screenPosition} lowerLeft Lower left corner
   * @property {geo.screenPosition} lowerRight Lower right corner
   */

  /**
   * General representation of a point on the screen.
   * @typedef geo.screenPosition
   * @type {object}
   * @property {Number} x Horizontal coordinate in pixels
   * @property {Number} y Vertical coordinate in pixels
   */

  /**
   * General represention of a point on the earth.
   * @typedef geo.geoPosition
   * @type {object}
   * @property {Number} x Horizontal coordinate in degrees longitude
   * @property {Number} y Vertical coordinate in degrees latitude
   */

  /**
   * The status of all mouse buttons.
   * @typedef geo.mouseButtons
   * @type {object}
   * @property {true|false} left The left mouse button
   * @property {true|false} right The right mouse button
   * @property {true|false} middle The middle mouse button
   */

  /**
   * The status of all modifier keys these are copied from the
   * standard DOM events.
   * @typedef geo.modifierKeys
   * @type {object}
   * @property {true|false} alt <code>Event.alt</code>
   * @property {true|false} ctrl <code>Event.ctrl</code>
   * @property {true|false} shift <code>Event.shift</code>
   * @property {true|false} meta <code>Event.meta</code>
   */

  /**
   * Provides information about the state of the mouse
   * @typedef geo.mouseState
   * @type {object}
   * @property {geo.screenPosition} page Mouse location in pixel space
   * @property {geo.geoPosition} map Mouse location in world space
   * @property {geo.mouseButtons} buttons The current state of the mouse buttons
   * @property {geo.modifierKeys} modifiers The current state of all modifier keys
   * @property {Date} time The timestamp the event took place
   * @property {Number} deltaTime The time in milliseconds since the last mouse event
   * @property {geo.screenPosition} velocity The velocity of the mouse pointer
   * in pixels per second
   */

  /**
   * @typedef geo.brushSelection
   * @type {object}
   * @property {geo.screenBounds} display The selection bounds in pixel space
   * @property {geo.geoBounds} gcs The selection bounds in world space
   * @property {geo.mouseState} mouse The current mouse state
   * @property {geo.mouseState} origin The mouse state at the start of the
   * brush action
   */

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
    velocity: {
      x: 0,
      y: 0
    }
  };

  // default keyboard object
  // (keyboard events not implemented yet)
  m_keyboard = {
  };

  // The interactor state determines what actions are taken in response to
  // core browser events.
  //
  // i.e.
  //  {
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
  //    'action': 'rotate',   // an ongoing rotate event
  //    'origin': {...},      // mouse object at the start of the action
  //    'delta': {x: *, y: *} // mouse movement since action start
  //                          // not including the current event
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

  /**
   * Store queued map navigation commands (due to throttling) here
   * {
   *   kind: 'move' | 'wheel',  // what kind of mouse action triggered this
   *   method: function () {},  // the throttled method
   *   scroll: {x: ..., y: ...} // accumulated scroll wheel deltas
   * }
   */
  m_queue = {};

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

    // set methods related to asyncronous event handling
    m_this._handleMouseWheel = throttled_wheel();
    m_callZoom = debounced_zoom();

    // add event handlers
    $node.on('wheel.geojs', m_this._handleMouseWheel);
    $node.on('mousemove.geojs', m_this._handleMouseMove);
    $node.on('mousedown.geojs', m_this._handleMouseDown);
    $node.on('mouseup.geojs', m_this._handleMouseUp);
    // Disable dragging images and such
    $node.on('dragstart', function () { return false; });
    if (m_options.panMoveButton === 'right' ||
        m_options.zoomMoveButton === 'right' ||
        m_options.rotateMoveButton === 'right' ||
        m_options.selectionButton === 'right') {
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
    m_this._handleMouseWheel = function () {};
    m_callZoom = function () {};
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
   * @param {object} opts optional
   * @returns {geo.interactorStyle|object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.options = function (opts) {
    if (opts === undefined) {
      return $.extend({}, m_options);
    }
    $.extend(m_options, opts);

    // reset event handlers for new options
    this._connectEvents();
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
    try {
      m_mouse.geo = m_this.map().displayToGcs(m_mouse.map);
    } catch (e) {
      // catch georeferencing problems and move on
      // needed for handling the map before the base layer
      // is attached
      m_mouse.geo = null;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Stores the current mouse button
   */
  ////////////////////////////////////////////////////////////////////////////
  this._getMouseButton = function (evt) {
    if (evt.which === 1) {
      m_mouse.buttons.left = evt.type !== 'mouseup';
    } else if (evt.which === 3) {
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
   * @returns {object}
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

    m_selectionPlane.origin([
      display.lowerLeft.x,
      display.lowerLeft.y,
      0
    ]);
    m_selectionPlane.upperLeft([
      display.upperLeft.x,
      display.upperLeft.y,
      0
    ]);
    m_selectionPlane.lowerRight([
      display.lowerRight.x,
      display.lowerRight.y,
      0
    ]);
    m_selectionPlane.draw();

    return {
      display: display,
      gcs: gcs,
      mouse: mouse,
      origin: $.extend({}, m_state.origin)
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Immediately cancel an ongoing action.
   *
   * @param {string?} action The action type, if null cancel any action
   * @param {bool} keepQueue If truthy, keep the queue event if an action is
   *                         canceled.
   * @returns {bool} If an action was canceled
   */
  ////////////////////////////////////////////////////////////////////////////
  this.cancel = function (action, keepQueue) {
    var out;
    if (!action) {
      out = !!m_state.action;
    } else {
      out = m_state.action === action;
    }
    if (out) {
      // cancel any queued interaction events
      if (!keepQueue) {
        m_queue = {};
      }
      m_state = {};
    }
    return out;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when a mouse button is pressed
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseDown = function (evt) {
    var action = null;

    if (m_paused) {
      return;
    }

    m_this._getMousePosition(evt);
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    if (m_options.click.enabled &&
        (!m_mouse.buttons.left || m_options.click.buttons.left) &&
        (!m_mouse.buttons.right || m_options.click.buttons.right) &&
        (!m_mouse.buttons.middle || m_options.click.buttons.middle)) {
      m_clickMaybe = true;
      if (m_options.click.duration > 0) {
        window.setTimeout(function () {
          m_clickMaybe = false;
        }, m_options.click.duration);
      }
    }
    if (eventMatch(m_options.panMoveButton, m_options.panMoveModifiers)) {
      action = 'pan';
    } else if (eventMatch(m_options.zoomMoveButton, m_options.zoomMoveModifiers)) {
      action = 'zoom';
    } else if (eventMatch(m_options.rotateMoveButton, m_options.rotateMoveModifiers)) {
      action = 'rotate';
    } else if (eventMatch(m_options.selectionButton, m_options.selectionModifiers)) {
      action = 'select';
    }

    // cancel transitions and momentum on click
    m_this.map().transitionCancel('_handleMouseDown.' + action);
    m_this.cancel('momentum');

    m_mouse.velocity = {
      x: 0,
      y: 0
    };

    if (action) {
      // cancel any ongoing interaction queue
      m_queue = {
        kind: 'move'
      };

      // store the state object
      m_state = {
        action: action,
        origin: $.extend(true, {}, m_mouse),
        delta: {x: 0, y: 0}
      };

      if (action === 'select') {
        // Make sure the old selection layer is gone.
        if (m_selectionLayer) {
          m_selectionLayer.clear();
          m_this.map().deleteLayer(m_selectionLayer);
          m_selectionLayer = null;
        }
        // Create a feature layer and plane feature to show the selection bounds
        m_selectionLayer = m_this.map().createLayer('feature', {renderer: 'd3'});
        m_selectionPlane = m_selectionLayer.createFeature('plane');
        m_selectionPlane.style({
          screenCoordinates: true,
          fillOpacity: function () { return 0.25; }
        });
        m_this.map().geoTrigger(geo_event.brushstart, m_this._getSelection());
      }

      // bind temporary handlers to document
      if (m_options.throttle > 0) {
        $(document).on(
          'mousemove.geojs',
          throttle(
            m_options.throttle,
            m_this._handleMouseMoveDocument
          )
        );
      } else {
        $(document).on('mousemove.geojs', m_this._handleMouseMoveDocument);
      }
      $(document).on('mouseup.geojs', m_this._handleMouseUpDocument);
    }

  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseMove = function (evt) {

    if (m_paused) {
      return;
    }

    if (m_state.action) {
      // If currently performing a navigation action, the mouse
      // coordinates will be captured by the document handler.
      return;
    }

    if (m_options.click.cancelOnMove) {
      m_clickMaybe = false;
    }

    m_this._getMousePosition(evt);
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    if (m_clickMaybe) {
      return;
    }

    m_this.map().geoTrigger(geo_event.mousemove, m_this.mouse());
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event on the document (temporary bindings)
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseMoveDocument = function (evt) {
    var dx, dy, selectionObj;

    // If the map has been disconnected, we do nothing.
    if (!m_this.map()) {
      return;
    }

    if (m_paused || m_queue.kind !== 'move') {
      return;
    }

    m_this._getMousePosition(evt);
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    if (m_options.click.cancelOnMove) {
      m_clickMaybe = false;
    }
    if (m_clickMaybe) {
      return;
    }

    if (!m_state.action) {
      // This shouldn't happen
      console.log('WARNING: Invalid state in mapInteractor.');
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
      m_callZoom(-dy * m_options.zoomScale / 120, m_state);
    } else if (m_state.action === 'rotate') {
      var cx, cy;
      if (m_state.origin.rotation === undefined) {
        cx = m_state.origin.map.x - m_this.map().size().width / 2;
        cy = m_state.origin.map.y - m_this.map().size().height / 2;
        m_state.origin.rotation = m_this.map().rotation() - Math.atan2(cy, cx);
      }
      cx = m_mouse.map.x - m_this.map().size().width / 2;
      cy = m_mouse.map.y - m_this.map().size().height / 2;
      m_this.map().rotation(m_state.origin.rotation + Math.atan2(cy, cx));
    } else if (m_state.action === 'select') {
      // Get the bounds of the current selection
      selectionObj = m_this._getSelection();
      m_this.map().geoTrigger(geo_event.brush, selectionObj);
    }

    // Prevent default to stop text selection in particular
    evt.preventDefault();
  };

  /**
   * Use interactor options to modify the mouse velocity by momentum
   * or spring equations depending on the current map state.
   * @private
   * @param {object} v Current velocity in pixels / ms
   * @param {number} deltaT The time delta
   * @returns {object} New velocity
   */
  function modifyVelocity(v, deltaT) {
    deltaT = deltaT <= 0 ? 30 : deltaT;
    var sf = springForce();
    var speed = calcSpeed(v);
    var vx = v.x / speed;
    var vy = v.y / speed;

    speed = speed * Math.exp(-m_options.momentum.drag * deltaT);

    // |force| + |velocity| < c <- stopping condition
    if (calcSpeed(sf) * deltaT + speed < m_options.momentum.minSpeed) {
      return null;
    }

    if (speed > 0) {
      vx = vx * speed;
      vy = vy * speed;
    } else {
      vx = 0;
      vy = 0;
    }

    return {
      x: vx - sf.x * deltaT,
      y: vy - sf.y * deltaT
    };
  }

  /**
   * Get the spring force for the current map bounds
   * @private
   * @returns {object} The spring force
   */
  function springForce() {
    var xplus,  // force to the right
        xminus, // force to the left
        yplus,  // force to the top
        yminus; // force to the bottom

    if (!m_options.spring.enabled) {
      return {x: 0, y: 0};
    }
    // get screen coordinates of corners
    var maxBounds = m_this.map().maxBounds(undefined, null);
    var ul = m_this.map().gcsToDisplay({
      x: maxBounds.left,
      y: maxBounds.top
    }, null);
    var lr = m_this.map().gcsToDisplay({
      x: maxBounds.right,
      y: maxBounds.bottom
    }, null);

    var c = m_options.spring.springConstant;
    // Arg... map needs to expose the canvas size
    var width = m_this.map().node().width();
    var height = m_this.map().node().height();

    xplus = c * Math.max(0, ul.x);
    xminus = c * Math.max(0, width - lr.x);
    yplus = c * Math.max(0, ul.y) / 2;
    yminus = c * Math.max(0, height - lr.y) / 2;

    return {
      x: xplus - xminus,
      y: yplus - yminus
    };
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when a mouse button is unpressed on the document.
   * Removes temporary bindings.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseUpDocument = function (evt) {
    var selectionObj, oldAction;

    if (m_paused) {
      return;
    }

    // cancel queued interactions
    m_queue = {};

    m_clickMaybe = false;
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    // unbind temporary handlers on document
    $(document).off('.geojs');

    if (m_mouse.buttons.right) {
      evt.preventDefault();
    }

    if (m_state.action === 'select') {
      selectionObj = m_this._getSelection();

      m_selectionLayer.clear();
      m_this.map().deleteLayer(m_selectionLayer);
      m_selectionLayer = null;
      m_selectionPlane = null;

      m_this.map().geoTrigger(geo_event.brushend, selectionObj);
    }

    // reset the interactor state
    oldAction = m_state.action;
    m_state = {};

    // if momentum is enabled, start the action here
    if (m_options.momentum.enabled &&
            $.inArray(oldAction, m_options.momentum.actions) >= 0) {

      var t = (new Date()).valueOf();
      var dt = t - m_mouse.time + m_mouse.deltaTime;
      if (t - m_mouse.time < m_options.momentum.stopTime) {
        m_mouse.velocity.x = m_mouse.velocity.x * m_mouse.deltaTime / dt;
        m_mouse.velocity.y = m_mouse.velocity.y * m_mouse.deltaTime / dt;
        m_mouse.deltaTime = dt;
      } else {
        m_mouse.velocity.x = m_mouse.velocity.y = 0;
      }
      m_this.springBack(true, oldAction);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when a mouse button is unpressed
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseUp = function (evt) {

    if (m_paused) {
      return;
    }

    if (m_clickMaybe) {
      m_this._handleMouseClick(evt);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when a mouse click is detected.  A mouse click is a simulated
   * event that occurs when the time between a mouse down and mouse up
   * is less than the configured duration and (optionally) if no mousemove
   * events were triggered in the interim.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseClick = function (evt) {

    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    // cancel any ongoing pan action
    m_this.cancel('pan');

    // unbind temporary handlers on document
    $(document).off('.geojs');

    // reset click detector variable
    m_clickMaybe = false;

    // fire a click event
    m_this.map().geoTrigger(geo_event.mouseclick, m_this.mouse());
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private wrapper around the map zoom method that is debounced to support
   * discrete zoom interactions.
   * @param {number} deltaZ The zoom increment
   */
  ////////////////////////////////////////////////////////////////////////////
  function debounced_zoom() {
    var deltaZ = 0, delay = 400, direction, startZoom, targetZoom;

    function accum(dz, dir) {
      var map = m_this.map(), zoom;

      direction = dir;
      deltaZ += dz;
      if (targetZoom === undefined) {
        startZoom = targetZoom = map.zoom();
      }
      targetZoom += dz;

      // Respond to debounced events when they add up to a change in the
      // discrete zoom level.
      if (map && Math.abs(deltaZ) >= 1 && m_options.discreteZoom &&
            !m_options.zoomAnimation.enabled) {

        zoom = Math.round(deltaZ + map.zoom());

        // delta is what is left over from the zoom delta after the new zoom
        // value
        deltaZ = deltaZ + map.zoom() - zoom;

        map.zoom(zoom, direction);
      }

    }

    function apply() {
      var map = m_this.map(), zoom;
      if (map) {
        if (m_options.zoomAnimation.enabled) {
          zoom = targetZoom;
          if (m_options.discreteZoom) {
            zoom = Math.round(zoom);
            if (zoom === startZoom && targetZoom !== startZoom) {
              zoom = startZoom + (targetZoom > startZoom ? 1 : -1);
            }
          }
          map.transitionCancel('debounced_zoom.zoom');
          map.transition({
            zoom: zoom,
            zoomOrigin: direction,
            duration: m_options.zoomAnimation.duration,
            ease: m_options.zoomAnimation.ease,
            done: function (status) {
              status = status || {};
              if (!status.next && (!status.cancel ||
                  ('' + status.source).search(/\.zoom$/) < 0)) {
                targetZoom = undefined;
              }
              /* If we were animating the zoom, if the zoom is continuous, just
               * stop where we are.  If using discrete zoom, we need to make
               * sure we end up discrete.  However, we don't want to do that if
               * the next action is further zooming. */
              if (m_options.discreteZoom && status.cancel &&
                  status.transition && status.transition.end &&
                  ('' + status.source).search(/\.zoom$/) < 0) {
                map.zoom(status.transition.end.zoom,
                         status.transition.end.zoomOrigin);
              }
            }
          });
        } else {
          zoom = deltaZ + map.zoom();
          if (m_options.discreteZoom) {
            // round off the zoom to an integer and throw away the rest
            zoom = Math.round(zoom);
          }
          map.zoom(zoom, direction);
        }
      }
      deltaZ = 0;
    }

    if (m_options.discreteZoom !== true && m_options.discreteZoom > 0) {
      delay = m_options.discreteZoom;
    }
    if ((m_options.discreteZoom === true || m_options.discreteZoom > 0) &&
            !m_options.zoomAnimation.enabled) {
      return debounce(delay, false, apply, accum);
    } else {
      return function (dz, dir) {
        if (!dz && targetZoom === undefined) {
          return;
        }
        accum(dz, dir);
        apply(dz, dir);
      };
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Attaches wrapped methods for accumulating fast mouse wheel events and
   * throttling map interactions.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function throttled_wheel() {
    var my_queue = {};

    function accum(evt) {
      var dx, dy;

      if (m_paused) {
        return;
      }

      if (my_queue !== m_queue) {
        my_queue = {
          kind: 'wheel',
          scroll: {x: 0, y: 0}
        };
        m_queue = my_queue;
      }

      evt.preventDefault();

      // try to normalize deltas using the wheel event standard:
      //   https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent
      evt.deltaFactor = 1;
      if (evt.originalEvent.deltaMode === 1) {
        // DOM_DELTA_LINE -- estimate line height
        evt.deltaFactor = 40;
      } else if (evt.originalEvent.deltaMode === 2) {
        // DOM_DELTA_PAGE -- get window height
        evt.deltaFactor = $(window).height();
      }

      // prevent NaN's on legacy browsers
      dx = evt.originalEvent.deltaX || 0;
      dy = evt.originalEvent.deltaY || 0;

      // scale according to the options
      dx = dx * m_options.wheelScaleX * evt.deltaFactor / 120;
      dy = dy * m_options.wheelScaleY * evt.deltaFactor / 120;

      my_queue.scroll.x += dx;
      my_queue.scroll.y += dy;
    }

    function wheel(evt) {
      var zoomFactor, action;

      // If the current queue doesn't match the queue passed in as an argument,
      // assume it was cancelled and do nothing.
      if (my_queue !== m_queue) {
        return;
      }

      // perform the map navigation event
      m_this._getMouseModifiers(evt);
      if (m_options.panWheelEnabled &&
          eventMatch('wheel', m_options.panWheelModifiers)) {
        action = 'pan';
      } else if (m_options.zoomWheelEnabled &&
                 eventMatch('wheel', m_options.zoomWheelModifiers)) {
        action = 'zoom';
      } else if (m_options.rotateWheelEnabled &&
                 eventMatch('wheel', m_options.rotateWheelModifiers)) {
        action = 'rotate';
      }
      if (action) {
        // if we were moving because of momentum or a transition, cancel it and
        // recompute where the mouse action is occuring.
        var recompute = m_this.map().transitionCancel('wheel.' + action);
        recompute |= m_this.cancel('momentum', true);
        if (recompute) {
          m_mouse.geo = m_this.map().displayToGcs(m_mouse.map);
        }
        switch (action) {
          case 'pan':
            m_this.map().pan({
              x: m_queue.scroll.x,
              y: m_queue.scroll.y
            });
            break;
          case 'zoom':
            zoomFactor = -m_queue.scroll.y;
            m_callZoom(zoomFactor, m_mouse);
            break;
          case 'rotate':
            m_this.map().rotation(
                m_this.map().rotation() +
                m_queue.scroll.y * m_options.rotateWheelScale,
                m_mouse);
            break;
        }
      }

      // reset the queue
      m_queue = {};
    }

    if (m_options.throttle > 0) {
      return throttle(m_options.throttle, false, wheel, accum);
    } else {
      return function (evt) {
        accum(evt);
        wheel(evt);
      };
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse wheel event.  (Defined inside _connectEvents).
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseWheel = function () {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Start up a spring back action when the map bounds are out of range.
   * Not to be user callable.
   * @todo Move this and momentum handling to the map class
   * @protected
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.springBack = function (initialVelocity, origAction) {
    if (m_state.action === 'momentum') {
      return;
    }
    if (!initialVelocity) {
      m_mouse.velocity = {
        x: 0,
        y: 0
      };
    }
    m_state.origAction = origAction;
    m_state.action = 'momentum';
    m_state.origin = m_this.mouse();
    m_state.start = new Date();
    m_state.handler = function () {
      var v, s, last, dt;

      // Not sure the correct way to do this.  We need the delta t for the
      // next time step...  Maybe use a better interpolator and the time
      // parameter from requestAnimationFrame.
      dt = Math.min(m_mouse.deltaTime, 30);
      if (m_state.action !== 'momentum' ||
          !m_this.map() ||
          m_this.map().transition()) {
        // cancel if a new action was performed
        return;
      }

      last = m_state.start.valueOf();
      m_state.start = new Date();

      v = modifyVelocity(m_mouse.velocity, m_state.start - last);

      // stop panning when the speed is below the threshold
      if (!v) {
        m_state = {};
        return;
      }

      s = calcSpeed(v);
      if (s > m_options.momentum.maxSpeed) {
        s = m_options.momentum.maxSpeed / s;
        v.x = v.x * s;
        v.y = v.y * s;
      }

      if (!isFinite(v.x) || !isFinite(v.y)) {
        v.x = 0;
        v.y = 0;
      }
      m_mouse.velocity.x = v.x;
      m_mouse.velocity.y = v.y;

      switch (m_state.origAction) {
        case 'zoom':
          var dy = m_mouse.velocity.y * dt;
          m_callZoom(-dy * m_options.zoomScale / 120, m_state);
          break;
        default:
          m_this.map().pan({
            x: m_mouse.velocity.x * dt,
            y: m_mouse.velocity.y * dt
          });
          break;
      }

      if (m_state.handler) {
        window.requestAnimationFrame(m_state.handler);
      }
    };
    if (m_state.handler) {
      window.requestAnimationFrame(m_state.handler);
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
   * Get or set the pause state of the interactor, which
   * ignores all native mouse and keyboard events.
   *
   * @param {bool} [value] The pause state to set or undefined to return the
   *                        current state.
   * @returns {bool|this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pause = function (value) {
    if (value === undefined) {
      return m_paused;
    }
    m_paused = !!value;
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Simulate a DOM mouse event on connected map.
   *
   * The options for creating the events are as follows, not all
   * options are required for every event type. ::
   *
   *   options = {
   *     page: {x, y} // position on the page
   *     map: {x, y}  // position on the map (overrides page)
   *     button: 'left' | 'right' | 'middle'
   *     modifiers: [ 'alt' | 'ctrl' | 'meta' | 'shift' ]
   *     wheelDelta: {x, y}
   *   }
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
        originalEvent: {
          deltaX: options.wheelDelta.x,
          deltaY: options.wheelDelta.y,
          deltaMode: options.wheelMode,
          preventDefault: function () {},
          stopPropagation: function () {},
          stopImmediatePropagation: function () {}
        }
      }
    );
    $node.trigger(evt);
  };
  this._connectEvents();
  return this;
};

inherit(mapInteractor, object);
module.exports = mapInteractor;
