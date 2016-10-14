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
 * @namespace geo.event
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
var geo_event = {};

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
geo_event.layerAdd = 'geo_layerAdd';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when a layer is removed from the map.
 *
 * @property {geo.map} target The current map
 * @property {geo.layer} layer The old layer
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.layerRemove = 'geo_layerRemove';

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
geo_event.zoom = 'geo_zoom';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the map is rotated around the current map center (pointing
 * downward so that positive angles are clockwise rotations).
 *
 * @property {number} angle The angle of the rotation in radians
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.rotate = 'geo_rotate';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the map is panned either by user interaction or map
 * transition.
 *
 * @property {object} screenDelta The number of pixels to pan the map by
 * @property {object} center The new map center
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.pan = 'geo_pan';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the map's canvas is resized.
 *
 * @property {number} width The new width in pixels
 * @property {number} height The new height in pixels
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.resize = 'geo_resize';

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
geo_event.worldChanged = 'geo_worldChanged';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every call to {@link geo.map#draw} before the map is rendered.
 *
 * @property {geo.map} target The current map
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.draw = 'geo_draw';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every call to {@link geo.map#draw} after the map is rendered.
 *
 * @property {geo.map} target The current map
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.drawEnd = 'geo_drawEnd';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every 'mousemove' over the map's DOM element.  The event
 * object extends {@link geo.mouseState}.
 * @mixes geo.mouseState
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.mousemove = 'geo_mousemove';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every 'mousedown' over the map's DOM element.  The event
 * object extends {@link geo.mouseState}.
 * @mixes geo.mouseState
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.mouseclick = 'geo_mouseclick';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered on every 'mousemove' during a brushing selection.
 * The event object extends {@link geo.brushSelection}.
 * @mixes geo.brushSelection
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.brush = 'geo_brush';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a brush selection ends.
 * The event object extends {@link geo.brushSelection}.
 * @mixes geo.brushSelection
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.brushend = 'geo_brushend';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when a brush selection starts.
 * The event object extends {@link geo.brushSelection}.
 * @mixes geo.brushSelection
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.brushstart = 'geo_brushstart';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a selection ends.
 * The event object extends {@link geo.brushSelection}.
 * @mixes geo.brushSelection
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.select = 'geo_select';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a zoom selection ends.
 * The event object extends {@link geo.brushSelection}.
 * @mixes geo.brushSelection
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.zoomselect = 'geo_zoomselect';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after an unzoom selection ends.
 * The event object extends {@link geo.brushSelection}.
 * @mixes geo.brushSelection
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.unzoomselect = 'geo_unzoomselect';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when an action is initiated with mouse down
 *
 * @property {object} state The action state
 * @property {geo.mouseState} mouse The mouse state
 * @property {object} event The triggering event
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.actiondown = 'geo_actiondown';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when an action is being processed during mouse movement.
 *
 * @property {object} state The action state
 * @property {geo.mouseState} mouse The mouse state
 * @property {object} event The triggering event
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.actionmove = 'geo_actionmove';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when an action is ended with a mouse up.
 *
 * @property {object} state The action state
 * @property {geo.mouseState} mouse The mouse state
 * @property {object} event The triggering event
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.actionup = 'geo_actionup';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when an action results in a selection.
 *
 * @property {object} state The action state
 * @property {geo.mouseState} mouse The mouse state
 * @property {object} event The triggering event
 * @property {object} lowerLeft Lower left of selection in screen coordinates
 * @property {object} upperRight Upper right of selection in screen coordinates
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.actionselection = 'geo_actionselection';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when an action is triggered with a mouse wheel event.
 *
 * @property {object} state The action state
 * @property {geo.mouseState} mouse The mouse state
 * @property {object} event The triggering event
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.actionwheel = 'geo_actionwheel';

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
geo_event.transitionstart = 'geo_transitionstart';

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
geo_event.transitionend = 'geo_transitionend';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered if a map navigation animation is cancelled.
 *
 * @property {geo.geoPosition} center The target center
 * @property {number} zoom The target zoom level
 * @property {number} duration The duration of the transition in milliseconds
 * @property {function} ease The easing function
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.transitioncancel = 'geo_transitioncancel';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the parallel projection mode is changes.
 *
 * @property paralellProjection {boolean} True if parallel projection is turned
 *                                        on.
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.parallelprojection = 'geo_parallelprojection';

////////////////////////////////////////////////////////////////////////////
/**
 * @namespace
 */
////////////////////////////////////////////////////////////////////////////
geo_event.clock = {
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
 * @namespace geo.event.feature
 */
////////////////////////////////////////////////////////////////////////////
geo_event.feature = {
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
 * These events are triggered by the pixelmap feature.
 * @namespace geo.event.pixelmap
 */
////////////////////////////////////////////////////////////////////////////
geo_event.pixelmap = {
  /* The image associated with the pixel map url has been prepared and rendered
   * once. */
  prepared: 'geo_pixelmap_prepared'
};

////////////////////////////////////////////////////////////////////////////
/**
 * These events are triggered by the camera when it's internal state is
 * mutated.
 * @namespace geo.event.camera
 */
////////////////////////////////////////////////////////////////////////////
geo_event.camera = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a general view matrix change (any change in the visible
 * bounds).  This is equivalent to the union of pan and zoom.
 *
 * @property {geo.camera} camera The camera instance
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.camera.view = 'geo_camera_view';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a pan in the x/y plane (no zoom level change).
 *
 * @property {geo.camera} camera The camera instance
 * @property {object} delta The translation delta in world coordinates.
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.camera.pan = 'geo_camera_pan';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a view matrix change that is not a simple pan.  This
 * includes, but is not limited to, pure zooms.
 *
 * @property {geo.camera} camera The camera instance
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.camera.zoom = 'geo_camera_zoom';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a projection change.
 *
 * @property {geo.camera} camera The camera instance
 * @property {string} type The projection type ('perspective'|'parallel')
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.camera.projection = 'geo_camera_projection';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered after a viewport change.
 *
 * @property {geo.camera} camera The camera instance
 * @property {object} viewport The new viewport
 * @property {number} viewport.width The new width
 * @property {number} viewport.height The new height
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.camera.viewport = 'geo_camera_viewport';

////////////////////////////////////////////////////////////////////////////
/**
 * These events are triggered by the annotation layer.
 * @namespace geo.event.annotation
 */
////////////////////////////////////////////////////////////////////////////
geo_event.annotation = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when an annotation has been added.
 *
 * @property {geo.annotation} annotation The annotation that was added.
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.annotation.add = 'geo_annotation_add';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when an annotation is about to be added.
 *
 * @property {geo.annotation} annotation The annotation that will be added.
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.annotation.add_before = 'geo_annotation_add_before';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when an annotation has been removed.
 *
 * @property {geo.annotation} annotation The annotation that was removed.
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.annotation.remove = 'geo_annotation_remove';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when an annotation's state changes.
 *
 * @property {geo.annotation} annotation The annotation that changed/
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.annotation.state = 'geo_annotation_state';

//////////////////////////////////////////////////////////////////////////////
/**
 * Triggered when the annotation mode is changed.
 *
 * @property {string|null} mode the new annotation mode.
 */
//////////////////////////////////////////////////////////////////////////////
geo_event.annotation.mode = 'geo_annotation_mode';

module.exports = geo_event;
