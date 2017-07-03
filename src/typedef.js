/*
 * Type definitions for jsdoc.
 */

/**
 * General object specification for map types.  Any additional values in the
 * object are passed to the map constructor.
 *
 * @typedef geo.map.spec
 * @type {object}
 * @property {object[]} [data=[]] The default data array to apply to each
 *      feature if none exists.
 * @property {geo.layer.spec[]} [layers=[]] Layers to create.
 */

/**
 * General representation of rectangular bounds in world coordinates.
 *
 * @typedef geo.geoBounds
 * @type {object}
 * @property {number} left Horizontal coordinate of the top-left corner.
 * @property {number} top Vertical coordinate of the top-left corner.
 * @property {number} right Horizontal coordinate of the bottom-right corner.
 * @property {number} bottom Vertical coordinate of the bottom-right corner.
 */

/**
 * A location and zoom value.
 *
 * @typedef geo.zoomAndCenter
 * @type {object}
 * @property {geo.geoPosition} center The center coordinates.
 * @property {number} zoom The zoom level.
 */

/**
 * General representation of rectangular bounds in pixel coordinates.
 *
 * @typedef geo.screenBounds
 * @type {object}
 * @property {geo.screenPosition} upperLeft Upper left corner.
 * @property {geo.screenPosition} upperRight Upper right corner.
 * @property {geo.screenPosition} lowerLeft Lower left corner.
 * @property {geo.screenPosition} lowerRight Lower right corner.
 */

/**
 * General representation of a point on the screen.
 *
 * @typedef geo.screenPosition
 * @type {object}
 * @property {number} x Horizontal coordinate in pixels.
 * @property {number} y Vertical coordinate in pixels.
 */

/**
 * General represention of a point on the earth.  The coordinates are most
 * commonly in longitude and latitude, but the coordinate system is changed
 * by the interface gcs.
 *
 * @typedef geo.geoPosition
 * @type {object}
 * @property {number} x Horizontal coordinate, often degrees longitude.
 * @property {number} y Vertical coordinate, often degrees latitude.
 * @property {number} [z=0] Altitude coordinate.
 */

/**
 * General represention of a two-dimensional point in any coordinate system.
 *
 * @typedef geo.point2D
 * @type {object}
 * @property {number} x Horizontal coordinate.
 * @property {number} y Vertical coordinate.
 */

/**
 * Represention of a point on the map.  The coordinates are in the map's
 * reference system, possibly with an affine transformation.
 *
 * @typedef geo.worldPosition
 * @type {object}
 * @property {number} x Horizontal coordinate in map coordinates.
 * @property {number} y Vertical coordinate in map coordinates.
 * @property {number} [z=0] Altitude coordinate, often zero.
 */

/**
 * Represention of a size in pixels.
 *
 * @typedef geo.screenSize
 * @type {object}
 * @property {number} width Width in pixels.
 * @property {number} height Height in pixels.
 */

/**
 * The status of all mouse buttons.
 *
 * @typedef geo.mouseButtons
 * @type {object}
 * @property {boolean} left True if the left mouse button is down.
 * @property {boolean} right True if the right mouse button is down.
 * @property {boolean} middle True if the middle mouse button is down.
 */

/**
 * The status of all modifier keys.  These are usually copied from the
 * standard DOM events.
 *
 * @typedef geo.modifierKeys
 * @type {object}
 * @property {boolean} alt True if the alt or option key is down.
 * @property {boolean} ctrl True if the control key is down.
 * @property {boolean} shift True if the shift key is down.
 * @property {boolean} meta True if the meta, windows, or command key
 *      is down.
 */

/**
 * The state of the mouse.
 *
 * @typedef geo.mouseState
 * @type {object}
 * @property {geo.screenPosition} page Mouse location in pixel space relative
 *      to the entire browser window.
 * @property {geo.screenPosition} map Mouse location in pixel space relative to
 *      the map DOM node.
 * @property {geo.geoPosition} geo Mouse location in interface gcs space.
 * @property {geo.geoPosition} mapgcs Mouse location in gcs space.
 * @property {geo.mouseButtons} buttons The current state of the mouse buttons.
 * @property {geo.modifierKeys} modifiers The current state of all modifier
 *      keys.
 * @property {Date} time The timestamp the event took place.
 * @property {number} deltaTime The time in milliseconds since the last mouse
 *      event.
 * @property {geo.screenPosition} velocity The velocity of the mouse pointer
 *      in pixels per millisecond.
 */

/**
 * The current brush selection (this is when a rectangular area is selected by
 * dragging).
 *
 * @typedef geo.brushSelection
 * @type {object}
 * @property {geo.screenBounds} display The selection bounds in pixel space.
 * @property {object} gcs The selection bounds in the map's gcs.
 * @property {geo.geoPosition} gcs.upperLeft Upper left corner.
 * @property {geo.geoPosition} gcs.upperRight Upper right corner.
 * @property {geo.geoPosition} gcs.lowerLeft Lower left corner.
 * @property {geo.geoPosition} gcs.lowerRight Lower right corner.
 * @property {geo.mouseState} mouse The current mouse state.
 * @property {geo.mouseState} origin The mouse state at the start of the
 *      brush action.
 */

/**
 * The conditions that are necessary to make an action occur.
 *
 * @typedef geo.actionRecord
 * @type {object}
 * @property {string} action The name of the action, from (@link geo.action}.
 * @property {string} [owner] A name of an owning process that can be used to
 *      locate or filter actions.
 * @property {string} [name] A human-readable name that can be used to locate
 *      or filter actions.
 * @property {string|object} input The name of an input that is used for the
 *      action, or an object with input names as keys and boolean values of
 *      inputs that are required to occur or required to not occur to trigger
 *      the action.  Input names include `left`, `right`, `middle` (for mouse
 *      buttons), `wheel` (the mouse wheel), `pan` (touch pan), `rotate` (touch
 *      rotate).
 * @property {string|object} [modifiers] The name of a modifier key or an
 *      object with modifiers as the keys and boolean values.  The listed
 *      modifiers must be set or unset depending on the boolean value.
 *      Modifiers include `shift`, `ctrl`, `alt`, and `meta`.
 * @property {boolean|string} [selectionRectangle] If truthy, a selection
 *      rectangle is shown during the action.  If a string, the name of an
 *      event that is triggered when the selection is complete.
 */

/**
 * The current action state a map interactor.
 *
 * @typedef geo.actionState
 * @type {object}
 * @property {string} action Name of the action that is being handled.
 * @property {geo.actionRecord} actionRecord The action record which triggered
 *      the current action.
 * @property {string} [origAction] The name of an action that triggered this
 *      action.
 * @property {geo.mouseState} origin The mouse state at the start of the
 *      action.
 * @property {number} initialZoom The zoom level at the start of the action.
 * @property {number} initialRotation The map's rotation in radians at the
 *      start of the action.
 * @property {number} initialEventRotation The rotation reported by the
 *      event that triggered this action.  For example, this could be the
 *      angle between two multi-touch points.
 * @property {object} delta The total movement of during the action in gcs
 *      coordinates.
 * @property {number} delta.x The horizontal movement during the action.
 * @property {number} delta.y The vertical movement during the action.
 * @property {boolean} boundDocumentHandlers `true` if the mouse is down and
 *      being tracked.
 * @property {Date} [start] The time when the action started.
 * @property {function} [handler] A function to call on every animation from
 *      while the action is occurring.
 * @property {geo.mouseState} [momentum] The mouse location when a momentum
 *      action starts.
 * @property {boolean} [zoomrotateAllowRotation] Truthy if enough movement has
 *      occurred that rotations are allowed.
 * @property {boolean} [zoomrotateAllowZoom] Truthy if enough movement has
 *      occurred that zooms are allowed.
 * @property {boolean} [zoomrotateAllowPan] Truthy if enough movement has
 *      occurred that pans are allowed.
 * @property {number} [lastRotationDelta] When rotating, the last amount that
 *      was rotated from the start of the action.  This is used to debounce
 *      jitter on touch events.
 * @property {geo.geoPosition} [initialEventGeo] The position of the mouse
 *      when significant movement first occurred.
 */

/**
 * A color value.  Although opacity can be specified, it is not always used.
 * When a string is specified, any of the following forms can be used:
 *   - CSS color name
 *   - `#rrggbb` The color specified in hexadecmial with each channel on a
 *     scale between 0 and 255 (`ff`).  Case insensitive.
 *   - `#rrggbbaa` The color and opacity specified in hexadecmial with each
 *     channel on a scale between 0 and 255 (`ff`).  Case insensitive.
 *   - `#rgb` The color specified in hexadecmial with each channel on a scale
 *     between 0 and 15 (`f`).  Case insensitive.
 *   - `#rgba` The color and opacity specified in hexadecmial with each channel
 *      on a scale between 0 and 15 (`f`).  Case insensitive.
 *   - `rgb(R, G, B)`, `rgb(R, G, B, A)`, `rgba(R, G, B)`, `rgba(R, G, B, A)`
 *     The color with the values of each color channel specified as numeric
 *     values between 0 and 255 or as percent (between 0 and 100) if a percent
 *     `%` follows the number.  The alpha (opacity) channel is optional and can
 *     either be a number between 0 and 1 or a percent.  White space may appear
 *     before and after numbers, and between the number and a percent symbol.
 *     Commas are not required.  A slash may be used as a separator before the
 *     alpha value instead of a comma.  The numbers conform to the CSS number
 *     specification, and can be signed floating-point values, possibly with
 *     exponents.
 *   - `hsl(H, S, L)`, `hsl(H, S, L, A)`, `hsla(H, S, L)`, `hsla(H, S, L, A)`
 *     Hue, saturation, and lightness with optional alpha (opacity).  Hue is a
 *     number between 0 and 360 and is interpretted as degrees unless an angle
 *     unit is specified.  CSS units of `deg`, `grad`, `rad`, and `turn` are
 *     supported.  Saturation and lightness are percentages between 0 and 100
 *     and *must* be followed by a percent `%` symbol.  The alpha (opacity)
 *     channel is optional and is specified as with `rgba(R, G, B, A)`.
 *   - `transparent` Black with 0 opacity.
 *
 * See {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value} for
 * more details on CSS color values.
 *
 * @typedef geo.geoColor
 * @type {geo.geoColorObject|string}
 */

/**
 * A color value represented as an object.  Although opacity can be specified,
 * it is not always used.
 *
 * @typedef {object} geo.geoColorObject
 * @property {number} r The red intensity on a scale of [0-1].
 * @property {number} g The green intensity on a scale of [0-1].
 * @property {number} b The blue intensity on a scale of [0-1].
 * @property {number} [a] The opacity on a scale of [0-1].  If unspecified and
 *      used, it should be treated as 1.
 */
