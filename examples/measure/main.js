/* globals $, geo, utils */

// This is extensively based on the Annotation example.

// Always positive modulo function
function modulo(a, b) {
  return ((a % b) + b) % b;
}

// Get url query parameters
var query = utils.getQuery();

// If a flag is set, add some extra tile sources.  Make sure you have the
// appropriate licenses before doing this.
if (query.extra) {
  // This is a proof of concept; it may require licensing, or at least
  // registering with Microsoft
  geo.osmLayer.tileSources['bing-satellite'] = {
    url: (x, y, z, s) => {
      s = s[modulo(x + y + z, s.length)];
      let tile = '';
      for (; z > 0; z -= 1) {
        let d = (x % 2) + (y % 2) * 2;
        tile = '' + d + tile;
        x = Math.floor(x / 2);
        y = Math.floor(y / 2);
      }
      return `http://ecn.t${s}.tiles.virtualearth.net/tiles/a${tile}.jpeg?g=5000`;
    },
    attribution: '<a href="https://www.microsoft.com/maps/product/terms.html">Microsoft</a> Virtual Earth',
    subdomains: '0123',
    minLevel: 1,
    maxLevel: 19
  };
  $('#basemap option[value="custom"]').before('<option value="bing-satellite">Bing Satellite</option>');
  // This requires that you have an appropriate Esri ArcGIS license to use.  It
  // is possible that its use might be allowed in certain uses via
  // https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9
  geo.osmLayer.tileSources['arcgis-satellite'] = {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
    attribution: '<a href="https://www.esri.com/en-us/search/?q=world%20imagery">Esri World Imagery</a>',
    minLevel: 0,
    maxLevel: 19
  };
  $('#basemap option[value="custom"]').before('<option value="arcgis-satellite">ArcGIS Satellite</option>');
}
// Add a blank tile for removing the map
geo.osmLayer.tileSources['false'] = {
  url: '/data/white.jpg',
  attribution: ''
};
// Define a decimal miles unit
geo.gui.scaleWidget.unitsTable['decmiles'] = [
  {unit: 'mi', scale: 1609.344}
];
// Define area units
var areaUnitsTable = {
  si: [
    {unit: 'nm\xB2', scale: 1e-18},
    {unit: '\u03BCm\xB2', scale: 1e-12},
    {unit: 'mm\xB2', scale: 1e-6},
    {unit: 'm\xB2', scale: 1},
    {unit: 'km\xB2', scale: 1e6}
  ],
  hectares: [
    {unit: 'ha', scale: 1e4}
  ],
  decmiles: [
    {unit: 'mi\xB2', scale: 1609.344 * 1609.344}
  ],
  miles: [
    {unit: 'in\xB2', scale: 0.0254 * 0.0254},
    {unit: 'ft\xB2', scale: 0.3048 * 0.3048},
    {unit: 'mi\xB2', scale: 1609.344 * 1609.344}
  ],
  acres: [
    {unit: 'pl', scale: 0.3048 * 0.3048 * 16.5 * 16.5},
    {unit: 'rd', scale: 1609.344 * 1609.344 / 640 / 4},
    {unit: 'ac', scale: 1609.344 * 1609.344 / 640}
  ]
};

var map, mapLayer, layer, fromButtonSelect, fromGeojsonUpdate;

// Set controls based on query parameters
$('#basemap').val(query.basemap || 'stamen-toner-lite');
$('#mapurl').val(query.mapurl || '');
$('#mapurl').toggleClass('hidden', $('#basemap').val() !== 'custom');
$('#distunit').val(query.distunit || 'decmiles');
$('#areaunit').val(query.areaunit || 'decmiles');
$('#clickmode').val(query.clickmode || 'edit');
$('#keepadding').prop('checked', query.keepadding === 'true');
$('#showLabels').prop('checked', query.labels !== 'false');
if (query.lastannotation) {
  $('.annotationtype button').removeClass('lastused');
  $('.annotationtype button#' + query.lastannotation).addClass('lastused');
}
if (query.hide) {
  $('#controls').addClass('reduced');
}
// You can set the intiial annotations via a query parameter.  If the query
// parameter 'save=true' is specified, the query will be updated with the
// geojson.  This can become too long for some browsers.
var initialGeoJSON = query.geojson;

// respond to changes in our controls
$('#controls').on('change', change_controls);
$('#geojson[type=textarea]').on('input propertychange', change_geojson);
$('#controls').on('click', 'a', select_control);
$('.annotationtype button').on('click', select_annotation);
$('#editdialog').on('submit', edit_update);
$('#show,#hide').on('click', toggle_hide);

$('#controls').toggleClass('no-controls', query.controls === 'false');

// Default to near Fresno unless a position is specified.  If there is existing
// data, we frame the available data instead.
map = geo.map({
  node: '#map',
  center: {
    x: query.x !== undefined ? +query.x : -119.150,
    y: query.y !== undefined ? +query.y : 36.712
  },
  max: 21,
  zoom: query.zoom ? +query.zoom : 10,
  rotation: query.rotation ? +query.rotation * Math.PI / 180 : 0
});
// Create a tile layer
mapLayer = map.createLayer('osm', {
  url: query.basemap === 'custom' ? query.mapurl || '' : undefined,
  source: query.basemap === 'custom' ? undefined : query.basemap
});
// Create an annotation layer
layer = map.createLayer('annotation', {
  renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
  annotations: query.renderer ? undefined : geo.listAnnotations(),
  showLabels: query.labels === 'false' ? false : Object.keys(geo.annotation.state),
  clickToEdit: !query.clickmode || query.clickmode === 'edit'
});
// We have to hook the internal _updateLabels method so we can label vertices
// during editing.
let s__updateLabels = layer._updateLabels;
layer._updateLabels = (labels) => {
  layer.annotations().forEach((annotation, idx) => {
    if ([geo.annotation.state.create, geo.annotation.state.edit].indexOf(annotation.state()) >= 0) {
      labelVertices(annotation, idx, labels);
    }
  });
  s__updateLabels(labels);
  return layer;
};
// Bind to the mouse click and annotation mode events
layer.geoOn(geo.event.mouseclick, mouseClickToStart);
layer.geoOn(geo.event.annotation.mode, handleModeChange);
layer.geoOn(geo.event.annotation.add, handleAnnotationChange);
layer.geoOn(geo.event.annotation.update, handleAnnotationChange);
layer.geoOn(geo.event.annotation.remove, handleAnnotationChange);
layer.geoOn(geo.event.annotation.state, handleAnnotationChange);
// Add a scale widget
var uiLayer = map.createLayer('ui');
var scaleWidget = uiLayer.createWidget('scale', {
  position: {right: 10, bottom: 10},
  units: query.distunit === 'si' ? 'si' : 'miles'
});

map.draw();

// Pick which button is initially highlighted based on query parameters.
if (query.lastused || query.active) {
  if (query.active) {
    layer.mode(query.active);
  } else {
    $('.annotationtype button').removeClass('lastused active');
    $('.annotationtype button#' + query.lastused).addClass('lastused');
  }
}

// If we have geojson as a query parameter, populate our annotations
if (initialGeoJSON) {
  layer.geojson(initialGeoJSON, true);
  if (query.x === undefined || query.y === undefined) {
    let range = {};
    layer.annotations().forEach(a => {
      a.coordinates().forEach(pt => {
        if (range.left === undefined || pt.x < range.left) {
          range.left = pt.x;
        }
        if (range.bottom === undefined || pt.y < range.bottom) {
          range.bottom = pt.y;
        }
        if (range.right === undefined || pt.x > range.right) {
          range.right = pt.x;
        }
        if (range.top === undefined || pt.y > range.top) {
          range.top = pt.y;
        }
      });
    });
    map.bounds(range);
    map.zoom(map.zoom() - 0.25);
  }
}

/**
 * When the mouse is clicked, switch to adding an annotation if appropriate.
 *
 * @param {geo.event} evt geojs event.
 */
function mouseClickToStart(evt) {
  if (evt.handled || query.clickmode !== 'add') {
    return;
  }
  if (evt.buttonsDown.left) {
    if ($('.annotationtype button.lastused').hasClass('active') && query.keepadding === 'true') {
      return;
    }
    select_button('.annotationtype button.lastused');
  } else if (evt.buttonsDown.right) {
    select_button('.annotationtype button#' +
                  $('.annotationtype button.lastused').attr('next'));
  }
}

/**
 * Handle changes to our controls.
 *
 * @param evt jquery evt that triggered this call.
 */
function change_controls(evt) {
  var ctl = $(evt.target),
      param = ctl.attr('param-name'),
      value = ctl.val();
  if (ctl.is('[type="checkbox"]')) {
    value = ctl.is(':checked') ? 'true' : 'false';
  }
  if (value === '' && ctl.attr('placeholder')) {
    value = ctl.attr('placeholder');
  }
  if (!param || value === query[param]) {
    return;
  }
  switch (param) {
    case 'basemap':
      if (value === 'custom') {
        mapLayer.url(query.mapurl || '').attribution('').draw();
      } else {
        mapLayer.source(value).draw();
      }
      $('#mapurl').toggleClass('hidden', value !== 'custom');
      break;
    case 'mapurl':
      if (query.basemap === 'custom') {
        mapLayer.url(value || '').attribution('').draw();
      }
      break;
    case 'distunit':
      query[param] = value;
      layer.annotations().forEach(a => a.modified());
      layer.draw();
      handleAnnotationChange();
      scaleWidget.options('units', query.distunit === 'si' ? 'si' : 'miles');
      break;
    case 'areaunit':
      query[param] = value;
      layer.annotations().forEach(a => a.modified());
      layer.draw();
      handleAnnotationChange();
      break;
    case 'labels':
      layer.options('showLabels', value === 'false' ? false : Object.keys(geo.annotation.state));
      layer.draw();
      break;
    case 'clickmode':
      layer.options('clickToEdit', value === 'edit');
      layer.draw();
      break;
  }
  query[param] = value;
  if (value === '' || (ctl.attr('placeholder') &&
      value === ctl.attr('placeholder'))) {
    delete query[param];
  }
  // Update our query parameters, os when you reload the page it is in the
  // same state
  utils.setQuery(query);
}

/**
 * Toggle showing the full controls.
 */
function toggle_hide() {
  if (query.hide) {
    delete query.hide;
  } else {
    query.hide = 'true';
  }
  $('#controls').toggleClass('reduced', query.hide);
  utils.setQuery(query);
}

/**
 * Handle changes to the geojson.
 *
 * @param evt jquery evt that triggered this call.
 */
function change_geojson(evt) {
  var ctl = $(evt.target),
      value = ctl.val();
  // When we update the geojson from the textarea control, raise a flag so we
  // (a) ignore bad geojson, and (b) don't replace the user's geojson with
  // the auto-generated geojson
  fromGeojsonUpdate = true;
  var result = layer.geojson(value, 'update');
  if (query.save !== 'false' && result !== undefined) {
    var geojson = layer.geojson();
    query.geojson = geojson ? JSON.stringify(geojson) : undefined;
    utils.setQuery(query);
  }
  fromGeojsonUpdate = false;
}

/**
 * Handle selecting an annotation button.
 *
 * @param evt jquery evt that triggered this call.
 */
function select_annotation(evt) {
  select_button(evt.target);
}

/**
 * Select an annotation button by jquery selector.
 *
 * @param {object} ctl a jquery selector or element.
 */
function select_button(ctl) {
  ctl = $(ctl);
  var wasactive = ctl.hasClass('active'),
      id = ctl.attr('id');
  fromButtonSelect = true;
  layer.mode(wasactive ? null : id);
  fromButtonSelect = false;
}

/**
 * When the annotation mode changes, update the controls to reflect it.
 *
 * @param {geo.event} evt a geojs mode change event.
 */
function handleModeChange(evt) {
  // Highlight the current buttons based on the current mode
  var mode = layer.mode();
  $('.annotationtype button').removeClass('active');
  if (mode) {
    $('.annotationtype button').removeClass('lastused active');
    $('.annotationtype button#' + mode).addClass('lastused active');
  }
  $('#instructions').attr(
    'annotation', $('.annotationtype button.active').attr('id') || 'none');
  query.active = $('.annotationtype button.active').attr('id') || undefined;
  query.lastused = query.active ? undefined : $('.annotationtype button.lastused').attr('id');
  utils.setQuery(query);
  // If we are in keep-adding mode, and the mode changed to null, and that
  // wasn't caused by clicking the button, reenable the annotation mode.
  if (!mode && !fromButtonSelect && query.keepadding === 'true') {
    layer.mode($('.annotationtype button.lastused').attr('id'));
  }
}

/**
 * Calculate the length of an annotation.
 *
 * @param {geo.annotation} annotation The annotation.
 * @returns {number} The length in meters or `undefined`.
 */
function annotationLength(annotation) {
  let dist = 0,
      gcs = annotation.layer().map().ingcs(),
      pts = annotation.coordinates(gcs);
  if (pts.length < 2) {
    return;
  }
  if (['polygon', 'rectangle'].indexOf(annotation.type()) >= 0) {
    pts = pts.slice();
    pts.push(pts[0]);
  }
  for (let i = 0; i < pts.length - 1; i += 1) {
    let partial = geo.transform.vincentyDistance(pts[i], pts[i + 1], gcs);
    if (partial) {
      dist += partial.distance;
    }
  }
  return dist;
}

/**
 * Calculate the area of an annotation.  Use an equal-area projection centered
 * on the first vertex and then a simple 2-D polygon area calculation.
 *
 * @param {geo.annotation} annotation The annotation.
 * @returns {number} The area in square meters or `undefined`.
 */
function annotationArea(annotation) {
  let area = 0,
      pts = annotation.coordinates('EPSG:4326');
  if (pts.length < 3 || ['polygon', 'rectangle'].indexOf(annotation.type()) < 0) {
    return;
  }
  // By using an equal-area projection centered at one of the vertices, the
  // area calculation can be done with a simple formula.  For polygons with
  // long edges, this won't be accurate, however.
  let gcs = `+proj=laea +lat_0=${pts[0].y} +lon_0=${pts[0].x} +x_0=0 +y_0=0 +a=6371007.181 +b=6371007.181 +units=m +no_defs`;
  pts = annotation.coordinates(gcs).slice();
  pts.push(pts[0]);
  for (let i = 0; i < pts.length - 1; i += 1) {
    area += (pts[i + 1].y - pts[i].y) * (pts[i + 1].x + pts[i].x) / 2;
  }
  return Math.abs(area);
}

/**
 * Format a unit with at least three siginfiicant figures.
 *
 * @param {number} val The value.  A valance or area in base units.
 * @param {string} unit The name of the unit system.
 * @param {object[]} [table] The table of the unit system.
 * @returns {string} A formatted string or `undefined`.
 */
function formatUnit(val, unit, table) {
  if (val === undefined || val === null) {
    return;
  }
  table = table || geo.gui.scaleWidget.unitsTable;
  if (!table || !table[unit]) {
    return;
  }
  unit = table[unit];
  let pos;
  for (pos = 0; pos < unit.length - 1; pos += 1) {
    if (val < unit[pos + 1].scale) {
      break;
    }
  }
  unit = unit[pos];
  val /= unit.scale;
  let digits = Math.max(0, -Math.ceil(Math.log10(val)) + 3);
  if (digits > 10) {
    return;
  }
  let result = val.toFixed(digits);
  if (digits) {
    while (result.substr(result.length - 1) === '0') {
      result = result.substr(0, result.length - 1);
    }
    if (result.substr(result.length - 1) === '.') {
      result = result.substr(0, result.length - 1);
    }
  }
  return result + ' ' + unit.unit;
}

/**
 * Add the units to the name of the annotation if appropriate.
 *
 * @param {geo.annotation} annotation The annotation.
 */
function modifyAnnotation(annotation) {
  if (annotation._changed) {
    return;
  }
  annotation._changed = true;
  var s_labelRecord = annotation.labelRecord;
  // Hook into the labelRecord method to add the distance and area to the label
  annotation.labelRecord = () => {
    annotation.options('showLabel', query.labels === 'false' ? false : Object.keys(geo.annotation.state));
    let dist = annotationLength(annotation),
        area = annotationArea(annotation);
    var result = s_labelRecord();
    if (result) {
      dist = formatUnit(dist, query.distunit || 'decmiles');
      if (dist) {
        result.text += ' - ' + dist;
      }
      area = formatUnit(area, query.areaunit || 'decmiles', areaUnitsTable);
      if (area) {
        result.text += ' - ' + area;
      }
    }
    if (result.text !== annotation._lastResultText) {
      map.scheduleAnimationFrame(handleAnnotationChange);
      annotation._lastResultText = result.text;
    }
    return result;
  };
}

/**
 * Label all of the vertices and centers of edges of an annotation.
 *
 * @param {geo.annotation} annotation The annotation.
 * @param {number} annotationIndex The position of the annotation.
 * @param {object[]} labels The labels data array to extend.
 */
function labelVertices(annotation, annotationIndex, labels) {
  let gcs = annotation.layer().map().gcs(),
      pts = annotation.coordinates(gcs).slice();
  for (let i = 1; i < pts.length; i += 1) {
    if (pts[i].x === pts[i - 1].x && pts[i].y === pts[i - 1].y) {
      pts.splice(i, 1);
    }
  }
  if (pts.length < 3) {
    return;
  }
  if (['polygon', 'rectangle'].indexOf(annotation.type()) >= 0) {
    pts.push(pts[0]);
  }
  var style = labels[annotationIndex].style || {};
  var dist = [], tally = [0];
  for (let i = 0; i < pts.length - 1; i += 1) {
    let value = geo.transform.vincentyDistance(pts[i], pts[i + 1], gcs);
    dist.push(value ? value.distance : 0);
  }
  dist.forEach((d, i) => {
    tally.push(tally[i] + d);
  });
  pts.forEach((p, i) => {
    if (i) {
      labels.push({
        text: formatUnit(tally[i], query.distunit || 'decmiles') || '',
        position: p,
        style: Object.assign({}, style, {offset: {x: 12, y: 0}, textAlign: 'left'})
      });
    }
    if (i !== pts.length - 1) {
      labels.push({
        text: formatUnit(tally[tally.length - 1] - tally[i], query.distunit || 'decmiles') || '',
        position: p,
        style: Object.assign({}, style, {offset: {x: -12, y: 0}, textAlign: 'right'})
      });
      let p1 = {x: (pts[i + 1].x + p.x) / 2, y: (pts[i + 1].y + p.y) / 2};
      labels.push({
        text: formatUnit(dist[i], query.distunit || 'decmiles') || '',
        position: p1,
        style: Object.assign({}, style, {offset: {x: 10, y: 0}, textAlign: 'left'})
      });
    }
  });
}

/**
 * When an annotation is created or removed, update our list of annotations.
 *
 * @param {geo.event} evt a geojs mode change event.
 */
function handleAnnotationChange(evt) {
  var annotations = layer.annotations();
  var ids = annotations.map(function (annotation) {
    return annotation.id();
  });
  var present = [];
  $('#annotationlist .entry').each(function () {
    var entry = $(this);
    if (entry.attr('id') === 'sample') {
      return;
    }
    var id = entry.attr('annotation-id');
    // Remove deleted annotations
    if ($.inArray(id, ids) < 0) {
      entry.remove();
      return;
    }
    present.push(id);
    // Update existing elements
    entry.find('.entry-name').text(layer.annotationById(id).name());
  });
  let totaldist = 0, totalarea = 0;
  // Add if new and fully created
  $.each(ids, function (idx, id) {
    var annotation = layer.annotationById(id);
    let dist = annotationLength(annotation),
        area = annotationArea(annotation);
    if (dist) { totaldist += dist; }
    if (area) { totalarea += area; }
    dist = formatUnit(dist, query.distunit || 'decmiles') || '';
    area = formatUnit(area, query.areaunit || 'decmiles', areaUnitsTable);
    if (area) {
      dist = (dist ? dist + ' - ' : '') + area;
    }
    if ($.inArray(id, present) >= 0) {
      $('#annotationlist .entry[annotation-id="' + id + '"] .entry-dist').text(dist);
      return;
    }
    if (!annotation._changed) {
      modifyAnnotation(annotation);
    }
    if (annotation.state() === geo.annotation.state.create) {
      return;
    }
    var entry = $('#annotationlist .entry#sample').clone();
    entry.attr({id: '', 'annotation-id': id});
    entry.find('.entry-name').text(annotation.name());
    entry.find('.entry-dist').text(dist);
    $('#annotationlist').append(entry);
  });
  let dist = formatUnit(totaldist || undefined, query.distunit || 'decmiles') || '';
  let area = formatUnit(totalarea || undefined, query.areaunit || 'decmiles', areaUnitsTable);
  if (area) {
    dist = (dist ? dist + ' - ' : '') + area;
  }
  $('#annotationheader .entry-dist').text(dist);
  $('#annotationheader').toggleClass('present', $('#annotationlist .entry').length > 1);
  if (!fromGeojsonUpdate) {
    // Update the geojson textarea
    var geojson = layer.geojson();
    $('#geojson').val(geojson ? JSON.stringify(geojson, undefined, 2) : '');
    if (query.save !== 'false') {
      query.geojson = geojson ? JSON.stringify(geojson) : undefined;
      utils.setQuery(query);
    }
  }
}

/**
 * Handle selecting a control.
 *
 * @param evt jquery evt that triggered this call.
 */
function select_control(evt) {
  var mode,
      ctl = $(evt.target),
      action = ctl.attr('action'),
      id = ctl.closest('.entry').attr('annotation-id'),
      annotation = layer.annotationById(id);
  switch (action) {
    case 'adjust':
      layer.mode(layer.modes.edit, annotation);
      layer.draw();
      break;
    case 'edit':
      show_edit_dialog(id);
      break;
    case 'remove':
      layer.removeAnnotation(annotation);
      break;
    case 'remove-all':
      fromButtonSelect = true;
      mode = layer.mode();
      layer.mode(null);
      layer.removeAllAnnotations();
      layer.mode(mode);
      fromButtonSelect = false;
      break;
  }
}

/**
 * Show the edit dialog for a particular annotation.
 *
 * @param {number} id the annotation id to edit.
 */
function show_edit_dialog(id) {
  var annotation = layer.annotationById(id),
      type = annotation.type(),
      typeMatch = new RegExp('(^| )(' + type + '|all)( |$)'),
      opt = annotation.options(),
      dlg = $('#editdialog');

  $('#edit-validation-error', dlg).text('');
  dlg.attr('annotation-id', id);
  dlg.attr('annotation-type', type);
  $('[option="name"]', dlg).val(annotation.name());
  $('[option="label"]', dlg).val(annotation.label(undefined, true));
  $('[option="description"]', dlg).val(annotation.description());
  // Populate each control with the current value of the annotation
  $('.form-group[annotation-types]').each(function () {
    var ctl = $(this),
        key = $('[option]', ctl).attr('option'),
        format = $('[option]', ctl).attr('format'),
        value;
    if (!ctl.attr('annotation-types').match(typeMatch)) {
      // If a property doesn't exist for the current annotation's type, hide
      // the control
      ctl.hide();
      return;
    }
    ctl.show();
    switch ($('[option]', ctl).attr('optiontype')) {
      case 'option':
        value = opt[key];
        if (key === 'showLabel') {
          value = '' + !!opt.showLabel;
        }
        break;
      case 'label':
        value = (opt.labelStyle || {})[key];
        break;
      default:
        value = opt.style[key];
        break;
    }
    switch (format) {
      case 'angle':
        if (value !== undefined && value !== null && value !== '') {
          value = '' + +(+value * 180.0 / Math.PI).toFixed(4) + ' deg';
        }
        break;
      case 'color':
        // always show colors as hex values
        value = geo.util.convertColorToHex(value || {r: 0, g: 0, b: 0}, 'needed');
        break;
      case 'coordinate2':
        if (value !== undefined && value !== null && value !== '') {
          value = '' + value.x + ', ' + value.y;
        }
    }
    if ((value === undefined || value === '' || value === null) && $('[option]', ctl).is('select')) {
      value = $('[option] option', ctl).eq(0).val();
    }
    $('[option]', ctl).val(value === undefined ? '' : '' + value);
  });
  dlg.one('shown.bs.modal', function () {
    $('[option="name"]', dlg).focus();
  });
  dlg.modal();
}

/**
 * Update an annotation from values in the edit dialog.
 *
 * @param evt jquery evt that triggered this call.
 */
function edit_update(evt) {
  evt.preventDefault();
  var dlg = $('#editdialog'),
      id = dlg.attr('annotation-id'),
      annotation = layer.annotationById(id),
      opt = annotation.options(),
      type = annotation.type(),
      typeMatch = new RegExp('(^| )(' + type + '|all)( |$)'),
      newopt = {style: {}, labelStyle: {}},
      error;

  // Validate form values
  $('.form-group[annotation-types]').each(function () {
    var ctl = $(this),
        key = $('[option]', ctl).attr('option'),
        format = $('[option]', ctl).attr('format'),
        value, oldvalue;
    if (!ctl.attr('annotation-types').match(typeMatch)) {
      return;
    }
    value = $('[option]', ctl).val();
    switch (format) {
      case 'angle':
        if (/^\s*[.0-9eE]+\s*$/.exec(value)) {
          value += 'deg';
        }
        break;
    }
    switch (key) {
      case 'textScaled':
        if (['true', 'on', 'yes'].indexOf(value.trim().toLowerCase()) >= 0) {
          value = map.zoom();
        }
        break;
    }
    value = layer.validateAttribute(value, format);
    switch ($('[option]', ctl).attr('optiontype')) {
      case 'option':
        oldvalue = opt[key];
        break;
      case 'label':
        oldvalue = (opt.labelStyle || {})[key];
        break;
      default:
        oldvalue = opt.style[key];
        break;
    }
    if (value === oldvalue || (oldvalue === undefined && value === '')) {
      // don't change anything
    } else if (value === undefined) {
      error = $('label', ctl).text() + ' is not a valid value';
    } else {
      switch ($('[option]', ctl).attr('optiontype')) {
        case 'option':
          newopt[key] = value;
          break;
        case 'label':
          newopt.labelStyle[key] = value;
          break;
        default:
          newopt.style[key] = value;
          break;
      }
    }
  });
  if (error) {
    $('#edit-validation-error', dlg).text(error);
    return;
  }
  annotation.name($('[option="name"]', dlg).val());
  annotation.label($('[option="label"]', dlg).val() || null);
  annotation.description($('[option="description"]', dlg).val() || '');
  annotation.options(newopt).draw();

  dlg.modal('hide');
  // Refresh the annotation list
  handleAnnotationChange();
}
