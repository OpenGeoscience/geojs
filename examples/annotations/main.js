/* globals $, geo, utils */

var annotationDebug = {};

var layer, fromButtonSelect, fromGeojsonUpdate;

// get the query parameters and set controls appropriately
var query = utils.getQuery();
$('#clickmode').val(query.clickmode || 'edit');
$('#keepadding').prop('checked', query.keepadding === 'true');
$('#showLabels').prop('checked', query.labels !== 'false');
if (query.lastannotation && query.clickmode !== 'brush') {
  $('.annotationtype button').removeClass('lastused');
  $('.annotationtype button#' + query.lastannotation).addClass('lastused');
}
$('#brushshape').val(query.brushshape || 'square');
if (query.brushsize) {
  $('#brushsize').val(query.brushsize);
}
// You can set the initial annotations via a query parameter.  If the query
// parameter 'save=true' is specified, the query will be updated with the
// geojson.  This can become too long for some browsers.
var initialGeoJSON = query.geojson;

// respond to changes in our controls
$('#controls').on('change', change_controls);
$('#geojson[type=textarea]').on('input propertychange', change_geojson);
$('#controls').on('click', 'a', select_control);
$('.annotationtype button').on('click', select_annotation);
$('#editdialog').on('submit', edit_update);

$('#controls').toggleClass('no-controls', query.controls === 'false');

// start the map near Fresno unless the query parameters say to do otherwise
var map = geo.map({
  node: '#map',
  center: {
    x: query.x ? +query.x : -119.150,
    y: query.y ? +query.y : 36.712
  },
  zoom: query.zoom ? +query.zoom : 10,
  rotation: query.rotation ? +query.rotation * Math.PI / 180 : 0
});
// allow some query parameters to specify what map we will show
if (query.map !== 'false') {
  if (query.map !== 'satellite') {
    annotationDebug.mapLayer = map.createLayer('osm');
  }
  if (query.map === 'satellite' || query.map === 'dual') {
    annotationDebug.satelliteLayer = map.createLayer('osm', {url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png', opacity: query.map === 'dual' ? 0.25 : 1});
  }
}
// create an annotation layer
layer = map.createLayer('annotation', {
  renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
  annotations: query.renderer ? undefined : geo.listAnnotations(),
  showLabels: query.labels !== 'false',
  clickToEdit: !query.clickmode || query.clickmode === 'edit'
});
// bind to the mouse click and annotation mode events
layer.geoOn(geo.event.mouseclick, mouseClickToStart);
layer.geoOn(geo.event.annotation.mode, handleModeChange);
layer.geoOn(geo.event.annotation.add, handleAnnotationChange);
layer.geoOn(geo.event.annotation.update, handleAnnotationChange);
layer.geoOn(geo.event.annotation.remove, handleAnnotationChange);
layer.geoOn(geo.event.annotation.state, handleAnnotationChange);

let brushLayer;

map.draw();

// pick which button is initially highlighted based on query parameters.
if (query.lastused || query.active) {
  if (query.active && query.clickmode !== 'brush') {
    layer.mode(query.active);
  } else {
    $('.annotationtype button').removeClass('lastused active');
    $('.annotationtype button#' + (query.lastused || query.active)).addClass('lastused');
  }
}

// if we have geojson as a query parameter, populate our annotations
if (initialGeoJSON) {
  layer.geojson(initialGeoJSON, true);
}

if (query.clickmode === 'brush') {
  setBrushMode();
}

// expose some internal parameters so you can examine them from the console
annotationDebug.map = map;
annotationDebug.layer = layer;
annotationDebug.query = query;

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
 * Handle a click or drag with a brush.
 *
 * @param {object} evt The event with the activity.
 * */
let lastState;
function brushAction(evt) {
  let source;
  if (evt.event === geo.event.annotation.cursor_action) {
    if (evt.operation && evt.operation !== 'union' && evt.operation !== 'difference') {
      return;
    }
    // if this is the same action as the previous one, "blur" the brush shapes
    // along the direction of travel
    if (lastState && lastState.stateId && lastState.stateId === evt.evt.state.stateId) {
      const shape = $('#brushshape').val();
      const size = parseInt($('#brushsize').val());
      source = brushLayer.toPolygonList();
      const bbox1 = brushLayer.annotations()[0]._coordinates();
      const bbox2 = lastState.bbox;
      if (bbox1[0].x !== bbox2[0].x || bbox1[0].y !== bbox2[0].y) {
        if (shape === 'square') {
          const order = (bbox1[0].x - bbox2[0].x) * (bbox1[0].y - bbox2[0].y) < 0 ? 0 : 1;
          source.push([[
            [bbox1[order].x, bbox1[order].y],
            [bbox1[order + 2].x, bbox1[order + 2].y],
            [bbox2[order + 2].x, bbox2[order + 2].y],
            [bbox2[order].x, bbox2[order].y]
          ]]);
        } else {
          const c1x = (bbox1[0].x + bbox1[2].x) * 0.5;
          const c1y = (bbox1[0].y + bbox1[2].y) * 0.5;
          const c2x = (bbox2[0].x + bbox2[2].x) * 0.5;
          const c2y = (bbox2[0].y + bbox2[2].y) * 0.5;
          const ang = Math.atan2(c2y - c1y, c2x - c1x) + Math.PI / 2;
          source.push([[
            [c1x + size / 2 * Math.cos(ang), c1y + size / 2 * Math.sin(ang)],
            [c1x - size / 2 * Math.cos(ang), c1y - size / 2 * Math.sin(ang)],
            [c2x - size / 2 * Math.cos(ang), c2y - size / 2 * Math.sin(ang)],
            [c2x + size / 2 * Math.cos(ang), c2y + size / 2 * Math.sin(ang)]
          ]]);
        }
      }
    }
    lastState = evt.evt.state;
    lastState.bbox = brushLayer.annotations()[0]._coordinates();
  } else {
    lastState = null;
  }
  geo.util.polyops[evt.operation || 'union'](layer, source || brushLayer, {correspond: {}, keepAnnotations: 'exact', style: layer});
}

/**
 * If the brush mode ends but we are supposed to be in brush mode, reset it.
 */
var inUpdateBrushMode;
function updateBrushMode() {
  if (query.clickmode !== 'brush') {
    return;
  }
  if (!inUpdateBrushMode) {
    inUpdateBrushMode = true;
    window.setTimeout(() => {
      setBrushMode();
      inUpdateBrushMode = false;
    }, 1);
  }
}

/**
 * If we are switching to brush mode, create an annotation that will be used
 * and hook to annotation cursor events.  If switching away, remove such an
 * annotation.
 */
function setBrushMode(mode) {
  if (brushLayer) {
    brushLayer.mode(null);
    brushLayer.removeAllAnnotations();
  }
  if (query.clickmode !== 'brush') {
    return;
  }
  layer.mode(null);
  if (!brushLayer) {
    brushLayer = map.createLayer('annotation', {
      renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
      showLabels: false
    });
    brushLayer.geoOn(geo.event.annotation.cursor_click, brushAction);
    brushLayer.geoOn(geo.event.annotation.cursor_action, brushAction);
    brushLayer.geoOn(geo.event.annotation.mode, updateBrushMode);
    brushLayer.geoOn(geo.event.annotation.state, updateBrushMode);
  }
  annotationDebug.brushLayer = brushLayer;
  const shape = $('#brushshape').val();
  const size = parseInt($('#brushsize').val());
  const annot = geo.registries.annotations[shape].func({layer: layer});
  brushLayer.addAnnotation(annot);
  annot._coordinates([{x: 0, y: 0}, {x: size, y: 0}, {x: size, y: size}, {y: size, x: 0}]);
  brushLayer.mode(brushLayer.modes.cursor, annot);
  map.draw();
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
    case 'labels':
      layer.options('showLabels', '' + value !== 'false');
      layer.draw();
      break;
    case 'clickmode':
      layer.options('clickToEdit', value === 'edit');
      layer.draw();
      if (value === 'brush') {
        $('.annotationtype button').removeClass('lastused active');
        query.lastused = query.active ? query.active : query.lastused;
        query.active = undefined;
      }
      break;
  }
  query[param] = value;
  if (value === '' || (ctl.attr('placeholder') &&
      value === ctl.attr('placeholder'))) {
    delete query[param];
  }
  // update our query parameters, os when you reload the page it is in the
  // same state
  utils.setQuery(query);
  if (['clickmode', 'brushshape', 'brushsize'].indexOf(param) >= 0) {
    setBrushMode();
  }
}

/**
 * Handle changes to the geojson.
 *
 * @param evt jquery evt that triggered this call.
 */
function change_geojson(evt) {
  var ctl = $(evt.target),
      value = ctl.val();
  // when we update the geojson from the textarea control, raise a flag so we
  // (a) ignore bad geojson, and (b) don't replace the user's geojson with
  // the auto-generated geojson
  fromGeojsonUpdate = true;
  var result = layer.geojson(value, 'update');
  if (query.save && result !== undefined) {
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
  if (query.clickmode === 'brush') {
    query.clickmode = 'edit';
    layer.options('clickToEdit', true);
    $('#clickmode').val(query.clickmode);
    utils.setQuery(query);
    setBrushMode();
  }
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
  // highlight the current buttons based on the current mode
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
  // if we are in keep-adding mode, and the mode changed to null, and that
  // wasn't caused by clicking the button, reenable the annotation mode.
  if (!mode && !fromButtonSelect && query.keepadding === 'true' && query.clickmode !== 'brush') {
    layer.mode($('.annotationtype button.lastused').attr('id'));
  }
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
    if (!ids.includes(id)) {
      entry.remove();
      return;
    }
    present.push(id);
    // update existing elements
    entry.find('.entry-name').text(layer.annotationById(id).name());
  });
  // Add if new and fully created
  $.each(ids, function (idx, id) {
    if (present.includes(id)) {
      return;
    }
    var annotation = layer.annotationById(id);
    if (annotation.state() === geo.annotation.state.create) {
      return;
    }
    var entry = $('#annotationlist .entry#sample').clone();
    entry.attr({id: '', 'annotation-id': id});
    entry.find('.entry-name').text(annotation.name());
    $('#annotationlist').append(entry);
  });
  $('#annotationheader').css(
    'display', $('#annotationlist .entry').length <= 1 ? 'none' : 'block');
  if (!fromGeojsonUpdate) {
    // update the geojson textarea
    var geojson = layer.geojson();
    $('#geojson').val(geojson ? JSON.stringify(geojson, undefined, 2) : '');
    if (query.save) {
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
  // populate each control with the current value of the annotation
  $('.form-group[annotation-types]').each(function () {
    var ctl = $(this),
        key = $('[option]', ctl).attr('option'),
        format = $('[option]', ctl).attr('format'),
        value;
    if (!ctl.attr('annotation-types').match(typeMatch)) {
      // if a property doesn't exist for the current annotation's type, hide
      // the control
      ctl.hide();
      return;
    }
    ctl.show();
    switch ($('[option]', ctl).attr('optiontype')) {
      case 'option':
        value = opt[key];
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

  // validate form values
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
  // refresh the annotation list
  handleAnnotationChange();
}
