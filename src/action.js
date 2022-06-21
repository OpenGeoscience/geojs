/**
 * Common object containing all action types that are provided by the GeoJS
 * API.
 *
 * @namespace
 * @alias geo.action
 * @enum {string}
 */
var geo_action = {
  momentum: 'geo_action_momentum',
  pan: 'geo_action_pan',
  rotate: 'geo_action_rotate',
  select: 'geo_action_select',
  unzoomselect: 'geo_action_unzoomselect',
  zoom: 'geo_action_zoom',
  zoomrotate: 'geo_action_zoom_rotate',
  zoomselect: 'geo_action_zoomselect',

  // annotation actions -- some are also added by the registry
  annotation_edit_handle: 'geo_annotation_edit_handle'
};

module.exports = geo_action;
