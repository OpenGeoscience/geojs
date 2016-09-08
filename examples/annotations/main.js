/* globals $, geo, utils */

var annotationDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  var layer, fromButtonSelect;

  // get the query parameters and set controls appropriately
  var query = utils.getQuery();
  $('#clickadd').prop('checked', query.clickadd !== 'false');
  $('#keepadding').prop('checked', query.keepadding === 'true');
  if (query.lastannotation) {
    $('.annotationtype button').removeClass('lastused');
    $('.annotationtype button#' + query.lastannotation).addClass('lastused');
  }

  $('#controls').on('change', change_controls);
  $('#controls').on('click', 'a', select_control);
  $('.annotationtype button').on('click', select_annotation);

  var map = geo.map({
    node: '#map',
    center: {
      x: -119.5420833,
      y: 37.4958333
    },
    zoom: 8
  });
  // allow some query parameters without controls to specify what map we will
  // show
  if (query.map !== 'false') {
    if (query.map !== 'satellite') {
      annotationDebug.mapLayer = map.createLayer('osm');
    }
    if (query.map === 'satellite' || query.map === 'dual') {
      annotationDebug.satelliteLayer = map.createLayer('osm', {url: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png', opacity: query.map === 'dual' ? 0.25 : 1});
    }
  }
  // create an annotation layer
  layer = map.createLayer('annotation', {
    renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
    features: query.renderer ? undefined : ['polygon', 'line', 'point']
  });
  // bind to the mouse click and annotation mode events
  layer.geoOn(geo.event.mouseclick, mouseClickToStart);
  layer.geoOn(geo.event.annotation.mode, handleModeChange);
  layer.geoOn(geo.event.annotation.add, handleAnnotationChange);
  layer.geoOn(geo.event.annotation.remove, handleAnnotationChange);
  layer.geoOn(geo.event.annotation.state, handleAnnotationChange);

  map.draw();

  // pick which button is initially highlighted based on query parameters.
  if (query.lastused || query.active) {
    if (query.active) {
      layer.mode(query.active);
    } else {
      $('.annotationtype button').removeClass('lastused active');
      $('.annotationtype button#' + query.lastused).addClass('lastused');
    }
  }

  // expose some internal parameters so you can examine them from the console
  annotationDebug.map = map;
  annotationDebug.layer = layer;
  annotationDebug.query = query;

  /**
   * When the mouse is clicked, switch adding an annotation if appropriate.
   *
   * @param {geo.event} evt geojs event.
   */
  function mouseClickToStart(evt) {
    if (evt.handled || query.clickadd === 'false') {
      return;
    }
    if (evt.buttonsDown.left) {
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
    /*
    var processedValue = (ctl.is('[type="checkbox"]') ?
        (value === 'true') : value);
    switch (param) {
      case 'clickadd':

        break;
    }
    */
    query[param] = value;
    if (value === '' || (ctl.attr('placeholder') &&
        value === ctl.attr('placeholder'))) {
      delete query[param];
    }
    utils.setQuery(query);
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
    if (!mode && !fromButtonSelect && query.keepadding === 'true') {
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
      if ($.inArray(id, ids) < 0) {
        entry.remove();
        return;
      }
      present.push(id);
      // update existing elements
      entry.find('.entry-name').text(layer.annotationById(id).name());
    });
    // Add if new and fully created
    $.each(ids, function (idx, id) {
      if ($.inArray(id, present) >= 0) {
        return;
      }
      var annotation = layer.annotationById(id);
      if (annotation.state() === 'create') {
        return;
      }
      var entry = $('#annotationlist .entry#sample').clone();
      entry.attr({id: '', 'annotation-id': id});
      entry.find('.entry-name').text(annotation.name());
      $('#annotationlist').append(entry);
    });
    $('#annotationheader').css(
        'display', $('#annotationlist .entry').length <= 1 ? 'none' : 'block');
  }

  /**
   * Handle selecting a control.
   *
   * @param evt jquery evt that triggered this call.
   */
  function select_control(evt) {
    var mode;
    var ctl = $(evt.target),
        action = ctl.attr('action'),
        id = ctl.closest('.entry').attr('annotation-id');
    switch (action) {
      case 'edit':
        // TODO: add edit controls
        break;
      case 'remove':
        layer.removeAnnotation(layer.annotationById(id));
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
});
