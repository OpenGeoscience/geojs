/* globals utils */

// Run after the DOM loads
$(function () {
  'use strict';

  var query = utils.getQuery();

  var map = geo.map({
    node: '#map',
    center: {
      x: -73.7593015,
      y: 42.8496799
    },
    zoom: 10
  });
  var layer, lineFeature, lines, rawdata, skipdraw;

  var layerOptions = {
    renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
    features: query.renderer ? undefined : ['line']
  };
  var defaultStyles = {
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
      closed: function (line, idx) {
        return (line.data[0][0] === line.data[line.data.length - 1][0] &&
                line.data[0][1] === line.data[line.data.length - 1][1]);
      },
      debug: query.debug ? query.debug === 'true' : undefined
    }, defaultStyles)
  };

  $.each(query, function (key, value) {
    var ctlvalue, ctlkey = key;
    switch (key) {
      case 'antialiasing':
        value = value.length ? parseFloat(value) : undefined;
        if (!isNaN(value) && value >= 0 && value !== undefined) {
          lineOptions.style[key] = ctlvalue = value;
        }
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
      case 'miterLimit':
        value = value.length ? parseFloat(value) : undefined;
        if (!isNaN(value) && value > 0 && value !== undefined) {
          lineOptions.style[key] = ctlvalue = value;
        }
        break;
      /* debug */
    }
    if (ctlvalue !== undefined) {
      $('#' + ctlkey).val(ctlvalue);
    }
  });
  $('button.preset').on('click', select_preset);

  /* Based on the current controls, fetch a data set and show it.
   */
  function fetch_data() {
    var url = '../../data/roads.json';
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

  /* Given a set of datalines, optionally truncate or expand it, then show it
   * as a lineFeature.
   *
   * @param {array} datalines: an array of lines to show.
   */
  function show_lines(rawdata) {
    if (!rawdata) {
      return;
    }
    var maxsegments = parseInt(lines, 10) || 10000, numlines, segments = 0;
    for (numlines = 0; numlines < rawdata.length && segments < maxsegments; numlines += 1) {
      segments += rawdata[numlines].data.length - 1;
    }
    var data = rawdata.slice(0, numlines);
    lineFeature.data(data);
    lineFeature.draw();
    var text = 'Shown: ' + segments;
    $('#lines-shown').text(text).attr('title', text);
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
    // update the url to reflect the changes
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
   * Handle selecting a preset button.
   *
   * @param {object} evt: jquery event with the triggered button.
   */
  function select_preset(evt) {
    var update;
    var ctl = $(evt.target);
    var keys = ['antialiasing', 'lineCap', 'lineJoin', 'lines', 'miterLimit',
                'strokeColor', 'strokeOffset', 'strokeOpacity', 'strokeWidth'];
    skipdraw = true;
    $.each(keys, function (idx, key) {
      var value = ctl.attr(key);
      if (value !== '' && value !== undefined && $('#' + key).val() !== value) {
        $('#' + key).val(value).trigger('change');
      }
      update = true;
    });
    skipdraw = false;
    if (update) {
      lineFeature.draw();
    }
  }

  if (query.map !== 'false') {
    map.createLayer('osm');
  }
  layer = map.createLayer('feature', layerOptions);
  lineFeature = layer.createFeature('line', lineOptions)
    .line(function (d) {
      return d.data;
    })
    .position(function (d) {
      return {x: d[0], y: d[1]};
    });
  /* Make some values available in the global context so curious people can
   * play with them. */
  window.example = {
    map: map,
    layer: layer,
    layerOptions: layerOptions,
    line: lineFeature,
    lineOptions: lineOptions
  };

  fetch_data();
  $('#controls').on('change', change_controls);
});
