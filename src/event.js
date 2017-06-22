/**
 * Common object containing all event types that are provided by the GeoJS
 * API.  Each property contained here is a valid target for event handling
 * via {@link geo.object#geoOn}.  The event object provided to handlers is
 * different for each event type.  Each handler is generally called with the
 * `this` context being the class that caused the event.<br>
 * <br>
 * The following properties are common to all event objects:
 *
 * @namespace
 * @alias geo.event
 * @type {object}
 * @property {string} event The event type that was triggered.
 * @property {object} geo A universal event object for controlling propagation.
 *
 * @example
 * map.geoOn(geo.event.layerAdd, function (event) {
 *   // event is an object with type: {@link geo.event.layerAdd}
 * });
 *
 */
var geo_event = {};

/*
 * Event types
 */

/**
 * Triggered when a layer is added to the map.
 *
 * @event geo.event.layerAdd
 * @type {object}
 * @property {geo.map} target The current map.
 * @property {geo.layer} layer The new layer that was added.
 */
geo_event.layerAdd = 'geo_layerAdd';

/**
 * Triggered when a layer is removed from the map.
 *
 * @event geo.event.layerRemove
 * @type {object}
 * @property {geo.map} target The current map.
 * @property {geo.layer} layer The old layer that was removed.
 */
geo_event.layerRemove = 'geo_layerRemove';

/**
 * Triggered when the map's zoom level is changed.
 *
 * @event geo.event.zoom
 * @type {object}
 * @property {number} zoomLevel New zoom level.
 * @property {geo.screenPosition} screenPosition The screen position of the
 *      mouse pointer.
 */
geo_event.zoom = 'geo_zoom';

/**
 * Triggered when the map is rotated around the current map center (pointing
 * downward so that positive angles are clockwise rotations).
 *
 * @event geo.event.rotate
 * @type {object}
 * @property {number} rotation The angle of the rotation in radians.  This is
 *      the map's complete rotation, not a delta.
 * @property {geo.screenPosition} screenPosition The screen position of the
 *      mouse pointer.
 */
geo_event.rotate = 'geo_rotate';

/**
 * Triggered when the map is panned either by user interaction or map
 * transition.
 *
 * @event geo.event.pan
 * @type {object}
 * @property {object} screenDelta The number of pixels of the pan.
 * @property {number} screenDelta.x Horizontal pan distance in pixels.
 * @property {number} screenDelta.y Vertical pan distance in pixels.
 */
geo_event.pan = 'geo_pan';

/**
 * Triggered when the map's canvas is resized.
 *
 * @event geo.event.resize
 * @type {object}
 * @property {geo.map} target The map that was resized.
 * @property {number} width The new width in pixels.
 * @property {number} height The new height in pixels.
 */
geo_event.resize = 'geo_resize';

/**
 * Triggered on every call to {@link geo.map#draw} before the map is rendered.
 *
 * @event geo.event.draw
 * @type {object}
 * @property {geo.map} target The current map.
 */
geo_event.draw = 'geo_draw';

/**
 * Triggered on every call to {@link geo.map#draw} after the map is rendered.
 *
 * @event geo.event.drawEnd
 * @type {object}
 * @property {geo.map} target The current map.
 */
geo_event.drawEnd = 'geo_drawEnd';

/**
 * Triggered on every `mousemove` over the map's DOM element unless a click
 * might occur.  The event object extends {@link geo.mouseState}.
 *
 * @event geo.event.mousemove
 */
geo_event.mousemove = 'geo_mousemove';

/**
 * Triggered on `mouseup` events that happen soon enough and close enough to a
 * `mousedown` event.  The event object extends {@link geo.mouseState}.
 *
 * @event geo.event.mouseclick
 * @property {geo.mouseButtons} buttonsDown The buttons that were down at the
 *      start of the click action.
 */
geo_event.mouseclick = 'geo_mouseclick';

/**
 * Triggered on every `mousemove` during a brushing selection.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.brush
 */
geo_event.brush = 'geo_brush';

/**
 * Triggered after a brush selection ends.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.brushend
 */
geo_event.brushend = 'geo_brushend';

/**
 * Triggered when a brush selection starts.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.brushstart
 */
geo_event.brushstart = 'geo_brushstart';

/**
 * Triggered when brushing results in a selection.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.select
 */
geo_event.select = 'geo_select';

/**
 * Triggered when brushing results in a zoom selection.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.zoomselect
 */
geo_event.zoomselect = 'geo_zoomselect';

/**
 * Triggered when brushing results in a zoom-out selection.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.unzoomselect
 */

geo_event.unzoomselect = 'geo_unzoomselect';

/**
 * Triggered when an action is initiated with mouse down.
 *
 * @event geo.event.actiondown
 * @property {geo.actionState} state The action state.
 * @property {geo.mouseState} mouse The mouse state.
 * @property {jQuery.Event} event The triggering jQuery event.
 */
geo_event.actiondown = 'geo_actiondown';

/**
 * Triggered when an action is being processed during mouse movement.
 *
 * @event geo.event.actionmove
 * @property {geo.actionState} state The action state.
 * @property {geo.mouseState} mouse The mouse state.
 * @property {jQuery.Event} event The triggering event.
 */
geo_event.actionmove = 'geo_actionmove';

/**
 * Triggered when an action is ended with a mouse up.
 *
 * @event geo.event.actionup
 * @property {geo.actionState} state The action state.
 * @property {geo.mouseState} mouse The mouse state.
 * @property {jQuery.Event} event The triggering event.
 */
geo_event.actionup = 'geo_actionup';

/**
 * Triggered when an action results in a selection.
 *
 * @event geo.event.actionselection
 * @property {geo.actionState} state The action state.
 * @property {geo.mouseState} mouse The mouse state.
 * @property {jQuery.Event} event The triggering event.
 * @property {geo.screenPosition} lowerLeft Lower left of selection in screen
 *      coordinates.
 * @property {geo.screenPosition} upperRight Upper right of selection in screen
 *      coordinates.
 */
geo_event.actionselection = 'geo_actionselection';

/**
 * Triggered when an action is triggered with a mouse wheel event.
 *
 * @event geo.event.actionwheel
 * @property {geo.actionState} state The action state.
 * @property {geo.mouseState} mouse The mouse state.
 * @property {jQuery.Event} event The triggering event.
 */
geo_event.actionwheel = 'geo_actionwheel';

/**
 * Triggered when an action is triggered via the keyboard.
 *
 * @event geo.event.keyaction
 * @property {object} move The movement that would happen if the action is
 *      passed through.
 * @property {number} [move.zoomDelta] A change in the zoom level.
 * @property {number} [move.zoom] A new zoom level.
 * @property {number} [move.rotationDelta] A change in the rotation in radians.
 * @property {number} [move.rotation] A new absolute rotation in radians.
 * @property {number} [move.panX] A horizontal shift in display pixels.
 * @property {number} [move.panY] A vertical shift in display pixels.
 * @property {boolean} [move.cancel] Set to `true` to cancel the entire
 *      movement.
 * @property {string} action Action based on key
 * @property {number} factor Factor based on metakeys [0-2].  0 means a small
 *      movement is preferred, 1 a medium movement, and 2 a large movement.
 * @property {jQuery.Event} event The triggering event
 */
geo_event.keyaction = 'geo_keyaction';

/**
 * Triggered before a map navigation animation begins.  Set
 * `event.geo.cancelAnimation` to cancel the animation of the navigation.  This
 * will cause the map to navigate to the target location immediately.  Set
 * `event.geo.cancelNavigation` to cancel the navigation completely.  The
 * transition options can be modified in place.
 *
 * @event geo.event.transitionstart
 * @type {object}
 * @property {geo.geoPosition} center The target center.
 * @property {number} zoom The target zoom level.
 * @property {number} duration The duration of the transition in milliseconds.
 * @property {function} ease The easing function.
 */
geo_event.transitionstart = 'geo_transitionstart';

/**
 * Triggered after a map navigation animation ends.
 *
 * @event geo.event.transitionend
 * @type {object}
 * @property {geo.geoPosition} center The target center.
 * @property {number} zoom The target zoom level.
 * @property {number} duration The duration of the transition in milliseconds.
 * @property {function} ease The easing function.
 */
geo_event.transitionend = 'geo_transitionend';

/**
 * Triggered if a map navigation animation is canceled.
 *
 * @event geo.event.transitioncancel
 * @type {object}
 * @property {geo.geoPosition} center The target center.
 * @property {number} zoom The target zoom level.
 * @property {number} duration The duration of the transition in milliseconds.
 * @property {function} ease The easing function.
 */
geo_event.transitioncancel = 'geo_transitioncancel';

/**
 * Triggered when the parallel projection mode is changes.
 *
 * @event geo.event.parallelprojection
 * @type {object}
 * @property {boolean} paralellProjection `true` if parallel projection is
 *      turned on.
 */
geo_event.parallelprojection = 'geo_parallelprojection';

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
geo_event.feature = {
  /**
   * The event is the feature version of {@link geo.event.mousemove}.
   * @event geo.event.feature.mousemove
   */
  mousemove:  'geo_feature_mousemove',
  /**
   * The event is the feature version of {@link geo.event.mouseover}.
   * @event geo.event.feature.mouseover
   */
  mouseover:  'geo_feature_mouseover',
  /**
   * The event is the feature version of {@link geo.event.mouseout}.
   * @event geo.event.feature.mouseout
   */
  mouseout:   'geo_feature_mouseout',
  /**
   * The event is the feature version of {@link geo.event.mouseon}.
   * @event geo.event.feature.mouseon
   */
  mouseon:    'geo_feature_mouseon',
  /**
   * The event is the feature version of {@link geo.event.mouseoff}.
   * @event geo.event.feature.mouseoff
   */
  mouseoff:   'geo_feature_mouseoff',
  /**
   * The event is the feature version of {@link geo.event.mouseclick}.
   * @event geo.event.feature.mouseclick
   */
  mouseclick: 'geo_feature_mouseclick',
  /**
   * The event is the feature version of {@link geo.event.brushend}.
   * @event geo.event.feature.brushend
   */
  brushend:   'geo_feature_brushend',
  /**
   * The event is the feature version of {@link geo.event.brush}.
   * @event geo.event.feature.brush
   */
  brush:      'geo_feature_brush'
};

/**
 * These events are triggered by the pixelmap feature.
 * @namespace geo.event.pixelmap
 */
geo_event.pixelmap = {
  /**
   * Report that an image associated with a pixel map has been prepared and
   * rendered once.
   *
   * @event geo.event.pixelmap.prepared
   * @type {object}
   * @property {geo.pixelmapFeature} pixelmap The pixelmap object that was
   *    prepared.
   */
  prepared: 'geo_pixelmap_prepared'
};

/**
 * These events are triggered by the map screenshot feature.
 * @namespace geo.event.screenshot
 */
geo_event.screenshot = {
  /**
   * Triggered when a screenshot has been completed.
   *
   * @event geo.event.screenshot.ready
   * @property {HTMLCanvasElement} canvas The canvas used to take the
   *    screenshot.
   * @property {string|HTMLCanvasElement} screenshot The screenshot as a
   *    dataURL string or the canvas, depending on the screenshot request.
   */
  ready: 'geo_screenshot_ready'
};

/**
 * These events are triggered by the camera when it's internal state is
 * mutated.
 * @namespace geo.event.camera
 */
geo_event.camera = {};

/**
 * Triggered after a general view matrix change (any change in the visible
 * bounds).  This is equivalent to the union of pan and zoom.
 *
 * @event geo.event.camera.view
 * @type {object}
 * @property {geo.camera} camera The camera instance.
 */
geo_event.camera.view = 'geo_camera_view';

/**
 * Triggered after a projection change.
 *
 * @event geo.event.camera.projection
 * @property {geo.camera} camera The camera instance.
 * @property {string} type The projection type, either `'perspective'` or
 *      `'parallel'`.
 */
geo_event.camera.projection = 'geo_camera_projection';

/**
 * Triggered after a viewport change.
 *
 * @event geo.event.camera.viewport
 * @property {geo.camera} camera The camera instance.
 * @property {geo.screenSize} viewport The new viewport size.
 */
geo_event.camera.viewport = 'geo_camera_viewport';

/**
 * These events are triggered by the annotation layer.
 * @namespace geo.event.annotation
 */
geo_event.annotation = {};

/**
 * Triggered when an annotation has been added.
 *
 * @event geo.event.annotation.add
 * @type {object}
 * @property {geo.annotation} annotation The annotation that was added.
 */
geo_event.annotation.add = 'geo_annotation_add';

/**
 * Triggered when an annotation is about to be added.
 *
 * @event geo.event.annotation.add_before
 * @type {object}
 * @property {geo.annotation} annotation The annotation that will be added.
 */
geo_event.annotation.add_before = 'geo_annotation_add_before';

/**
 * Triggered when an annotation has been altered.  This is currently only
 * triggered when updating existing annotations via the geojson function.
 *
 * @event geo.event.annotation.update
 * @type {object}
 * @property {geo.annotation} annotation The annotation that was altered.
 */
geo_event.annotation.update = 'geo_annotation_update';

/**
 * Triggered when an annotation has been removed.
 *
 * @event geo.event.annotation.remove
 * @type {object}
 * @property {geo.annotation} annotation The annotation that was removed.
 */
geo_event.annotation.remove = 'geo_annotation_remove';

/**
 * Triggered when an annotation's state changes.
 *
 * @event geo.event.annotation.state
 * @type {object}
 * @property {geo.annotation} annotation The annotation that changed.
 */
geo_event.annotation.state = 'geo_annotation_state';

/**
 * Triggered when the annotation mode is changed.
 *
 * @event geo.event.annotation.mode
 * @type {object}
 * @property {string?} mode The new annotation mode.  This is one of the values
 *      from `geo.annotation.annotationState`.
 * @property {string?} oldMode The annotation mode before this change.  This is
 *      one of the values from `geo.annotation.annotationState`.
 */
geo_event.annotation.mode = 'geo_annotation_mode';

module.exports = geo_event;
