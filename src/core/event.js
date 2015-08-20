//////////////////////////////////////////////////////////////////////////////
/**
 * Common object containing all event types that are provided by the GeoJS
 * API.  Each property contained here is a valid target for event handling
 * via {@link geo.object#geoOn}.  The event object provided to handlers is
 * different for each event type.  Each handler will generally be called
 * with a the <code>this</code> context being the class that caused the event.<br>
 * <br>
 * The following properties are common to all event objects:
 *
 * @namespace
 * @property {string} type The event type that was triggered
 * @property {object} geo A universal event object for controlling propagation
 *
 * @example
 * map.geoOn(geo.event.layerAdd, function (event) {
 *   // event is an object with type: {@link geo.event.layerAdd}
 * });
 *
 */
//////////////////////////////////////////////////////////////////////////////
geo.event = {};

//////////////////////////////////////////////////////////////////////////////
/*
 * Event types
 */
//////////////////////////////////////////////////////////////////////////////

// The following were not triggered nor used anywhere.  Removing until their
// purpose is defined more clearly.
//
// geo.event.update = 'geo_update';
// geo.event.opacityUpdate = 'geo_opacityUpdate';
// geo.event.layerToggle = 'geo_layerToggle';
// geo.event.layerSelect = 'geo_layerSelect';
// geo.event.layerUnselect = 'geo_layerUnselect';
// geo.event.query = 'geo_query';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when a layer is added to the map.
 *
 * @property {geo.map} target The current map
 * @property {geo.layer} layer The new layer
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.layerAdd = 'geo_layerAdd';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when a layer is removed from the map.
 *
 * @property {geo.map} target The current map
 * @property {geo.layer} layer The old layer
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.layerRemove = 'geo_layerRemove';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the map's zoom level is changed.  Note that zoom is never
 * triggered on the map itself.  Instead it is triggered individually on
 * layers, starting with the base layer.
 *
 * @property {number} zoomLevel New zoom level
 * @property {object} screenPosition The screen position of mouse pointer
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.zoom = 'geo_zoom';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the map is rotated around the map center (pointing downward
 * so that positive angles are clockwise rotations).
 *
 * @property {number} angle The angle of the rotation in radians
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.rotate = 'geo_rotate';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the map is panned either by user interaction or map
 * transition.
 *
 * @property {object} screenDelta The number of pixels to pan the map by
 * @property {object} center The new map center
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.pan = 'geo_pan';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the map's canvas is resized.
 *
 * @property {number} width The new width in pixels
 * @property {number} height The new height in pixels
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.resize = 'geo_resize';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the world coordinate system changes.  Data in GCS
 * coordinates can be transformed by the following formulas:
 *
 *   x <- (x - origin.x) * scale.x
 *   y <- (y - origin.y) * scale.y
 *   z <- (z - origin.z) * scale.z
 *
 * Data in world coordinates can be updated using the following formulas:
 *
 *   x <- (x * scaleChange.x - origin.x * (scale.x + scaleChange.x)
 *          - scale.x * originChange.x) * scale.x / scaleChange.x
 *   y <- (y * scaleChange.y - origin.y * (scale.y + scaleChange.y)
 *          - scale.y * originChange.y) * scale.y / scaleChange.y
 *   z <- (z * scaleChange.z - origin.z * (scale.z + scaleChange.z)
 *          - scale.z * originChange.z) * scale.z / scaleChange.z
 *
 * @property {geo.map} map The map whose coordinates changed
 * @property {object} origin The new origin in GCS coordinates
 * @property {number} origin.x
 * @property {number} origin.y
 * @property {number} origin.z
 * @property {object} scale The new scale factor
 * @property {number} scale.x
 * @property {number} scale.y
 * @property {number} scale.z
 * @property {object} originChange Relative change from the old origin defined
 *   as `origin - oldorigin`.
 * @property {object} scaleChange Relative change from the old scale defined
 *   as `scale / oldscale`.
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.worldChanged = 'geo_worldChanged';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every call to {@link geo.map#draw} before the map is rendered.
 *
 * @property {geo.map} target The current map
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.draw = 'geo_draw';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every call to {@link geo.map#draw} after the map is rendered.
 *
 * @property {geo.map} target The current map
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.drawEnd = 'geo_drawEnd';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every 'mousemove' over the map's DOM element.  The event
 * object extends {@link geo.mouseState}.
 * @mixes geo.mouseState
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.mousemove = 'geo_mousemove';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every 'mousedown' over the map's DOM element.  The event
 * object extends {@link geo.mouseState}.
 * @mixes geo.mouseState
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.mouseclick = 'geo_mouseclick';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every 'mousemove' during a brushing selection.
 * The event object extends {@link geo.brushSelection}.
 * @mixes geo.brushSelection
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.brush = 'geo_brush';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a brush selection ends.
 * The event object extends {@link geo.brushSelection}.
 * @mixes geo.brushSelection
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.brushend = 'geo_brushend';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when a brush selection starts.
 * The event object extends {@link geo.brushSelection}.
 * @mixes geo.brushSelection
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.brushstart = 'geo_brushstart';


//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered before a map navigation animation begins.  Set
 * <code>event.geo.cancelAnimation</code> to cancel the animation
 * of the navigation.  This will cause the map to navigate to the
 * target location immediately.  Set <code>event.geo.cancelNavigation</code>
 * to cancel the navigation completely.  The transition options can
 * be modified in place.
 *
 * @property {geo.geoPosition} center The target center
 * @property {number} zoom The target zoom level
 * @property {number} duration The duration of the transition in milliseconds
 * @property {function} ease The easing function
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.transitionstart = 'geo_transitionstart';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a map navigation animation ends.
 *
 * @property {geo.geoPosition} center The target center
 * @property {number} zoom The target zoom level
 * @property {number} duration The duration of the transition in milliseconds
 * @property {function} ease The easing function
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.transitionend = 'geo_transitionend';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the parallel projection mode is changes.
 *
 * @property paralellProjection {boolean} True if parallel projection is turned
 *                                        on.
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.parallelprojection = 'geo_parallelprojection';

////////////////////////////////////////////////////////////////////////////
/**
 * @namespace
 */
////////////////////////////////////////////////////////////////////////////
geo.event.clock = {
  play: 'geo_clock_play',
  stop: 'geo_clock_stop',
  pause: 'geo_clock_pause',
  change: 'geo_clock_change'
};

////////////////////////////////////////////////////////////////////////////
/**
 * This event object provides mouse/keyboard events that can be handled
 * by the features.  This provides a similar interface as core events,
 * but with different names so the events don't interfere.  Subclasses
 * can override this to provide custom events.
 *
 * These events will only be triggered on features which were instantiated
 * with the option 'selectionAPI'.
 * @namespace
 */
////////////////////////////////////////////////////////////////////////////
geo.event.feature = {
  mousemove:  'geo_feature_mousemove',
  mouseover:  'geo_feature_mouseover',
  mouseout:   'geo_feature_mouseout',
  mouseon:    'geo_feature_mouseon',
  mouseoff:   'geo_feature_mouseoff',
  mouseclick: 'geo_feature_mouseclick',
  brushend:   'geo_feature_brushend',
  brush:      'geo_feature_brush'
};

////////////////////////////////////////////////////////////////////////////
/**
 * These events are triggered by the camera when it's internal state is
 * mutated.
 * @namespace
 */
////////////////////////////////////////////////////////////////////////////
geo.event.camera = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a general view matrix change (any change in the visible
 * bounds).  This is equivalent to the union of pan and zoom.
 *
 * @property {geo.camera} camera The camera instance
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.camera.view = 'geo_camera_view';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a pan in the x/y plane (no zoom level change).
 *
 * @property {geo.camera} camera The camera instance
 * @property {object} delta The translation delta in world coordinates.
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.camera.pan = 'geo_camera_pan';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a view matrix change that is not a simple pan.  This
 * includes, but is not limited to, pure zooms.
 *
 * @property {geo.camera} camera The camera instance
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.camera.zoom = 'geo_camera_zoom';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a projection change.
 *
 * @property {geo.camera} camera The camera instance
 * @property {string} type The projection type ('perspective'|'parallel')
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.camera.projection = 'geo_camera_projection';
