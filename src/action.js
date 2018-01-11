/**
 * Common object containing all action types that are provided by the GeoJS
 * API.
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

  // annotation actions
  annotation_line: 'geo_annotation_line',
  annotation_polygon: 'geo_annotation_polygon',
  annotation_rectangle: 'geo_annotation_rectangle',
  annotation_edit_handle: 'geo_annotation_edit_handle'
};

module.exports = geo_action;
