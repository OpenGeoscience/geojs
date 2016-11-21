var inherit = require('./inherit');
var object = require('./object');
var util = require('./util');

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
  var geo_action = require('./action');
  var throttle = require('./util').throttle;
  var debounce = require('./util').debounce;
  var actionMatch = require('./util').actionMatch;
  var quadFeature = require('./quadFeature');

  var m_options = args || {},
      m_this = this,
      m_mouse,
      m_keyboard,
      m_state,
      m_queue,
      $node,
      m_selectionLayer = null,
      m_selectionQuad,
      m_paused = false,
      // if m_clickMaybe is not false, it contains the x, y, and buttons that
      // were present when the mouse down event occurred.
      m_clickMaybe = false,
      m_clickMaybeTimeout,
      m_callZoom = function () {};

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

      /* There should only be one action with any specific combination of event
       * and modifiers.  When that event and modifiers occur, the specified
       * action is triggered.  The event and modifiers fields can either be a
       * simple string or an object with multiple entries with each entry set
       * to true, false, or undefined.  If an object, all values that are
       * truthy must match, all values that are false must not match, and all
       * other values that are falsy are ignored.
       *   Available actions:
       * see geo_action list
       *   Available events:
       * left, right, middle, wheel
       *   Available modifiers:
       * shift, ctrl, alt, meta
       *   Useful fields:
       * action: the name of the action.  Multiple events may trigger the same
       *    action.
       * input: the name of the input or an object with input names for keys
       *    and boolean values that indicates the combination of events that
       *    trigger this action.
       * modifiers: the name of a modifier or an object with modifier names for
       *    keys and boolean values that indicates the combination of modifiers
       *    that trigger this action.
       * selectionRectangle: truthy if a selection rectangle should be shown
       *    during the action.  This can be the name of an event that will be
       *    triggered when the selection is complete.
       * name: a string that can be used to reference this action.
       * owner: a string that can be used to reference this action.
       */
      actions: [{
        action: geo_action.pan,
        input: 'left',
        modifiers: {shift: false, ctrl: false},
        owner: 'geo.mapInteractor',
        name: 'button pan'
      }, {
        action: geo_action.zoom,
        input: 'right',
        modifiers: {shift: false, ctrl: false},
        owner: 'geo.mapInteractor',
        name: 'button zoom'
      }, {
        action: geo_action.zoom,
        input: 'wheel',
        modifiers: {shift: false, ctrl: false},
        owner: 'geo.mapInteractor',
        name: 'wheel zoom'
      }, {
        action: geo_action.rotate,
        input: 'left',
        modifiers: {shift: false, ctrl: true},
        owner: 'geo.mapInteractor',
        name: 'button rotate'
      }, {
        action: geo_action.rotate,
        input: 'wheel',
        modifiers: {shift: false, ctrl: true},
        owner: 'geo.mapInteractor',
        name: 'wheel rotate'
      }, {
        action: geo_action.select,
        input: 'left',
        modifiers: {shift: true, ctrl: true},
        selectionRectangle: geo_event.select,
        owner: 'geo.mapInteractor',
        name: 'drag select'
      }, {
        action: geo_action.zoomselect,
        input: 'left',
        modifiers: {shift: true, ctrl: false},
        selectionRectangle: geo_event.zoomselect,
        owner: 'geo.mapInteractor',
        name: 'drag zoom'
      }, {
        action: geo_action.unzoomselect,
        input: 'right',
        modifiers: {shift: true, ctrl: false},
        selectionRectangle: geo_event.unzoomselect,
        owner: 'geo.mapInteractor',
        name: 'drag unzoom'
      }],

      click: {
        enabled: true,
        buttons: {left: true, right: true, middle: true},
        duration: 0,
        cancelOnMove: true
      },

      wheelScaleX: 1,
      wheelScaleY: 1,
      zoomScale: 1,
      rotateWheelScale: 6 * Math.PI / 180,
      momentum: {
        enabled: true,
        maxSpeed: 2.5,
        minSpeed: 0.01,
        stopTime: 250,
        drag: 0.01,
        actions: [geo_action.pan, geo_action.zoom]
      },
      spring: {
        enabled: false,
        springConstant: 0.00005
      },
      zoomAnimation: {
        enabled: true,
        duration: 500,
        ease: function (t) { return (2 - t) * t; }
      }
    },
    m_options
  );
  /* We don't want to merge the original arrays array with a array passed in
   * the args, so override that as necessary for actions. */
  if (args && args.actions) {
    m_options.actions = $.extend(true, [], args.actions);
  }
  if (args && args.momentum && args.momentum.actions) {
    m_options.momentum.actions = $.extend(true, [], args.momentum.actions);
  }

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
  //   // A list of available actions.  See above
  //   actions: []
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
  //   // enable momentum when panning
  //   momentum: {
  //     enabled: true | false,
  //     maxSpeed: number, // don't allow animation to pan faster than this
  //     minSpeed: number, // stop animations if the speed is less than this
  //     stopTime: number, // if the mouse hasn't moved for this many
  //                       // milliseconds, don't apply momentum
  //     drag: number, // drag coefficient
  //     actions: [geo_action.pan, geo_action.zoom]
  //                                      // actions on which to apply momentum
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
  //     buttons: {left: true, right: true, middle: true}
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
  //    'action': geo_action.pan,   // an ongoing pan event
  //    'origin': {...},      // mouse object at the start of the action
  //    'delta': {x: *, y: *} // mouse movement since action start
  //                          // not including the current event
  //  }
  //
  //  {
  //    'action': geo_action.zoom,  // an ongoing zoom event
  //    ...
  //  }
  //
  //  {
  //    'action': geo_action.rotate,  // an ongoing rotate event
  //    'origin': {...},      // mouse object at the start of the action
  //    'delta': {x: *, y: *} // mouse movement since action start
  //                          // not including the current event
  //  }
  //
  //  {
  //    'acton': geo_action.select,
  //    'origin': {...},
  //    'delta': {x: *, y: *}
  //  }
  //
  //  {
  //    'action': geo_action.momentum,
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
    util.adjustActions(m_options.actions);
    if (m_options.actions.some(function (action) {
      return action.input.right;
    })) {
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
      m_mouse.mapgcs = m_this.map().displayToGcs(m_mouse.map, null);
    } catch (e) {
      // catch georeferencing problems and move on
      // needed for handling the map before the base layer
      // is attached
      m_mouse.geo = m_mouse.mapgcs = null;
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
    gcs.upperLeft = map.displayToGcs(display.upperLeft, null);
    gcs.lowerRight = map.displayToGcs(display.lowerRight, null);
    gcs.upperRight = map.displayToGcs(display.upperRight, null);
    gcs.lowerLeft = map.displayToGcs(display.lowerLeft, null);

    m_selectionQuad.data([{
      ul: gcs.upperLeft,
      ur: gcs.upperRight,
      ll: gcs.lowerLeft,
      lr: gcs.lowerRight
    }]);
    m_selectionQuad.draw();

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
      clearState();
    }
    return out;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set the value of whether a click is possible.  Cancel any outstanding
   * timer for this process.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._setClickMaybe = function (value) {
    m_clickMaybe = value;
    if (m_clickMaybeTimeout) {
      window.clearTimeout(m_clickMaybeTimeout);
      m_clickMaybeTimeout = null;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when a mouse button is pressed
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseDown = function (evt) {
    var action, actionRecord;

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
      m_this._setClickMaybe({
        x: m_mouse.page.x,
        y: m_mouse.page.y,
        buttons: $.extend({}, m_mouse.buttons)
      });
      if (m_options.click.duration > 0) {
        m_clickMaybeTimeout = window.setTimeout(function () {
          m_clickMaybe = false;
          m_clickMaybeTimeout = null;
        }, m_options.click.duration);
      }
    }
    actionRecord = actionMatch(m_mouse.buttons, m_mouse.modifiers,
                              m_options.actions);
    action = (actionRecord || {}).action;

    // cancel transitions and momentum on click
    m_this.map().transitionCancel(
        '_handleMouseDown' + (action ? '.' + action : ''));
    m_this.cancel(geo_action.momentum);

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
        actionRecord: actionRecord,
        origin: $.extend(true, {}, m_mouse),
        delta: {x: 0, y: 0}
      };

      if (actionRecord.selectionRectangle) {
        // Make sure the old selection layer is gone.
        if (m_selectionLayer) {
          m_selectionLayer.clear();
          m_this.map().deleteLayer(m_selectionLayer);
          m_selectionLayer = null;
        }
        m_selectionLayer = m_this.map().createLayer(
          'feature', {features: [quadFeature.capabilities.color]});
        m_selectionQuad = m_selectionLayer.createFeature(
          'quad', {gcs: m_this.map().gcs()});
        m_selectionQuad.style({
          opacity: 0.25,
          color: {r: 0.3, g: 0.3, b: 0.3}
        });
        m_this.map().geoTrigger(geo_event.brushstart, m_this._getSelection());
      }
      m_this.map().geoTrigger(geo_event.actiondown, {
        state: m_this.state(), mouse: m_this.mouse(), event: evt});

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
      m_state.boundDocumentHandlers = true;
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

    if (m_state.boundDocumentHandlers) {
      // If currently performing a navigation action, the mouse
      // coordinates will be captured by the document handler.
      return;
    }

    if (m_options.click.cancelOnMove && m_clickMaybe) {
      m_this._setClickMaybe(false);
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

    /* Only cancel possible clicks on move if we actually moved */
    if (m_options.click.cancelOnMove && (m_clickMaybe.x === undefined ||
        m_mouse.page.x !== m_clickMaybe.x ||
        m_mouse.page.y !== m_clickMaybe.y)) {
      m_this._setClickMaybe(false);
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

    if (m_state.action === geo_action.pan) {
      m_this.map().pan({x: dx, y: dy}, undefined, 'limited');
    } else if (m_state.action === geo_action.zoom) {
      m_callZoom(-dy * m_options.zoomScale / 120, m_state);
    } else if (m_state.action === geo_action.rotate) {
      var cx, cy;
      if (m_state.origin.rotation === undefined) {
        cx = m_state.origin.map.x - m_this.map().size().width / 2;
        cy = m_state.origin.map.y - m_this.map().size().height / 2;
        m_state.origin.rotation = m_this.map().rotation() - Math.atan2(cy, cx);
      }
      cx = m_mouse.map.x - m_this.map().size().width / 2;
      cy = m_mouse.map.y - m_this.map().size().height / 2;
      m_this.map().rotation(m_state.origin.rotation + Math.atan2(cy, cx));
    } else if (m_state.actionRecord.selectionRectangle) {
      // Get the bounds of the current selection
      selectionObj = m_this._getSelection();
      m_this.map().geoTrigger(geo_event.brush, selectionObj);
    }
    m_this.map().geoTrigger(geo_event.actionmove, {
      state: m_this.state(), mouse: m_this.mouse(), event: evt});

    // Prevent default to stop text selection in particular
    evt.preventDefault();
  };

  /**
   * Clear the action state, but remember if we have bound document handlers.
   * @private
   */
  function clearState() {
    m_state = {boundDocumentHandlers: m_state.boundDocumentHandlers};
  }

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
   * Based on the screen coodinates of a selection, zoom or unzoom and
   * recenter.
   *
   * @private
   * @param {string} action Either geo_action.zoomselect or
   *    geo_action.unzoomselect.
   * @param {object} lowerLeft the x and y coordinates of the lower left corner
   *    of the zoom rectangle.
   * @param {object} upperRight the x and y coordinates of the upper right
   *    corner of the zoom rectangle.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._zoomFromSelection = function (action, lowerLeft, upperRight) {
    if (action !== geo_action.zoomselect && action !== geo_action.unzoomselect) {
      return;
    }
    if (lowerLeft.x === upperRight.x || lowerLeft.y === upperRight.y) {
      return;
    }
    var zoom, center,
        map = m_this.map(),
        mapsize = map.size();
    /* To arbitrarily handle rotation and projection, we center the map at the
     * central coordinate of the selection and set the zoom level such that the
     * four corners are just barely on the map.  When unzooming (zooming out),
     * we ensure that the previous view is centered in the selection but use
     * the maximal size for the zoom factor. */
    var scaling = {
      x: Math.abs((upperRight.x - lowerLeft.x) / mapsize.width),
      y: Math.abs((upperRight.y - lowerLeft.y) / mapsize.height)
    };
    if (action === geo_action.zoomselect) {
      center = map.displayToGcs({
        x: (lowerLeft.x + upperRight.x) / 2,
        y: (lowerLeft.y + upperRight.y) / 2
      }, null);
      zoom = map.zoom() - Math.log2(Math.max(scaling.x, scaling.y));
    } else {  /* unzoom */
      /* To make the existing visible map entirely within the selection
       * rectangle, this would be changed to Math.min instead of Math.max of
       * the scaling factors.  This felt wrong, though. */
      zoom = map.zoom() + Math.log2(Math.max(scaling.x, scaling.y));
      /* Record the current center.  Later, this is panned to the center of the
       * selection rectangle. */
      center = map.center(undefined, null);
    }
    /* When discrete zoom is enable, always round down.  We have to do this
     * explicitly, as otherwise we may zoom too far and the selection will not
     * be completely visible. */
    if (map.discreteZoom()) {
      zoom = Math.floor(zoom);
    }
    map.zoom(zoom);
    if (action === geo_action.zoomselect) {
      map.center(center, null);
    } else {
      var newcenter = map.gcsToDisplay(center, null);
      map.pan({
        x: (lowerLeft.x + upperRight.x) / 2 - newcenter.x,
        y: (lowerLeft.y + upperRight.y) / 2 - newcenter.y
      });
    }
  };

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

    m_this._setClickMaybe(false);
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    // unbind temporary handlers on document
    $(document).off('.geojs');
    m_state.boundDocumentHandlers = false;

    if (m_mouse.buttons.right) {
      evt.preventDefault();
    }

    if (m_state.actionRecord && m_state.actionRecord.selectionRectangle) {
      m_this._getMousePosition(evt);
      selectionObj = m_this._getSelection();

      m_selectionLayer.clear();
      m_this.map().deleteLayer(m_selectionLayer);
      m_selectionLayer = null;
      m_selectionQuad = null;

      m_this.map().geoTrigger(geo_event.brushend, selectionObj);
      if (m_state.actionRecord.selectionRectangle !== true) {
        m_this.map().geoTrigger(m_state.actionRecord.selectionRectangle,
                                selectionObj);
      }
      m_this._zoomFromSelection(m_state.action, selectionObj.display.lowerLeft,
                                selectionObj.display.upperRight);
      m_this.map().geoTrigger(geo_event.actionselection, {
        state: m_this.state(), mouse: m_this.mouse(), event: evt,
        lowerLeft: selectionObj.display.lowerLeft,
        upperRight: selectionObj.display.upperRight});
    }
    m_this.map().geoTrigger(geo_event.actionup, {
      state: m_this.state(), mouse: m_this.mouse(), event: evt});

    // reset the interactor state
    oldAction = m_state.action;
    clearState();

    // if momentum is enabled, start the action here
    if (m_options.momentum.enabled &&
            $.inArray(oldAction, m_options.momentum.actions) >= 0) {
      var t = (new Date()).valueOf();
      var dt = t - m_mouse.time + m_mouse.deltaTime;
      if (t - m_mouse.time < m_options.momentum.stopTime) {
        m_mouse.velocity.x *= m_mouse.deltaTime / dt;
        m_mouse.velocity.y *= m_mouse.deltaTime / dt;
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

    m_this._getMouseButton(evt);

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

    /* Cancel a selection if it is occurring */
    if (m_state.actionRecord && m_state.actionRecord.selectionRectangle) {
      m_selectionLayer.clear();
      m_this.map().deleteLayer(m_selectionLayer);
      m_selectionLayer = null;
      m_selectionQuad = null;
      m_state.action = m_state.actionRecord = null;
    }
    m_this._getMouseButton(evt);
    m_this._getMouseModifiers(evt);

    // cancel any ongoing pan action
    m_this.cancel(geo_action.pan);

    // unbind temporary handlers on document
    $(document).off('.geojs');
    m_state.boundDocumentHandlers = false;
    // add information about the button state to the event information
    var details = m_this.mouse();
    details.buttonsDown = m_clickMaybe.buttons;

    // reset click detector variable
    m_this._setClickMaybe(false);
    // fire a click event
    m_this.map().geoTrigger(geo_event.mouseclick, details);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private wrapper around the map zoom method that is debounced to support
   * discrete zoom interactions.
   * @param {number} deltaZ The zoom increment
   */
  ////////////////////////////////////////////////////////////////////////////
  function debounced_zoom() {
    var deltaZ = 0, delay = 400, origin, startZoom, targetZoom;

    function accum(dz, org) {
      var map = m_this.map(), zoom;

      origin = $.extend(true, {}, org);
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

        map.zoom(zoom, origin);
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
          map.transitionCancel('debounced_zoom.' + geo_action.zoom);
          map.transition({
            zoom: zoom,
            zoomOrigin: origin,
            duration: m_options.zoomAnimation.duration,
            ease: m_options.zoomAnimation.ease,
            done: function (status) {
              status = status || {};
              var zoomRE = new RegExp('\\.' + geo_action.zoom + '$');
              if (!status.next && (!status.cancel ||
                  ('' + status.source).search(zoomRE) < 0)) {
                targetZoom = undefined;
              }
              /* If we were animating the zoom, if the zoom is continuous, just
               * stop where we are.  If using discrete zoom, we need to make
               * sure we end up discrete.  However, we don't want to do that if
               * the next action is further zooming. */
              if (m_options.discreteZoom && status.cancel &&
                  status.transition && status.transition.end &&
                  ('' + status.source).search(zoomRE) < 0) {
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
          map.zoom(zoom, origin);
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
      return function (dz, org) {
        if (!dz && targetZoom === undefined) {
          return;
        }
        accum(dz, org);
        apply(dz, org);
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
      var zoomFactor, action, actionRecord;

      // If the current queue doesn't match the queue passed in as an argument,
      // assume it was cancelled and do nothing.
      if (my_queue !== m_queue) {
        return;
      }

      // perform the map navigation event
      m_this._getMouseModifiers(evt);

      actionRecord = actionMatch({wheel: true}, m_mouse.modifiers,
                                m_options.actions);
      action = (actionRecord || {}).action;

      if (action) {
        // if we were moving because of momentum or a transition, cancel it and
        // recompute where the mouse action is occuring.
        var recompute = m_this.map().transitionCancel('wheel.' + action);
        recompute |= m_this.cancel(geo_action.momentum, true);
        if (recompute) {
          m_mouse.geo = m_this.map().displayToGcs(m_mouse.map);
          m_mouse.mapgcs = m_this.map().displayToGcs(m_mouse.map, null);
        }
        switch (action) {
          case geo_action.pan:
            m_this.map().pan({
              x: m_queue.scroll.x,
              y: m_queue.scroll.y
            }, undefined, 'limited');
            break;
          case geo_action.zoom:
            zoomFactor = -m_queue.scroll.y;
            m_callZoom(zoomFactor, m_mouse);
            break;
          case geo_action.rotate:
            m_this.map().rotation(
                m_this.map().rotation() +
                m_queue.scroll.y * m_options.rotateWheelScale,
                m_mouse);
            break;
        }
        m_this.map().geoTrigger(geo_event.actionwheel, {
          state: m_this.state(), mouse: m_this.mouse(), event: evt});
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
    if (m_state.action === geo_action.momentum) {
      return;
    }
    if (!initialVelocity) {
      m_mouse.velocity = {
        x: 0,
        y: 0
      };
    }
    m_state.origAction = origAction;
    m_state.action = geo_action.momentum;
    m_state.origin = m_this.mouse();
    m_state.momentum = m_this.mouse();
    m_state.start = new Date();
    m_state.handler = function () {
      var v, s, last, dt;

      if (m_state.action !== geo_action.momentum ||
          !m_this.map() ||
          m_this.map().transition()) {
        // cancel if a new action was performed
        return;
      }
      // Not sure the correct way to do this.  We need the delta t for the
      // next time step...  Maybe use a better interpolator and the time
      // parameter from requestAnimationFrame.
      dt = Math.min(m_state.momentum.deltaTime, 30);

      last = m_state.start.valueOf();
      m_state.start = new Date();

      v = modifyVelocity(m_state.momentum.velocity, m_state.start - last);

      // stop panning when the speed is below the threshold
      if (!v) {
        clearState();
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
      m_state.momentum.velocity.x = v.x;
      m_state.momentum.velocity.y = v.y;

      switch (m_state.origAction) {
        case geo_action.zoom:
          var dy = m_state.momentum.velocity.y * dt;
          m_callZoom(-dy * m_options.zoomScale / 120, m_state);
          break;
        default:
          m_this.map().pan({
            x: m_state.momentum.velocity.x * dt,
            y: m_state.momentum.velocity.y * dt
          }, undefined, 'limited');
          break;
      }

      if (m_state.handler) {
        m_this.map().scheduleAnimationFrame(m_state.handler);
      }
    };
    if (m_state.handler) {
      m_this.map().scheduleAnimationFrame(m_state.handler);
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

  /**
   * Add an action to the list of handled actions.
   *
   * @param {object} action: an object defining the action.  This must have
   *    action and input properties, and may have modifiers, name, and owner.
   *    Use action, name, and owner to make this entry distinct if it will need
   *    to be removed later.
   * @param {boolean} toEnd: the action is added at the beginning of the
   *    actions list unless toEnd is true.  Earlier actions prevent later
   *    actions with the similar input and modifiers.
   */
  this.addAction = function (action, toEnd) {
    if (!action || !action.action || !action.input) {
      return;
    }
    util.addAction(m_options.actions, action, toEnd);
    if (m_options.map && m_options.actions.some(function (action) {
      return action.input.right;
    })) {
      $node.off('contextmenu.geojs');
      $node.on('contextmenu.geojs', function () { return false; });
    }
  };

  /**
   * Check if an action is in the actions list.  An action matches if the
   * action, name, and owner match.  A null or undefined value will match all
   * actions.  If using an action object, this is the same as passing
   * (action.action, action.name, action.owner).
   *
   * @param {object|string} action Either an action object or the name of an
   *    action.
   * @param {string} name Optional name associated with the action.
   * @param {string} owner Optional owner associated with the action.
   * @return action the first matching action or null.
   */
  this.hasAction = function (action, name, owner) {
    return util.hasAction(m_options.actions, action, name, owner);
  };

  /**
   * Remove all matching actions.  Actions are matched as with hasAction.
   *
   * @param {object|string} action Either an action object or the name of an
   *    action.
   * @param {string} name Optional name associated with the action.
   * @param {string} owner Optional owner associated with the action.
   * @return numRemoved the number of actions that were removed.
   */
  this.removeAction = function (action, name, owner) {
    var removed = util.removeAction(
        m_options.actions, action, name, owner);
    if (m_options.map && !m_options.actions.some(function (action) {
      return action.input.right;
    })) {
      $node.off('contextmenu.geojs');
    }
    return removed;
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
    if (type.indexOf('.geojs') >= 0) {
      $(document).trigger(evt);
    }
  };
  this._connectEvents();
  return this;
};

inherit(mapInteractor, object);
module.exports = mapInteractor;
