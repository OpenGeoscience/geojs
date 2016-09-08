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

  map.draw();

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
    var newurl = window.location.protocol + '//' + window.location.host +
        window.location.pathname + '?' + $.param(query);
    window.history.replaceState(query, '', newurl);
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
    // if we are in keep-adding mode, and the mode changed to null, and that
    // wasn't caused by clicking the button, reenabled the annotation mode.
    if (!mode && !fromButtonSelect && query.keepadding === 'true') {
      layer.mode($('.annotationtype button.lastused').attr('id'));
    }
  }
});
