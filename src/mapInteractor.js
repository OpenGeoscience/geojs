var inherit = require('./inherit');
var object = require('./object');
var util = require('./util');
var Mousetrap = require('mousetrap');

/**
 * Map Interactor specification.
 *
 * @typedef {object} geo.mapInteractor.spec
 * @property {number} [throttle=30] Mouse events are throttled so that an event
 *      occurs no more often that this number of milliseconds.
 * @property {boolean|number} [discreteZoom=false] If `true`, only allow
 *      discrete (integer) zoom levels and debounce with a 400 ms delay.  If a
 *      positive number, debounce zoom events with the given delay in
 *      milliseconds.
 * @property {geo.actionRecord[]} [actions] The list of available actions.  See
 *      the code for the full default list.
 * @property {object} [click] An object specifying if click events should be
 *      handled.
 * @property {boolean} [click.enabled=true] Truthy to enable click events.
 * @property {object} [click.buttons] An object with button names (`left`,
 *      `right`, `middle`), each of which is a boolean which indicates if that
 *      button triggers a click event.
 * @property {number} [click.duration=0] If a positive number, the mouse up
 *      event must occur within this time in milliseconds of the mouse down
 *      event for it to be considered a click.
 * @property {boolean} [click.cancelOnMove=true] If truthy, don't generate
 *      click events if the mouse moved at all.
 * @property {object} [keyboard] An object describing which keyboard events are
 *      handled.
 * @property {object} [keyboard.actions] An object with different actions that
 *      are trigger by the keyboard.  Each key is the event that is triggered,
 *      with the values a list of keys that trigger the event.  See the code
 *      for the defaults.
 * @property {object} [keyboard.meta] Keyboard events can generate actions of
 *      different magnitudes.  This is an object with keys of `0`, `1`, and
 *      `2`, corresponding to small, medium, and large actions.  Each entry is
 *      an object with keys of the meta keys that are required to be down or
 *      up for that scale action to trigger.  If the value of the meta key is
 *      truthy, it must be down.  If `false`, it must be up.
 * @property {boolean} [keyboard.focusHighlight=true] If truthy, when the map
 *      gains focus, a highlight style is shown around it.  This gives an
 *      indicator that keyboard events will affect the map, but may not be
 *      visuallly desirabel.
 * @property {boolean} [alwaysTouch=false] If true, add touch support even if
 *      the browser doesn't apepar to be touch-aware.
 * @property {number} [wheelScaleX=1] A scale multiplier for horizontal wheel
 *      interactions.
 * @property {number} [wheelScaleY=1] A scale multiplier for vertical wheel
 *      interactions.
 * @property {number} [zoomScale=1] This affects how far the mouse must be
 *      dragged to zoom one level.  Roughly, the mouse must move `zoomScale` *
 *      120 pixels per level.
 * @property {number} [rotateWheelScale=0.105] When the mouse wheel is used for
 *      rotation, this is the number of radians per wheel step.
 * @property {number} [zoomrotateMinimumRotation=0.087] The minimum angle of
 *      rotation in radians before a `geo_action.zoomrotate` action will allow
 *      rotation.  Set to 0 to always include rotation.
 * @property {number} [zoomrotateReverseRotation=0.698] The minimum angle of
 *      rotation (in radians) before the `geo_action.zoomrotate` action will
 *      reverse the rotation direction.  This helps reduce chatter when zooms
 *      and pans are combined with rotations.
 * @property {number} [zoomrotateMinimumZoom=0.05] The minimum zoom factor
 *      change (increasing or desceasing) before the `geo_action.zoomrotate`
 *      action will allow zoom.  Set to 0 to always include zoom.
 * @property {number} [zoomrotateMinimumPan=5] The minimum number of pixels
 *      before the `geo_action.zoomrotate` action will allow panning.  Set to 0
 *      to always include panning.
 * @property {number} [touchPanDelay=50] The touch pan delay prevents a touch
 *      pan event from immediately following a rotate (including zoom) event.
 *      No touch pan event is processed within this number of milliseconds of a
 *      non-pan touch event.
 * @property {object} [momentum] Enable momentum when panning and zooming.
 * @property {boolean} [momentum.enabled=true] Truthy to allow momentum.
 * @property {number} [momentum.maxSpeed=2.5] Maximum animation speed.
 * @property {number} [momentum.minSpeed=0.01] Animations top when they drop
 *      below this speed.
 * @property {number} [momentum.stopTime=250] If the mouse hasn't moved in this
 *      many milliseconds, don't apply momentum.  The movement is a separate
 *      action from the preceding movement.
 * @property {number} [momentum.drag=0.01] Drag coefficient; larger values slow
 *      down faster.
 * @property {string[]} [momentum.actions] A list of actions on which to apply
 *      momentum.  Defaults to pan and zoom.
 * @property {object} [spring] Enable spring clamping to screen edges.
 * @property {boolean} [spring.enabled=true] Truthy to allow edge spring back.
 * @property {number} [spring.springConstant=0.00005] Higher values spring back
 *      faster.
 * @property {object} [zoomAnimation] Enable zoom animation for both discrete
 *      and continuous zoom.
 * @property {boolean} [zoomAnimation.enabled=true] Truthy to allow zoom
 *      animation.
 * @property {number} [zoomAnimation.duration=500] The time it takes for the
 *      final zoom to be reached.
 * @property {function} [zoomAnimation.ease] The easing function for the zoom.
 *      The default is `(2 - t) * t`.
 */

/**
 * The mapInteractor class is responsible for handling raw events from the
 * browser and interpreting them as map navigation interactions.  This class
 * will call the navigation methods on the connected map, which will make
 * modifications to the camera directly.
 *
 * @class
 * @alias geo.mapInteractor
 * @extends geo.object
 * @param {geo.mapInterator.spec} args Interactor specification object.
 * @returns {geo.mapInteractor}
 */
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

  var m_options,
      m_this = this,
      m_mouse,
      m_keyHandler,
      m_boundKeys,
      m_touchHandler,
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
      }, {
        action: geo_action.pan,
        input: 'pan',
        owner: 'geo.mapInteractor',
        name: 'touch pan'
      }, {
        action: geo_action.zoomrotate,
        input: 'rotate',
        owner: 'geo.mapInteractor',
        name: 'touch zoom and rotate'
      }],

      click: {
        enabled: true,
        buttons: {left: true, right: true, middle: true},
        duration: 0,
        cancelOnMove: true
      },

      keyboard: {
        actions: {
          /* Specific actions can be disabled by removing them from this object
           * or setting an empty list as the key bindings.  Additional actions
           * can be added to the dictionary, each of which gets a list of key
           * bindings.  See Mousetrap documentation for special key names. */
          'zoom.in': ['plus', 'shift+plus', 'shift+ctrl+plus', '=', 'shift+=', 'shift+ctrl+='],
          'zoom.out': ['-', 'shift+-', 'shift+ctrl+-', '_', 'shift+_', 'shift+ctrl+_'],
          'zoom.0': ['1'],
          'zoom.3': ['2'],
          'zoom.6': ['3'],
          'zoom.9': ['4'],
          'zoom.12': ['5'],
          'zoom.15': ['6'],
          'zoom.18': ['7'],
          'pan.left': ['left', 'shift+left', 'shift+ctrl+left'],
          'pan.right': ['right', 'shift+right', 'shift+ctrl+right'],
          'pan.up': ['up', 'shift+up', 'shift+ctrl+up'],
          'pan.down': ['down', 'shift+down', 'shift+ctrl+down'],
          'rotate.ccw': ['<', 'shift+<', 'shift+ctrl+<', '.', 'shift+.', 'shift+ctrl+.'],
          'rotate.cw': ['>', 'shift+>', 'shift+ctrl+>', ',', 'shift+,', 'shift+ctrl+,'],
          'rotate.0': ['0']
        },
        meta: {
          /* the metakeys that are down during a key event determine the
           * magnitude of the action, where 0 is the default small action
           * (1-pixel pan, small zoom, small rotation), 1 is a middle-sized
           * action, and 2 is the largest action.  Metakeys that aren't listed
           * are ignored.  Metakeys include shift, ctrl, alt, and meta (alt is
           * either the alt or option key, and meta is either windows or
           * command). */
          0: {shift: false, ctrl: false},
          1: {shift: true, ctrl: true},
          2: {shift: true, ctrl: false}
        },
        /* if focusHighlight is truthy, then a class is added to the map such
         * that when the map gets focus, it is indicated inside the border of
         * the map -- browsers usually show focus on the outside, which isn't
         * useful if the map is full window.  It might be desirable to change
         * this so it is only present if the focus is reached via the keyboard
         * (which would probably require detecting keyup events). */
        focusHighlight: true
      },
      /* Set alwaysTouch to false to only add touch support on devices that
       * report touch support.  Set to true to add touch support on all
       * devices. */
      alwaysTouch: false,
      wheelScaleX: 1,
      wheelScaleY: 1,
      zoomScale: 1,
      rotateWheelScale: 6 * Math.PI / 180,
      /* The minimum angle of rotation (in radians) before the
       * geo_action.zoomrotate action will allow rotation.  Set to 0 to always
       * include rotation. */
      zoomrotateMinimumRotation: 5.0 * Math.PI / 180,
      /* The minimum angle of rotation (in radians) before the
       * geo_action.zoomrotate action will reverse the rotation direction.
       * This helps reduce chatter when zooms and pans are combined with
       * rotations. */
      zoomrotateReverseRotation: 4.0 * Math.PI / 180,
      /* The minimum zoom factor change (increasing or decreasing) before the
       * geo_action.zoomrotate action will allow zoom.  Set to 0 to always
       * include zoom. */
      zoomrotateMinimumZoom: 0.05,
      /* The minimum number of pixels before the geo_action.zoomrotate action
       * will allow panning.  Set to 0 to always include panning. */
      zoomrotateMinimumPan: 5,
      /* The touch pan delay prevents a touch pan event from immediately
       * following a rotate (including zoom) event.  No touch pan event is
       * processed within this number of milliseconds of a non-pan touch
       * event. */
      touchPanDelay: 50,
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
    args || {}
  );
  /* We don't want to merge the original arrays with arrays passed in the args,
   * so override that as necessary for actions. */
  if (args && args.actions) {
    m_options.actions = $.extend(true, [], args.actions);
  }
  if (args && args.momentum && args.momentum.actions) {
    m_options.momentum.actions = $.extend(true, [], args.momentum.actions);
  }
  if (args && args.keyboard && args.keyboard.actions !== undefined) {
    m_options.keyboard.actions = $.extend(true, {}, args.keyboard.actions);
  }

  // default mouse object
  m_mouse = {
    page: {x: 0, y: 0}, // mouse position relative to the page
    map: {x: 0, y: 0}, // mouse position relative to the map
    geo: {x: 0, y: 0},  // mouse position in map interface gcs
    mapgcs: {x: 0, y: 0},  // mouse position in map gcs
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

  /*
   * The interactor state determines what actions are taken in response to
   * core browser events.
   *
   * i.e.
   *  {
   *    'action': geo_action.pan,    * an ongoing pan event
   *    'origin': {...},       * mouse object at the start of the action
   *    'delta': {x: *, y: *} // mouse movement since action start
   *                           * not including the current event
   *  }
   *
   *  {
   *    'action': geo_action.zoom,   * an ongoing zoom event
   *    ...
   *  }
   *
   *  {
   *    'action': geo_action.rotate,   * an ongoing rotate event
   *    'origin': {...},       * mouse object at the start of the action
   *    'delta': {x: *, y: *} // mouse movement since action start
   *                           * not including the current event
   *  }
   *
   *  {
   *    'acton': geo_action.select,
   *    'origin': {...},
   *    'delta': {x: *, y: *}
   *  }
   *
   *  {
   *    'action': geo_action.momentum,
   *    'origin': {...},
   *    'handler': function () { }, // called in animation loop
   *    'timer': animate loop timer
   *  }
   */
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

  /**
   * Process keys that we've captured.  Metakeys determine the magnitude of
   * the action.
   *
   * @param {string} action The basic action to take.
   * @param {object} evt The event with metakeys.
   * @param {object} keys Keys used to trigger the event.  `keys.simulated` is
   *    true if artificially triggered.
   */
  this._handleKeys = function (action, evt, keys) {
    if (keys && keys.simulated === true) {
      evt = keys;
    }
    var meta = m_options.keyboard.meta || {0: {}},
        map = m_this.map(),
        mapSize = map.size(),
        actionBase = action, actionValue = '',
        value, factor, move = {};

    for (value in meta) {
      if (meta.hasOwnProperty(value)) {
        if ((meta[value].shift === undefined || evt.shiftKey === !!meta[value].shift) &&
            (meta[value].ctrl === undefined || evt.ctrlKey === !!meta[value].ctrl) &&
            (meta[value].alt === undefined || evt.altKey === !!meta[value].alt) &&
            (meta[value].meta === undefined || evt.metaKey === !!meta[value].meta)) {
          factor = value;
        }
      }
    }
    if (factor === undefined) {
      /* metakeys don't match, so don't trigger an event. */
      return;
    }

    evt.stopPropagation();
    evt.preventDefault();

    if (action.indexOf('.') >= 0) {
      actionBase = action.substr(0, action.indexOf('.'));
      actionValue = action.substr(action.indexOf('.') + 1);
    }
    switch (actionBase) {
      case 'zoom':
        switch (actionValue) {
          case 'in':
            move.zoomDelta = [0.05, 0.25, 1][factor];
            break;
          case 'out':
            move.zoomDelta = -[0.05, 0.25, 1][factor];
            break;
          default:
            if (!isNaN(parseFloat(actionValue))) {
              move.zoom = parseFloat(actionValue);
            }
            break;
        }
        break;
      case 'pan':
        switch (actionValue) {
          case 'down':
            move.panY = -Math.max(1, [0, 0.05, 0.5][factor] * mapSize.height);
            break;
          case 'left':
            move.panX = Math.max(1, [0, 0.05, 0.5][factor] * mapSize.width);
            break;
          case 'right':
            move.panX = -Math.max(1, [0, 0.05, 0.5][factor] * mapSize.width);
            break;
          case 'up':
            move.panY = Math.max(1, [0, 0.05, 0.5][factor] * mapSize.height);
            break;
        }
        break;
      case 'rotate':
        switch (actionValue) {
          case 'ccw':
            move.rotationDelta = [1, 5, 90][factor] * Math.PI / 180;
            break;
          case 'cw':
            move.rotationDelta = -[1, 5, 90][factor] * Math.PI / 180;
            break;
          default:
            if (!isNaN(parseFloat(actionValue))) {
              move.rotation = parseFloat(actionValue);
            }
            break;
        }
        break;
    }
    map.geoTrigger(geo_event.keyaction, {
      move: move,
      action: action,
      factor: factor,
      event: evt
    });
    if (move.cancel) {
      return;
    }
    if (move.zoom !== undefined) {
      map.zoom(move.zoom);
    } else if (move.zoomDelta) {
      map.zoom(map.zoom() + move.zoomDelta);
    }
    if (move.rotation !== undefined) {
      map.rotation(move.rotation);
    } else if (move.rotationDelta) {
      map.rotation(map.rotation() + move.rotationDelta);
    }
    if (move.panX || move.panY) {
      map.pan({x: move.panX || 0, y: move.panY || 0});
    }
  };

  /**
   * Check if this browser has touch support.
   * Copied from https://github.com/hammerjs/touchemulator under the MIT
   * license.
   *
   * @returns {boolean} `true` if there is touch support.
   */
  this.hasTouchSupport = function () {
    return ('ontouchstart' in window) || // touch events
           (window.Modernizr && window.Modernizr.touch) || // modernizr
           (navigator.msMaxTouchPoints || navigator.maxTouchPoints) > 1; // pointer events
  };

  /**
   * Handle touch events.
   *
   * @param {object} evt The touch event.
   */
  this._handleTouch = function (evt) {
    var endIfBound = false;
    if (evt.pointerType === 'mouse' && m_touchHandler.touchSupport) {
      endIfBound = true;
    }
    if (evt.type === 'hammer.input') {
      if (m_touchHandler.lastEventType === 'pan' && evt.pointers.length !== 1) {
        endIfBound = true;
        m_touchHandler.lastEventType = null;
      } else {
        return;
      }
    }
    var evtType = /^(.*)(start|end|move|tap)$/.exec(evt.type);
    if (!evtType || evtType.length !== 3) {
      endIfBound = true;
    }
    if (endIfBound) {
      if (m_state.boundDocumentHandlers && m_touchHandler.lastEvent) {
        m_this._handleMouseUpDocument(m_touchHandler.lastEvent);
      }
      return;
    }
    evt.which = evtType[1];
    var time = (new Date()).valueOf();
    if (evt.which === 'pan' && m_touchHandler.lastEventType !== 'pan' &&
        time - m_touchHandler.lastTime < m_options.touchPanDelay) {
      return;
    }
    m_touchHandler.lastTime = time;
    m_touchHandler.lastEventType = evt.which;
    m_touchHandler.lastEvent = evt;
    /* convert touch events to have page locations */
    if (evt.pageX === undefined && evt.center !== undefined && evt.center.x !== undefined) {
      evt.pageX = evt.center.x;
      evt.pageY = evt.center.y;
    }
    /* start events should occur *before* the triggering delta.  By using the
     * mouse handlers, we get all of the action properties we expect (and
     * actions can be changed or defined as we see fit). */
    if (evtType[2] === 'start') {
      m_this._handleMouseDown(evt);
      m_this._setClickMaybe(false);
      if (m_state.boundDocumentHandlers) {
        $(document).on('mousemove.geojs', m_this._handleMouseUpDocument);
      }
    }
    /* start and move events both trigger a movement */
    if (evtType[2] === 'start' || evtType[2] === 'move') {
      if (m_state.boundDocumentHandlers) {
        m_this._handleMouseMoveDocument(evt);
      } else {
        m_this._handleMouseMove(evt);
      }
    }
    if (evtType[2] === 'end' || evtType[2] === 'cancel') {
      if (m_state.boundDocumentHandlers) {
        m_this._handleMouseUpDocument(evt);
      } else {
        m_this._handleMouseUp(evt);
      }
      m_touchHandler.lastEvent = null;
    }
    /* tap events are represented as a mouse left button down and up. */
    if (evtType[2] === 'tap' && !m_state.boundDocumentHandlers) {
      evt.which = 1;
      m_touchHandler.lastEventType = null;
      m_this._handleMouseDown(evt);
      m_this._handleMouseUp(evt);
      m_touchHandler.lastEventType = evtType[2];
    }
  };

  /**
   * Retrigger a mouse movement with the current mouse state.
   */
  this.retriggerMouseMove = function () {
    m_this.map().geoTrigger(geo_event.mousemove, m_this.mouse());
  };

  /**
   * Connects events to a map.  If the map is not set, then this does nothing.
   * @returns {this}
   */
  this._connectEvents = function () {
    if (!m_options.map) {
      return m_this;
    }

    // prevent double binding to DOM elements
    m_this._disconnectEvents();

    // store the connected element
    $node = $(m_options.map.node());

    // set methods related to asynchronous event handling
    m_this._handleMouseWheel = throttled_wheel();
    m_callZoom = debounced_zoom();

    // catalog what inputs we are using
    util.adjustActions(m_options.actions);
    var usedInputs = {};
    ['right', 'pan', 'rotate'].forEach(function (input) {
      usedInputs[input] = m_options.actions.some(function (action) {
        return action.input[input];
      });
    });
    // add event handlers
    $node.on('wheel.geojs', m_this._handleMouseWheel);
    $node.on('mousemove.geojs', m_this._handleMouseMove);
    $node.on('mousedown.geojs', m_this._handleMouseDown);
    $node.on('mouseup.geojs', m_this._handleMouseUp);
    // Disable dragging images and such
    $node.on('dragstart', function () { return false; });
    if (usedInputs.right) {
      $node.on('contextmenu.geojs', function () { return false; });
    }

    // bind keyboard events
    if (m_options.keyboard && m_options.keyboard.actions) {
      m_keyHandler = Mousetrap($node[0]);
      var bound = [];
      for (var keyAction in m_options.keyboard.actions) {
        if (m_options.keyboard.actions.hasOwnProperty(keyAction)) {
          m_keyHandler.bind(
            m_options.keyboard.actions[keyAction],
            (function (action) {
              return function (evt, keys) {
                m_this._handleKeys(action, evt, keys);
              };
            })(keyAction)
          );
          bound = bound.concat(m_options.keyboard.actions[keyAction]);
        }
      }
      m_boundKeys = bound;
    }
    $node.toggleClass('highlight-focus',
      !!(m_boundKeys && m_boundKeys.length && m_options.keyboard.focusHighlight));
    // bind touch events
    if ((m_this.hasTouchSupport() || m_options.alwaysTouch) &&
        (usedInputs.pan || usedInputs.rotate)) {
      // webpack expects optional dependencies to be wrapped in a try-catch
      var Hammer;
      try {
        Hammer = require('hammerjs');
      } catch (_error) {}
      if (Hammer !== undefined) {
        var recog = [],
            touchEvents = ['hammer.input'];
        if (usedInputs.rotate) {
          recog.push([Hammer.Rotate, {enable: true}]);
          touchEvents = touchEvents.concat(['rotatestart', 'rotateend', 'rotatemove']);
        }
        if (usedInputs.pan) {
          recog.push([Hammer.Pan, {direction: Hammer.DIRECTION_ALL}]);
          touchEvents = touchEvents.concat(['panstart', 'panend', 'panmove']);
        }
        /* Always handle tap events.  Reject double taps. */
        recog.push([Hammer.Tap, {event: 'doubletap', taps: 2}]);
        recog.push([Hammer.Tap, {event: 'singletap'}, undefined, ['doubletap']]);
        touchEvents = touchEvents.concat(['singletap']);
        var hammerParams = {recognizers: recog, preventDefault: true};
        m_touchHandler = {
          manager: new Hammer.Manager($node[0], hammerParams),
          touchSupport: m_this.hasTouchSupport(),
          lastTime: 0
        };
        m_touchHandler.manager.get('doubletap').recognizeWith('singletap');
        touchEvents.forEach(function (touchEvent) {
          m_touchHandler.manager.on(touchEvent, m_this._handleTouch);
        });
      }
    }

    return m_this;
  };

  /**
   * Disconnects events to a map.  If the map is not set, then this does
   * nothing.
   * @returns {this}
   */
  this._disconnectEvents = function () {
    if (m_boundKeys) {
      if (m_keyHandler) {
        m_keyHandler.unbind(m_boundKeys);
      }
      m_boundKeys = null;
      m_keyHandler = null;
    }
    if (m_touchHandler) {
      m_touchHandler.manager.destroy();
      m_touchHandler = null;
    }
    if ($node) {
      $node.off('.geojs');
      $node = null;
    }
    m_this._handleMouseWheel = function () {};
    m_callZoom = function () {};

    return m_this;
  };

  /**
   * Sets or gets map for this interactor, adds draw region layer if needed.
   *
   * @param {geo.map} [val] Either a new map object for `undefined` to return
   *    the current map object.
   * @returns {geo.map|this} Either the current map object or the
   *    mapInteractor class instance.
   */
  this.map = function (val) {
    if (val !== undefined) {
      m_options.map = val;
      m_this._connectEvents();
      return m_this;
    }
    return m_options.map;
  };

  /**
   * Gets/sets the options object for the interactor.
   *
   * @param {geo.mapInteractor.spec} opts Options to set.
   * @returns {geo.mapInteractor.spec|this}
   */
  this.options = function (opts) {
    if (opts === undefined) {
      return $.extend({}, m_options);
    }
    $.extend(m_options, opts);

    // reset event handlers for new options
    this._connectEvents();
    return m_this;
  };

  /**
   * Stores the current mouse position from an event.
   *
   * @param {jQuery.Event} evt JQuery event with the mouse position.
   */
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
      m_mouse.geo = m_mouse.mapgcs = null;
    }
  };

  /**
   * Stores the current mouse button state in the m_mouse object.
   *
   * @param {jQuery.Event} evt The event that trigger the mouse action.
   */
  this._getMouseButton = function (evt) {
    for (var prop in m_mouse.buttons) {
      if (m_mouse.buttons.hasOwnProperty(prop)) {
        m_mouse.buttons[prop] = false;
      }
    }
    /* If the event buttons are specified, use them in preference to the
     * evt.which for determining which buttons are down.  buttons is a bitfield
     * and therefore can represent more than one button at a time. */
    if (evt.buttons !== undefined) {
      m_mouse.buttons.left = !!(evt.buttons & 1);
      m_mouse.buttons.right = !!(evt.buttons & 2);
      m_mouse.buttons.middle = !!(evt.buttons & 4);
    } else if (evt.type !== 'mouseup') {
      /* If we don't evt.buttons, fall back to which, but not on mouseup. */
      switch (evt.which) {
        case 1: m_mouse.buttons.left = true; break;
        case 2: m_mouse.buttons.middle = true; break;
        case 3: m_mouse.buttons.right = true; break;
      }
    }
    /* When handling touch events, evt.which can be a string, in which case
     * handle a "button" with that name -- a non-integer string will not
     * evaluate as being between 1 and 3. */
    if (evt.which && !(evt.which >= 1 && evt.which <= 3)) {
      m_mouse.buttons[evt.which] = true;
    }
  };

  /**
   * Stores the current keyboard modifiers from an event in the m_mouse
   * object.
   *
   * @param {jQuery.Event} evt JQuery event with the keyboard modifiers.
   */
  this._getMouseModifiers = function (evt) {
    m_mouse.modifiers.alt = evt.altKey;
    m_mouse.modifiers.ctrl = evt.ctrlKey;
    m_mouse.modifiers.meta = evt.metaKey;
    m_mouse.modifiers.shift = evt.shiftKey;
  };

  /**
   * Compute a selection information object.
   *
   * @private
   * @returns {geo.brushSelection}
   */
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

  /**
   * Immediately cancel an ongoing action.
   *
   * @param {string?} action The action type, if `null` cancel any action.
   * @param {boolean} [keepQueue] If truthy, keep the queue event if an action
   *    is canceled.
   * @returns {boolean} Set if an action was canceled.
   */
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

  /**
   * Set the value of whether a click is possible.  Cancel any outstanding
   * timer for this process.
   *
   * @param {false|object} value If `false`, there is no chance of a future
   *    click.  If an object with coordinates and the mouse button state,
   *    a click is possible if the same button is released nearby.
   */
  this._setClickMaybe = function (value) {
    m_clickMaybe = value;
    if (m_clickMaybeTimeout) {
      window.clearTimeout(m_clickMaybeTimeout);
      m_clickMaybeTimeout = null;
    }
  };

  /**
   * Handle event when a mouse button is pressed.
   *
   * @param {jQuery.Event} evt The event that triggered this.
   */
  this._handleMouseDown = function (evt) {
    var action, actionRecord;

    if (m_paused) {
      return;
    }
    /* In some scenarios, we get both a tap event and then, somewhat later, a
     * set of mousedown/mouseup events.  Ignore the spurious down/up set if we
     * just handled a tap. */
    if (m_touchHandler && m_touchHandler.lastEventType === 'tap' &&
        (new Date()).valueOf() - m_touchHandler.lastTime < 1000) {
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

    var map = m_this.map();
    // cancel transitions and momentum on click
    map.transitionCancel('_handleMouseDown' + (action ? '.' + action : ''));
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
        initialZoom: map.zoom(),
        initialRotation: map.rotation(),
        initialEventRotation: evt.rotation,
        delta: {x: 0, y: 0}
      };

      if (actionRecord.selectionRectangle) {
        // Make sure the old selection layer is gone.
        if (m_selectionLayer) {
          m_selectionLayer.clear();
          map.deleteLayer(m_selectionLayer);
          m_selectionLayer = null;
        }
        m_selectionLayer = map.createLayer(
          'feature', {features: [quadFeature.capabilities.color]});
        m_selectionQuad = m_selectionLayer.createFeature(
          'quad', {gcs: map.gcs()});
        m_selectionQuad.style({
          opacity: 0.25,
          color: {r: 0.3, g: 0.3, b: 0.3}
        });
        map.geoTrigger(geo_event.brushstart, m_this._getSelection());
      }
      map.geoTrigger(geo_event.actiondown, {
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

  /**
   * Handle mouse move event.
   *
   * @param {jQuery.Event} evt The event that triggered this.
   */
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

  /**
   * Handle the zoomrotate action.
   *
   * @param {object} evt The mouse event that triggered this.
   */
  this._handleZoomrotate = function (evt) {
    /* Only zoom if we have once exceeded the initial zoom threshold. */
    var deltaZoom = Math.log2(evt.scale);
    if (!m_state.zoomrotateAllowZoom && deltaZoom &&
        Math.abs(deltaZoom) >= Math.log2(1 + m_options.zoomrotateMinimumZoom)) {
      if (m_options.zoomrotateMinimumZoom) {
        m_state.initialZoom -= deltaZoom;
      }
      m_state.zoomrotateAllowZoom = true;
    }
    if (m_state.zoomrotateAllowZoom && deltaZoom) {
      var zoom = m_state.initialZoom + deltaZoom;
      m_this.map().zoom(zoom, m_state.origin);
    }
    /* Only rotate if we have once exceeded the initial rotation threshold.  The
     * first time this happens (if the threshold is greater than zero), set the
     * start of rotation to the current position, so that there is no sudden
     * jump. */
    var deltaTheta = (evt.rotation - m_state.initialEventRotation) * Math.PI / 180;
    if (!m_state.zoomrotateAllowRotation && deltaTheta &&
        Math.abs(deltaTheta) >= m_options.zoomrotateMinimumRotation) {
      if (m_options.zoomrotateMinimumRotation) {
        m_state.initialEventRotation = evt.rotation;
        deltaTheta = 0;
      }
      m_state.zoomrotateAllowRotation = true;
    }
    if (m_state.zoomrotateAllowRotation) {
      var theta = m_state.initialRotation + deltaTheta;
      /* Compute the delta in the range of [-PI, PI).  This is involed to work
       * around modulo returning a signed value. */
      deltaTheta = ((theta - m_this.map().rotation()) % (Math.PI * 2) +
                    Math.PI * 3) % (Math.PI * 2) - Math.PI;
      /* If we reverse direction, don't rotate until some threshold is
       * exceeded.  This helps prevent rotation bouncing while panning. */
      if (deltaTheta && (deltaTheta * (m_state.lastRotationDelta || 0) >= 0 ||
          Math.abs(deltaTheta) >= m_options.zoomrotateReverseRotation)) {
        m_this.map().rotation(theta, m_state.origin);
        m_state.lastRotationDelta = deltaTheta;
      }
    }
    /* Only pan if we have once exceed the initial pan threshold. */
    var panOrigin = m_state.origin.page;
    if (m_state.initialEventGeo) {
      var offset = $node.offset();
      panOrigin = m_this.map().gcsToDisplay(m_state.initialEventGeo);
      panOrigin.x += offset.left;
      panOrigin.y += offset.top;
    }
    var x = evt.pageX, deltaX = x - panOrigin.x,
        y = evt.pageY, deltaY = y - panOrigin.y,
        deltaPan2 = deltaX * deltaX + deltaY * deltaY;
    if (!m_state.zoomrotateAllowPan && deltaPan2 &&
        deltaPan2 >= m_options.zoomrotateMinimumPan * m_options.zoomrotateMinimumPan) {
      if (m_options.zoomrotateMinimumPan) {
        deltaX = deltaY = 0;
        m_state.initialEventGeo = m_this.mouse().geo;
      } else {
        m_state.initialEventGeo = m_state.origin.geo;
      }
      m_state.zoomrotateAllowPan = true;
    }
    if (m_state.zoomrotateAllowPan && (deltaX || deltaY)) {
      m_this.map().pan({x: deltaX, y: deltaY});
    }
  };

  /**
   * Handle mouse move event on the document (temporary bindings).
   *
   * @param {jQuery.Event} evt The event that triggered this.
   */
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
    } else if (m_state.action === geo_action.zoomrotate) {
      m_this._handleZoomrotate(evt);
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
   * @param {object} v Current velocity in pixels / millisecond.
   * @param {number} deltaT The time delta.
   * @returns {object} New velocity.
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
   * Get the spring force for the current map bounds.
   * @private
   * @returns {object} The spring force.
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

  /**
   * Based on the screen coordinates of a selection, zoom or unzoom and
   * recenter.
   *
   * @private
   * @param {string} action Either `geo_action.zoomselect` or
   *    `geo_action.unzoomselect`.
   * @param {object} lowerLeft The x and y coordinates of the lower left corner
   *    of the zoom rectangle.
   * @param {object} upperRight The x and y coordinates of the upper right
   *    corner of the zoom rectangle.
   */
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

  /**
   * Handle event when a mouse button is unpressed on the document.
   * Removes temporary bindings.
   *
   * @param {jQuery.Event} evt The event that triggered this.
   */
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
        state: m_this.state(),
        mouse: m_this.mouse(),
        event: evt,
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

  /**
   * Handle event when a mouse button is unpressed.
   *
   * @param {jQuery.Event} evt The event that triggered this.
   */
  this._handleMouseUp = function (evt) {
    if (m_paused) {
      return;
    }

    m_this._getMouseButton(evt);

    if (m_clickMaybe) {
      m_this._handleMouseClick(evt);
    }
  };

  /**
   * Handle event when a mouse click is detected.  A mouse click is a simulated
   * event that occurs when the time between a mouse down and mouse up
   * is less than the configured duration and (optionally) if no mousemove
   * events were triggered in the interim.
   *
   * @param {jQuery.Event} evt The event that triggered this.
   */
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

  /**
   * Private wrapper around the map zoom method that is debounced to support
   * discrete zoom interactions.
   *
   * @returns {function} A function to handle zooms that debounces such
   *    events.  This function is passed the zoom level and the mouse state.
   */
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

  /**
   * Attaches wrapped methods for accumulating fast mouse wheel events and
   * throttling map interactions.
   * @private
   *
   * @returns {function} A function that takes a jQuery.Event for mouse wheel
   *    actions.
   */
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
        // recompute where the mouse action is occurring.
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

  /**
   * Handle mouse wheel event.  (Defined inside _connectEvents).
   */
  this._handleMouseWheel = function () {};

  /**
   * Start up a spring back action when the map bounds are out of range.
   * Not to be user callable.
   * @protected
   *
   * @param {boolean} initialVelocity Truthy if the mouse's current velocity
   *    should be used as the initial velocity.  False to assume no initial
   *    velocity.
   * @param {object} origAction The original action that started the spring
   *    back.  If this was a zoom action, the spring back includes zoom;
   *    otherwise it only includes panning.
   */
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

  /**
   * Public method that unbinds all events.
   */
  this.destroy = function () {
    m_this._disconnectEvents();
    if (m_this.map()) {
      $(m_this.map().node()).removeClass('highlight-focus');
    }
    m_this.map(null);
  };

  /**
   * Get current mouse information.
   *
   * @returns {object} The current mouse state.
   */
  this.mouse = function () {
    return $.extend(true, {}, m_mouse);
  };

  /**
   * Get/set current keyboard information.
   *
   * @param {object} [newValue] Either a object with new options for the
   *    keyboard actions or `undefined` to get the current options.
   * @returns {object|this} Either the current keyboard options or this
   *    mapInteractor class instance.
   */
  this.keyboard = function (newValue) {
    if (newValue === undefined) {
      return $.extend(true, {}, m_options.keyboard || {});
    }
    return m_this.options({keyboard: newValue});
  };

  /**
   * Get the current interactor state.
   *
   * @returns {geo.interactorState}
   */
  this.state = function () {
    return $.extend(true, {}, m_state);
  };

  /**
   * Get or set the pause state of the interactor, which ignores all native
   * mouse and keyboard events.
   *
   * @param {boolean} [value] The pause state to set or undefined to return
   *    the current state.
   * @returns {boolean|this} The current pause state or this class instance.
   */
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
   * @param {object} action An object defining the action.  This must have
   *    action and input properties, and may have modifiers, name, and owner.
   *    Use action, name, and owner to make this entry distinct if it will need
   *    to be removed later.
   * @param {boolean} [toEnd] The action is added at the beginning of the
   *    actions list unless truthy.  Earlier actions prevent later actions with
   *    similar input and modifiers.
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
   * @returns {object|null} The first matching action or null.
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
   * @returns {number} The number of actions that were removed.
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

  /**
   * Simulate a DOM mouse event on connected map.  Not all options are required
   * for every event type.
   *
   * @param {string} type Event type `mousemove`, `mousedown`, `mouseup`, etc.
   *    `keyboard` is treated separately from other types.
   * @param {object} options Options for the simulated event.
   * @param {boolean} [options.shift] A boolean if a `keyboard` event has the
   *    shift key down or explicitly up.
   * @param {boolean} [options.shiftKey] Alternate name to `shift`.
   * @param {boolean} [options.ctrl] A boolean if a `keyboard` event has the
   *    control key down or explicitly up.
   * @param {boolean} [options.ctrlKey] Alternate name to `ctrl`.
   * @param {boolean} [options.alt] A boolean if a `keyboard` event has the
   *    alt key down or explicitly up.
   * @param {boolean} [options.altKey] Alternate name to `alt`.
   * @param {boolean} [options.meta] A boolean if a `keyboard` event has the
   *    meta key down or explicitly up.
   * @param {boolean} [options.metaKey] Alternate name to `meta`.
   * @param {string} [options.keys] A Mousetrap-style key sequence string for
   *    `keyboard` events.
   * @param {geo.screenPosition} [options.page] The position of the event on
   *    the window.  Overridden by `map`.
   * @param {geo.screenPosition} [options.map] The position of the event on the
   *    map in pixels relative to the map's div.
   * @param {geo.screenPosition} [options.center] The position of a touch
   *    event center relative to the window.
   * @param {string} [button] One of `left`, `middle`, or `right` for mouse
   *    events.
   * @param {string} [modifiers] A space-separated list of metakeys that are
   *    down on mouse events.
   * @param {geo.screenPosition} [wheelDelta] The amount the wheel moved in
   *    both directions for wheel events.  One step is often 20 units of
   *    vement.
   * @param {number} [wheelMode] The wheel delta mode.  See
   *    https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent .
   * @param {boolean} [touch] `truthy` if this is a touch event.
   * @param {number} [rotation] Touch event rotation in degrees.
   * @param {number} [scale] Touch event scale.  Initial events should have a
   *    scale of 1; subsequent events should increase or decrease this to
   *    simulate spread and pinch actions.
   * @param {number[]} [pointers] A list of pointer numbers involved in a
   *    touch event.  Pointers are number from one up, so `[1]` is the first
   *    touch point, `[1, 2]` are two touch points, and `[2]` is when the first
   *    point was released but the second is still touching.
   * @param {string} [pointerType] `mouse` if this is a mouse action rather
   *    than a touch action.
   * @returns {mapInteractor}
   */
  this.simulateEvent = function (type, options) {
    var evt, page, offset, which, buttons;

    if (!m_this.map()) {
      return m_this;
    }

    if (type === 'keyboard' && m_keyHandler) {
      /* Mousetrap passes through the keys we send, but not an event object,
       * so we construct an artificial event object as the keys, and use that.
       */
      var keys = {
        shiftKey: options.shift || options.shiftKey || false,
        ctrlKey: options.ctrl || options.ctrlKey || false,
        altKey: options.alt || options.altKey || false,
        metaKey: options.meta || options.metaKey || false,
        toString: function () { return options.keys; },
        stopPropagation: function () {},
        preventDefault: function () {},
        simulated: true
      };
      m_keyHandler.trigger(keys);
      return;
    }

    page = options.page || {};

    if (options.map) {
      offset = $node.offset();
      page.x = options.map.x + offset.left;
      page.y = options.map.y + offset.top;
    }

    if (options.button === 'left') {
      which = 1;
      buttons = 1;
    } else if (options.button === 'right') {
      which = 3;
      buttons = 2;
    } else if (options.button === 'middle') {
      which = 2;
      buttons = 4;
    }

    options.modifiers = options.modifiers || [];
    options.wheelDelta = options.wheelDelta || {};

    evt = $.Event(
      type,
      {
        pageX: page.x,
        pageY: page.y,
        which: which,
        buttons: buttons,
        altKey: options.modifiers.indexOf('alt') >= 0,
        ctrlKey: options.modifiers.indexOf('ctrl') >= 0,
        metaKey: options.modifiers.indexOf('meta') >= 0,
        shiftKey: options.modifiers.indexOf('shift') >= 0,
        center: options.center,
        rotation: options.touch ? options.rotation || 0 : options.rotation,
        scale: options.touch ? options.scale || 1 : options.scale,
        pointers: options.pointers,
        pointerType: options.pointerType,

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
    if (options.touch && m_touchHandler) {
      m_this._handleTouch(evt);
    } else {
      $node.trigger(evt);
    }
    if (type.indexOf('.geojs') >= 0) {
      $(document).trigger(evt);
    }
  };
  this._connectEvents();
  return this;
};

inherit(mapInteractor, object);
module.exports = mapInteractor;
