/**
 * Common object containing all event types that are provided by the GeoJS
 * API.  Each property contained here is a valid target for event handling
 * via {@link geo.object#geoOn}.  The event object provided to handlers is
 * different for each event type.  Each handler is generally called with the
 * `this` context being the class that caused the event.
 *
 * @namespace
 * @alias geo.event
 * @type {object}
 *
 * @example
 * map.geoOn(geo.event.layerAdd, function (event) {
 *   // event is an object with type: {@link geo.event.layerAdd}
 * });
 *
 */
var geo_event = {};

/**
 * All events are sent an object that are an extension of this type.
 *
 * @typedef geo.event.base
 * @type {object}
 * @property {string} event The event type that was triggered.
 * @property {object} geo A universal event object for controlling propagation.
 */

/*
 * Event types
 */

/**
 * Triggered when a layer is added to the map.
 *
 * @event geo.event.layerAdd
 * @type {geo.event.base}
 * @property {geo.map} target The current map.
 * @property {geo.layer} layer The new layer that was added.
 */
geo_event.layerAdd = 'geo_layerAdd';

/**
 * Triggered when a layer is removed from the map.
 *
 * @event geo.event.layerRemove
 * @type {geo.event.base}
 * @property {geo.map} target The current map.
 * @property {geo.layer} layer The old layer that was removed.
 */
geo_event.layerRemove = 'geo_layerRemove';

/**
 * Triggered when a layer z-index is changed.
 *
 * @event geo.event.layerMove
 * @type {geo.event.base}
 * @property {geo.map} target The current map.
 * @property {geo.layer} layer The old layer that was removed.
 */
geo_event.layerMove = 'geo_layerMove';

/**
 * Triggered when the map's zoom level is changed.
 *
 * @event geo.event.zoom
 * @type {geo.event.base}
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
 * @type {geo.event.base}
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
 * @type {geo.event.base}
 * @property {object} screenDelta The number of pixels of the pan.
 * @property {number} screenDelta.x Horizontal pan distance in pixels.
 * @property {number} screenDelta.y Vertical pan distance in pixels.
 */
geo_event.pan = 'geo_pan';

/**
 * Triggered when the map's canvas is resized.
 *
 * @event geo.event.resize
 * @type {geo.event.base}
 * @property {geo.map} target The map that was resized.
 * @property {number} width The new width in pixels.
 * @property {number} height The new height in pixels.
 */
geo_event.resize = 'geo_resize';

/**
 * Triggered on every call to {@link geo.map#draw} before the map is rendered.
 *
 * @event geo.event.draw
 * @type {geo.event.base}
 * @property {geo.map} target The current map.
 */
geo_event.draw = 'geo_draw';

/**
 * Triggered on every call to {@link geo.map#draw} after the map is rendered.
 *
 * @event geo.event.drawEnd
 * @type {geo.event.base}
 * @property {geo.map} target The current map.
 */
geo_event.drawEnd = 'geo_drawEnd';

/**
 * Triggered when the map is shown (the browser tab is made visible)
 *
 * @event geo.event.unhidden
 * @type {geo.event.base}
 * @property {geo.map} target The current map.
 */
geo_event.unhidden = 'geo_unhidden';

/**
 * Triggered when the map is hidden (the browser tab is no longer visible)
 *
 * @event geo.event.hidden
 * @type {geo.event.base}
 * @property {geo.map} target The current map.
 */
geo_event.hidden = 'geo_hidden';

/**
 * Triggered on every `mousemove` over the map's DOM element unless a click
 * might occur.  The event object extends {@link geo.mouseState}.
 *
 * @event geo.event.mousemove
 * @type {(geo.event.base|geo.mouseState)}
 */
geo_event.mousemove = 'geo_mousemove';

/**
 * Triggered on `mouseup` events that happen soon enough and close enough to a
 * `mousedown` event.  The event object extends {@link geo.mouseState}.
 *
 * @event geo.event.mouseclick
 * @type {(geo.event.base|geo.mouseState)}
 * @property {geo.mouseButtons} buttonsDown The buttons that were down at the
 *      start of the click action.
 */
geo_event.mouseclick = 'geo_mouseclick';

/**
 * Triggered on `mouseup` events.  The event object extends
 * {@link geo.mouseState}.
 *
 * @event geo.event.mouseup
 * @type {(geo.event.base|geo.mouseState)}
 * @property {geo.mouseButtons} buttonsDown The buttons that were down at the
 *      start of the up action.
 */
geo_event.mouseup = 'geo_mouseup';

/**
 * Triggered on `mousedown` events.  The event object extends
 * {@link geo.mouseState}.
 *
 * @event geo.event.mousedown
 * @type {(geo.event.base|geo.mouseState)}
 * @property {geo.mouseButtons} buttonsDown The buttons that were down at the
 *      end of the down action.
 */
geo_event.mousedown = 'geo_mousedown';

/**
 * Triggered on every `mousemove` during a brushing selection.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.brush
 * @type {(geo.event.base|geo.brushSelection)}
 */
geo_event.brush = 'geo_brush';

/**
 * Triggered after a brush selection ends.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.brushend
 * @type {(geo.event.base|geo.brushSelection)}
 */
geo_event.brushend = 'geo_brushend';

/**
 * Triggered when a brush selection starts.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.brushstart
 * @type {(geo.event.base|geo.brushSelection)}
 */
geo_event.brushstart = 'geo_brushstart';

/**
 * Triggered when brushing results in a selection.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.select
 * @type {(geo.event.base|geo.brushSelection)}
 */
geo_event.select = 'geo_select';

/**
 * Triggered when brushing results in a zoom selection.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.zoomselect
 * @type {(geo.event.base|geo.brushSelection)}
 */
geo_event.zoomselect = 'geo_zoomselect';

/**
 * Triggered when brushing results in a zoom-out selection.
 * The event object extends {@link geo.brushSelection}.
 *
 * @event geo.event.unzoomselect
 * @type {(geo.event.base|geo.brushSelection)}
 */

geo_event.unzoomselect = 'geo_unzoomselect';

/**
 * Triggered when an action is initiated with mouse down.
 *
 * @event geo.event.actiondown
 * @type {geo.event.base}
 * @property {geo.actionState} state The action state.
 * @property {geo.mouseState} mouse The mouse state.
 * @property {jQuery.Event} event The triggering jQuery event.
 */
geo_event.actiondown = 'geo_actiondown';

/**
 * Triggered when an action is being processed during mouse movement.
 *
 * @event geo.event.actionmove
 * @type {geo.event.base}
 * @property {geo.actionState} state The action state.
 * @property {geo.mouseState} mouse The mouse state.
 * @property {jQuery.Event} event The triggering event.
 */
geo_event.actionmove = 'geo_actionmove';

/**
 * Triggered when an action is ended with a mouse up.
 *
 * @event geo.event.actionup
 * @type {geo.event.base}
 * @property {geo.actionState} state The action state.
 * @property {geo.mouseState} mouse The mouse state.
 * @property {jQuery.Event} event The triggering event.
 */
geo_event.actionup = 'geo_actionup';

/**
 * Triggered when an action results in a selection.
 *
 * @event geo.event.actionselection
 * @type {geo.event.base}
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
 * @type {geo.event.base}
 * @property {geo.actionState} state The action state.
 * @property {geo.mouseState} mouse The mouse state.
 * @property {jQuery.Event} event The triggering event.
 */
geo_event.actionwheel = 'geo_actionwheel';

/**
 * Triggered when an action is triggered via the keyboard.
 *
 * @event geo.event.keyaction
 * @type {geo.event.base}
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
 * @type {geo.event.base}
 * @property {geo.geoPosition} center The target center.
 * @property {number} zoom The target zoom level.
 * @property {number} duration The duration of the transition in milliseconds.
 * @property {Function} ease The easing function.
 */
geo_event.transitionstart = 'geo_transitionstart';

/**
 * Triggered after a map navigation animation ends.
 *
 * @event geo.event.transitionend
 * @type {geo.event.base}
 * @property {geo.geoPosition} center The target center.
 * @property {number} zoom The target zoom level.
 * @property {number} duration The duration of the transition in milliseconds.
 * @property {Function} ease The easing function.
 */
geo_event.transitionend = 'geo_transitionend';

/**
 * Triggered if a map navigation animation is canceled.
 *
 * @event geo.event.transitioncancel
 * @type {geo.event.base}
 * @property {geo.geoPosition} center The target center.
 * @property {number} zoom The target zoom level.
 * @property {number} duration The duration of the transition in milliseconds.
 * @property {Function} ease The easing function.
 */
geo_event.transitioncancel = 'geo_transitioncancel';

/**
 * Triggered when the parallel projection mode is changes.
 *
 * @event geo.event.parallelprojection
 * @type {geo.event.base}
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
   * The event is the feature version of {@link geo.event.mousemove}.  It is
   * fired for each data component of a feature below the mouse when the mouse
   * moves.
   *
   * @event geo.event.feature.mousemove
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is over.
   * @property {number} index The index of the feature data the mouse is over.
   * @property {object} extra Extra information about the feature and mouse
   *    location.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {number} eventID a monotonically increasing event number.  All
   *    features that the mouse moves over simultaneously will have the same
   *    `eventID`.
   * @property {boolean} top True if this is the topmost data element.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mousemove:  'geo_feature_mousemove',
  /**
   * This event is fired for each data component of a feature when the mouse is
   * above it.
   *
   * @event geo.event.feature.mouseover
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is over.
   * @property {number} index The index of the feature data the mouse is over.
   * @property {object} extra Extra information about the feature and mouse
   *    location.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {number} eventID a monotonically increasing event number.  All
   *    features that the mouse goes over simultaneously will have the same
   *    `eventID`.
   * @property {boolean} top True if this is the topmost data element.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mouseover:  'geo_feature_mouseover',
  /**
   * This event is fired when the mouse changes either which feature components
   * or the order of the feature components that it is over.
   *
   * @event geo.event.feature.mouseover_order
   * @type {geo.event.base}
   * @property {geo.feature} feature The feature.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {geo.feature.searchResult} over A list of feature components
   *    that the mouse is over.
   * @property {number[]} The indices of the data components that the mouse
   *    was over before this event.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mouseover_order: 'geo_feature_mouseover_order',
  /**
   * The event is the feature version of {@link geo.event.mouseout}.
   * This event is fired for each data component of a feature when the mouse is
   * no longer above it.
   *
   * @event geo.event.feature.mouseout
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is over.
   * @property {number} index The index of the feature data the mouse is over.
   * @property {object} extra Extra information about the feature and mouse
   *    location.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {number} eventID a monotonically increasing event number.  All
   *    features that the mouse goes over simultaneously will have the same
   *    `eventID`.
   * @property {boolean} top True if this is the topmost data element.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mouseout:   'geo_feature_mouseout',
  /**
   * This event is fired when mouse is over a new topmost data component of a
   * feature.
   *
   * @event geo.event.feature.mouseon
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is on.
   * @property {number} index The index of the feature data the mouse is on.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mouseon:    'geo_feature_mouseon',
  /**
   * This event is fired when mouse is no longer has the same topmost data
   * component of a feature.
   *
   * @event geo.event.feature.mouseoff
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is off.
   * @property {number} index The index of the feature data the mouse is off.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mouseoff:   'geo_feature_mouseoff',
  /**
   * The event is the feature version of {@link geo.event.mouseclick}.
   *
   * @event geo.event.feature.mouseclick
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is off.
   * @property {number} index The index of the feature data the mouse is off.
   * @property {object} extra Extra information about the feature and mouse
   *    location.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {number} eventID a monotonically increasing event number.  All
   *    features that the mouse clicks simultaneously will have the same
   *    `eventID`.
   * @property {boolean} top True if this is the topmost data element.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mouseclick: 'geo_feature_mouseclick',
  /**
   * The event contains the `feature`, the `mouse` record, and `over`, the
   * record of data elements that are under the mouse.
   *
   * @event geo.event.feature.mouseclick_order
   * @type {geo.event.base}
   * @property {geo.feature} feature The feature that was clicked.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {geo.feature.searchResult} over A list of feature components
   *    that the mouse is over.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mouseclick_order: 'geo_feature_mouseclick_order',
  /**
   * The event is the feature version of {@link geo.event.mousedown}.
   *
   * @event geo.event.feature.mousedown
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is above.
   * @property {number} index The index of the feature data the mouse is above.
   * @property {object} extra Extra information about the feature and mouse
   *    location.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {number} eventID a monotonically increasing event number.  All
   *    features that the mouse goes down on simultaneously will have the same
   *    `eventID`.
   * @property {boolean} top True if this is the topmost data element.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mousedown: 'geo_feature_mousedown',
  /**
   * The event is the feature version of {@link geo.event.mouseup}.
   *
   * @event geo.event.feature.mouseup
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is above.
   * @property {number} index The index of the feature data the mouse is above.
   * @property {object} extra Extra information about the feature and mouse
   *    location.
   * @property {geo.mouseState} mouse The mouse state.  The buttons are before
   *    the up action occurs.
   * @property {number} eventID a monotonically increasing event number.  All
   *    features that the mouse goes up on simultaneously will have the same
   *    `eventID`.
   * @property {boolean} top True if this is the topmost data element.
   * @property {geo.event} sourceEvent The underlying event that trigger this.
   */
  mouseup: 'geo_feature_mouseup',
  /**
   * This event is fired for each data component of a feature under a brush
   * that has just finished its selection.
   *
   * @event geo.event.feature.brushend
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is over.
   * @property {number} index The index of the feature data the mouse is over.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {geo.brushSelection} brush The current brush selection.
   * @property {number} eventID a monotonically increasing event number.  All
   *    features that the mouse goes over simultaneously will have the same
   *    `eventID`.
   * @property {boolean} top True if this is the topmost data element.
   */
  brushend:   'geo_feature_brushend',
  /**
   * This event is fired for each data component of a feature under an active
   * brush.
   *
   * @event geo.event.feature.brush
   * @type {geo.event.base}
   * @property {object} data The feature data the mouse is over.
   * @property {number} index The index of the feature data the mouse is over.
   * @property {geo.mouseState} mouse The mouse state.
   * @property {geo.brushSelection} brush The current brush selection.
   * @property {number} eventID a monotonically increasing event number.  All
   *    features that the mouse goes over simultaneously will have the same
   *    `eventID`.
   * @property {boolean} top True if this is the topmost data element.
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
   * @type {geo.event.base}
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
   * @type {geo.event.base}
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
 * @type {geo.event.base}
 * @property {geo.camera} camera The camera instance.
 */
geo_event.camera.view = 'geo_camera_view';

/**
 * Triggered after a projection change.
 *
 * @event geo.event.camera.projection
 * @type {geo.event.base}
 * @property {geo.camera} camera The camera instance.
 * @property {string} type The projection type, either `'perspective'` or
 *      `'parallel'`.
 */
geo_event.camera.projection = 'geo_camera_projection';

/**
 * Triggered after a viewport change.
 *
 * @event geo.event.camera.viewport
 * @type {geo.event.base}
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
 * Triggered when or more multiple annotations have been added.
 *
 * @event geo.event.annotation.add
 * @type {geo.event.base}
 * @property {geo.annotation} [annotation] The annotation that was added.
 * @property {geo.annotation} [annotations] The annotations that were added.
 */
geo_event.annotation.add = 'geo_annotation_add';

/**
 * Triggered when one or multiple annotations are about to be added.
 *
 * @event geo.event.annotation.add_before
 * @type {geo.event.base}
 * @property {geo.annotation} [annotation] The annotation that will be added.
 * @property {geo.annotation[]} [annotations] The annotations that will be
 *   added.
 */
geo_event.annotation.add_before = 'geo_annotation_add_before';

/**
 * Triggered when an annotation has been altered.  This is currently only
 * triggered when updating existing annotations via the geojson function.
 *
 * @event geo.event.annotation.update
 * @type {geo.event.base}
 * @property {geo.annotation} annotation The annotation that was altered.
 */
geo_event.annotation.update = 'geo_annotation_update';

/**
 * Triggered when an annotation's coordinates have been updated.
 *
 * @event geo.event.annotation.coordinates
 * @type {geo.event.base}
 * @property {geo.annotation} annotation The annotation that was altered.
 */
geo_event.annotation.coordinates = 'geo_annotation_coordinates';

/**
 * Triggered when an annotation's edit handle is selected or released.
 *
 * @event geo.event.annotation.select_edit_handle
 * @type {geo.event.base}
 * @property {geo.annotation} annotation The annotation that has an edit handle
 *   selected or unselected.
 * @property {object} handle Information on the edit handle.
 * @property {boolean} enable Truthy if the handle was enabled, falsy if
 *   disabled.
 */
geo_event.annotation.select_edit_handle = 'geo_annotation_select_edit_handle';

/**
 * Triggered when an action is performed on an annotation's edit handle.
 *
 * @event geo.event.annotation.edit_action
 * @type {geo.event.base}
 * @property {geo.annotation} annotation The annotation that has an edit handle
 *   selected or unselected.
 * @property {object} handle Information on the edit handle.
 * @property {boolean} action The edit action, typically one of
 *  {@link geo.event.actiondown}, {@link geo.event.actionmove},
 *  {@link geo.event.actionup}.
 */
geo_event.annotation.edit_action = 'geo_annotation_edit_action';

/**
 * Triggered when an annotation has been removed.
 *
 * @event geo.event.annotation.remove
 * @type {geo.event.base}
 * @property {geo.annotation} annotation The annotation that was removed.
 */
geo_event.annotation.remove = 'geo_annotation_remove';

/**
 * Triggered when an annotation's state changes.
 *
 * @event geo.event.annotation.state
 * @type {geo.event.base}
 * @property {geo.annotation} annotation The annotation that changed.
 */
geo_event.annotation.state = 'geo_annotation_state';

/**
 * Triggered when the annotation mode is changed.
 *
 * @event geo.event.annotation.mode
 * @type {geo.event.base}
 * @property {string?} mode The new annotation mode.  This is one of the values
 *      from {@link geo.annotationLayer.mode} or an annotation name.
 * @property {string?} oldMode The annotation mode before this change.  This is
 *      one of the values from {@link geo.annotationLayer.mode} or an
 *      annotation name.
 * @property {string?} oldState If there was an active annotation before the
 *      mode change, this is the annotation state before the change.  This is
 *      one of the values from {@link geo.annotation.state}.
 * @property {string?} oldCoordinates If there was an active annotation before
 *      the mode change, these are the annotation's coordinates before the
 *      change.  This will be an empty list if an annotation in create state
 *      had not been started and a non-empty list if it is partially created.
 * @property {string?} reason An optional string that was passed to the mode
 *      change method.
 */
geo_event.annotation.mode = 'geo_annotation_mode';

/**
 * Triggered when an annotation can be combined via a boolean operation (union,
 * intersect, difference, xor).
 *
 * @event geo.event.annotation.boolean
 * @type {geo.event.base}
 * @property {geo.annotation} annotation The annotation that is being operated
 *      on.
 * @property {string} operation The operation being performed.
 * @property {boolean} [cancel] If the handle sets this to false, don't apply
 *      the operation to the annotation layer.
 */
geo_event.annotation.boolean = 'geo_annotation_boolean';

/**
 * Triggered when an annotation is in cursor mode and the mouse is clicked.
 *
 * @event geo.event.annotation.cursor_click
 * @type {geo.event.base}
 * @property {geo.annotation} annotation The annotation that is being operated
 *      on.
 * @property {string} operation The operation being performed.
 * @property {boolean} [cancel] If the handle sets this to false, don't apply
 *      the operation to the annotation layer.
 * @property {object} event The triggering event.
 */
geo_event.annotation.cursor_click = 'geo_annotation_cursor_click';

/**
 * Triggered when an annotation is in cursor mode and an action occurs.
 *
 * @event geo.event.annotation.cursor_action
 * @type {geo.event.base}
 * @property {geo.annotation} annotation The annotation that is being operated
 *      on.
 * @property {string} operation The operation being performed.
 * @property {boolean} [cancel] If the handle sets this to false, don't apply
 *      the operation to the annotation layer.
 * @property {object} event The triggering event.
 */
geo_event.annotation.cursor_action = 'geo_annotation_cursor_action';

module.exports = geo_event;
