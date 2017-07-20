/* globals utils */

// Run after the DOM loads
$(function () {
  'use strict';

  // Get query parameters
  var query = utils.getQuery();

  // Create a map centered on Clifton Park, NY
  var map = geo.map({
    node: '#map',
    center: {
      x: -73.7593015,
      y: 42.8496799
    },
    zoom: 11
  });
  var osm, mapUrl, layer, lineFeature, lines, rawdata, skipdraw;

  // By default, use the best renderer that supports lines.  This can be
  // changed on with the 'renderer' query parameter to force a particular
  // renderer
  var layerOptions = {
    renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
    features: query.renderer ? undefined : ['line']
  };
  // Defaults for the line controls
  var defaultStyles = {
    antialiasing: 2,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    strokeColor: 'black',
    strokeOffset: 0,
    strokeOpacity: 1,
    strokeWidth: 2
  };
  var lineOptions = {
    style: $.extend({
      // Our data set is a set of lines, some of which form closed loops.  If
      // a line is a series of points where the first and last point coincide,
      // flag it as closed so that the end is properly mitered
      closed: function (line, idx) {
        return (line.data[0][0] === line.data[line.data.length - 1][0] &&
                line.data[0][1] === line.data[line.data.length - 1][1]);
      },
      // If the query parameter 'debug=true' is added, pixels visited and
      // discarded by the fragment shader will appear in red.  This slows down
      // rendering
      debug: query.debug ? query.debug === 'true' : undefined
    }, defaultStyles)
  };

  // Parse query parameters and adjust styles to match
  $.each(query, function (key, value) {
    var ctlvalue, ctlkey = key;
    switch (key) {
      case 'antialiasing':
        value = value.length ? parseFloat(value) : undefined;
        if (!isNaN(value) && value >= 0 && value !== undefined) {
          lineOptions.style[key] = ctlvalue = value;
        }
        break;
      case 'hovertext':
        ctlvalue = value === 'true';
        lineOptions.selectionAPI = value;
        break;
      case 'lineCap':
      case 'lineJoin':
      case 'strokeColor':
      case 'strokeOffset':
      case 'strokeOpacity':
      case 'strokeWidth':
        lineOptions.style[key] = getStyle(key, value);
        ctlvalue = value;
        break;
      case 'lines':
        if (value.length) {
          lines = ctlvalue = parseInt(value, 10);
        }
        break;
      case 'showmap':
        ctlvalue = value !== 'false';
        break;
      case 'miterLimit':
        value = value.length ? parseFloat(value) : undefined;
        if (!isNaN(value) && value > 0 && value !== undefined) {
          lineOptions.style[key] = ctlvalue = value;
        }
        break;
    }
    if (ctlvalue !== undefined) {
      if ($('#' + ctlkey).is('[type="checkbox"]')) {
        $('#' + ctlkey).prop('checked', ctlvalue);
      } else {
        $('#' + ctlkey).val(ctlvalue);
      }
    }
  });
  // When a preset button is clicked, show the preset.
  $('button.preset').on('click', select_preset);

  /**
   * Based on the current controls, fetch a data set and show it.
   */
  function fetch_data() {
    var url = '../data/roads.json';
    $.ajax(url, {
      success: function (resp) {
        window.example.rawdata = rawdata = resp;
        var segments = 0;
        for (var i = 0; i < rawdata.length; i += 1) {
          segments += rawdata[i].data.length - 1;
        }
        var text = 'Loaded: ' + segments;
        $('#lines-loaded').text(text).attr('title', text);
        show_lines(rawdata);
      }
    });
  }

  /**
   * Given a set of lines, optionally truncate or expand it, then show it as a
   * lineFeature.
   *
   * @param {array} rawdata: an array of lines to show.  Each entry contains an
   *    object that has a 'data' element which is an array of points that form
   *    the line.
   */
  function show_lines(rawdata) {
    $('#map').removeClass('ready').attr('segments', '');
    if (!rawdata) {
      return;
    }
    // The number of lines specified in the control is used to determine the
    // number of line segments that are shown.  Since lines can be composed of
    // any number of segments, we have to keep a tally.
    var maxsegments = parseInt(lines, 10) || 10000, numlines, segments = 0;
    for (numlines = 0; numlines < rawdata.length && segments < maxsegments; numlines += 1) {
      segments += rawdata[numlines].data.length - 1;
    }
    var data = rawdata.slice(0, numlines);
    lineFeature.data(data);
    lineFeature.draw();
    var text = 'Shown: ' + segments;
    $('#lines-shown').text(text).attr('title', text);
    map.onIdle(function () {
      $('#map').addClass('ready').attr('segments', maxsegments);
    });
  }

  /**
   * For styles that can vary, parse the string and either return a simple
   * string or a function that computes the value.
   *
   * @param {string} key: the property key.  Used to get a default value if
   *    needed.
   * @param {string} value: the string form of the value.  If this has a { in
   *    it, it is parsed as a JSON dictionary, and expects to be a list of
   *    category names which are used to determine the values.  These values
   *    applied uniformly per line.  Otherwise, if this has a , in it, it is a
   *    comma-separated list.  If prefixed with 'line:' these are applied in a
   *    cycle across lines.  Without that prefix, these are applied in a cycle
   *    across vertices.  If neither { or , are in the value, then the value is
   *    used as is, uniformly.
   * @return {string|function} the style string or function.
   */
  function getStyle(key, value) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    value = '' + value;
    if (value.indexOf('{') >= 0) {
      try {
        value = JSON.parse(value);
      } catch (err) {
        return value;
      }
      return function (d, i, line, idx) {
        line = rawdata[idx];
        if (value[line.highway] !== undefined) {
          return value[line.highway];
        }
        return value.other !== undefined ? value.other : defaultStyles[key];
      };
    }
    if (value.indexOf(',') >= 0) {
      if (value.substr(0, 5) === 'line:') {
        value = value.substr(5).split(',');
        return function (d, i, line, idx) {
          return value[idx % value.length];
        };
      } else {
        value = value.split(',');
        return function (d, i) {
          return value[i % value.length];
        };
      }
    }
    return value;
  }

  /**
   * Handle changes to our controls.
   *
   * @param {object} evt jquery evt that triggered this call.
   */
  function change_controls(evt) {
    var ctl = $(evt.target),
        param = ctl.attr('id'),
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
    var processedValue = (ctl.is('[type="checkbox"]') ?
                          (value === 'true') : value);
    if (ctl.closest('table.gradient').length) {
      param = 'gradient';
    }
    switch (param) {
      case 'antialiasing':
        value = value.length ? parseFloat(value) : undefined;
        if (isNaN(value) || value < 0 || value === undefined) {
          return;
        }
        lineOptions.style[param] = value;
        lineFeature.style(param, value);
        if (!skipdraw) {
          lineFeature.draw();
        }
        break;
      case 'hovertext':
        lineOptions.selectionAPI = processedValue;
        lineFeature.selectionAPI(processedValue);
        break;
      case 'lineCap':
      case 'lineJoin':
      case 'strokeColor':
      case 'strokeOffset':
      case 'strokeOpacity':
      case 'strokeWidth':
        processedValue = getStyle(param, processedValue);
        lineOptions.style[param] = processedValue;
        lineFeature.style(param, processedValue);
        if (!skipdraw) {
          lineFeature.draw();
        }
        break;
      case 'lines':
        lines = parseInt(value);
        show_lines(rawdata);
        break;
      case 'showmap':
        set_osm_url(value);
        break;
      case 'miterLimit':
        value = value.length ? parseFloat(value) : undefined;
        if (isNaN(value) || value <= 0 || value === undefined) {
          return;
        }
        lineOptions.style[param] = value;
        lineFeature.style(param, value);
        if (!skipdraw) {
          lineFeature.draw();
        }
        break;
    }
    // Update the url to reflect the changes
    query[param] = value;
    if (value === '' || (ctl.attr('placeholder') &&
        '' + value === ctl.attr('placeholder'))) {
      delete query[param];
    }
    var newurl = window.location.protocol + '//' + window.location.host +
        window.location.pathname + '?' + $.param(query);
    window.history.replaceState(query, '', newurl);
  }

  /**
   * Handle selecting a preset button.
   *
   * @param {object} evt: jquery event with the triggered button.
   */
  function select_preset(evt) {
    var update;
    var ctl = $(evt.target);
    var keys = [
      'antialiasing', 'lineCap', 'lineJoin', 'lines', 'miterLimit', 'showmap',
      'strokeColor', 'strokeOffset', 'strokeOpacity', 'strokeWidth'];
    skipdraw = true;
    $.each(keys, function (idx, key) {
      var value = ctl.attr(key);
      if (value !== undefined && $('#' + key).val() !== value) {
        if (key === 'showmap') {
          $('#' + key).prop('checked', value === 'true').trigger('change');
        } else {
          $('#' + key).val(value).trigger('change');
        }
      }
      update = true;
    });
    skipdraw = false;
    if (update) {
      lineFeature.draw();
    }
  }

  /**
   * Set the map to either use the original default url or a blank white image.
   *
   * @param {string} value: 'false' to use a white image, anything else to use
   *    the original url.
   */
  function set_osm_url(value) {
    if (!mapUrl) {
      mapUrl = {url: osm.url(), attribution: osm.attribution()};
    }
    osm.url(
      value !== 'false' ? mapUrl.url :
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12P4DwABAQEAG7buVgAAAABJRU5ErkJggg=='  /* white 1x1 */
    );
    osm.attribution(value !== 'false' ? mapUrl.attribution : '');
  }

  // Create a tile layer
  osm = map.createLayer('osm');
  set_osm_url(query.showmap);
  // Create a feature layer for the lines
  layer = map.createLayer('feature', layerOptions);
  // Create a tool-tip layer above the line layer
  var uiLayer = map.createLayer('ui', {zIndex: 2});
  var tooltip = uiLayer.createWidget('dom', {position: {x: 0, y: 0}});
  var tooltipElem = $(tooltip.canvas()).attr('id', 'tooltip').addClass(
      'hidden');
  // Ceate a line feature
  lineFeature = layer.createFeature('line', lineOptions)
    .line(function (d) {
      return d.data;
    })
    .position(function (d) {
      return {x: d[0], y: d[1]};
    })
    // add hover events -- use mouseon and mouseoff, since we only show one
    // tootip.  If we showed one tooltip per item we were over, use mouseover
    // and mouseout.
    .geoOn(geo.event.feature.mouseon, function (evt) {
      var text = (evt.data.name ? evt.data.name : '') +
                 (evt.data.highway ? ' (' + evt.data.highway + ')' : '');
      if (text) {
        tooltip.position(evt.mouse.geo);
        tooltipElem.text(text);
      }
      tooltipElem.toggleClass('hidden', !text);
    })
    .geoOn(geo.event.feature.mouseoff, function (evt) {
      tooltipElem.addClass('hidden');
    });

  // Make some values available in the global context so curious people can
  // play with them.
  window.example = {
    map: map,
    osm: osm,
    layer: layer,
    layerOptions: layerOptions,
    line: lineFeature,
    lineOptions: lineOptions,
    tooltip: tooltip,
    tooltipElem: tooltipElem,
    ui: uiLayer
  };

  // Load our data set
  fetch_data();
  $('#controls').on('change', change_controls);
});
