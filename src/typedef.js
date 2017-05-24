//////////////////////////////////////////////////////////////////////////////
/*
 * Type definitions for jsdoc.
 */
//////////////////////////////////////////////////////////////////////////////

/**
 * General object specification for map types.  Any additional values in the
 * object are passed to the map constructor.
 * @typedef geo.map.spec
 * @type {object}
 * @property {object[]} [data=[]] The default data array to apply to each
 *      feature if none exists
 * @property {geo.layer.spec[]} [layers=[]] Layers to create
 */

/**
 * General representation of rectangular bounds in world coordinates
 * @typedef geo.geoBounds
 * @type {object}
 * @property {number} left Horizontal coordinate of the top-left corner
 * @property {number} top Vertical coordinate of the top-left corner
 * @property {number} right Horizontal coordinate of the bottom-right corner
 * @property {number} bottom Vertical coordinate of the bottom-right corner
 */

/**
 * A location and zoom value.
 * @typedef geo.zoomAndCenter
 * @type {object}
 * @property {geo.geoPosition} center The center coordinates.
 * @property {number} zoom The zoom level.
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
 * General represention of a point on the earth.  The coordinates are most
 * commonly in longitude and latitude, but the coordinate system is changed
 * by the interface gcs.
 * @typedef geo.geoPosition
 * @type {object}
 * @property {number} x Horizontal coordinate, often degrees longitude
 * @property {number} y Vertical coordinate, often degrees latitude
 * @property {number} [z=0] Altitude coordinate
 */

/**
 * Represention of a point on the map.  The coordinates are in the map's
 * reference system, possibly with an affine transformation.
 * @typedef geo.worldPosition
 * @type {object}
 * @property {number} x Horizontal coordinate in map coordinates.
 * @property {number} y Vertical coordinate in map coordinates.
 * @property {number} [z=0] Altitude coordinate, often zero
 */

/**
 * Represention of a size in pixels
 * @typedef geo.screenSize
 * @type {object}
 * @property {number} width Width in pixels.
 * @property {number} height Height in pixels.
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
