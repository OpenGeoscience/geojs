// Run after the DOM loads
$(function () {
  'use strict';

  var map = geo.map({
    node: '#map',
    center: {
      x: -98,
      y: 39
    },
    zoom: 4
  });
  var layer, heatmap, points, datapoints;

  var layerOptions = {
    features: ['heatmap'],
    opacity: 0.75
  };
  var heatmapOptions = {
    binned: 'auto',
    minIntensity: null,
    maxIntensity: null,
    style: {
      blurRadius: 15,
      color: {
        0.00: {r: 0, g: 0, b: 0, a: 0.0},
        0.25: {r: 0, g: 1, b: 0, a: 0.5},
        0.50: {r: 1, g: 1, b: 0, a: 0.8},
        1.00: {r: 1, g: 0, b: 0, a: 1.0}
      },
      radius: 25
    },
    updateDelay: 50
  };

  // Parse query parameters into an object for ease of access
  var query = document.location.search.replace(/(^\?)/, '').split(
    '&').map(function (n) {
    n = n.split('=');
    if (n[0]) {
      this[decodeURIComponent(n[0])] = decodeURIComponent(n[1]);
    }
    return this;
  }.bind({}))[0];
  $.each(query, function (key, value) {
    var ctlvalue, ctlkey = key;
    switch (key) {
      case 'binned':
        ctlvalue = value ? value : 'auto';
        break;
      case 'dataset':
        ctlvalue = value ? value : 'adderall';
        break;
      case 'gaussian':
        ctlvalue = value === 'true';
        heatmapOptions.style[key] = value;
        break;
      case 'gradient':
        var parts = value.split(',').map(parseFloat);
        if (parts.length >= 5) {
          var gradient = {0: {r: 0, g: 0, b: 0, a: 0}};
          for (var i = 0; i < parts.length - 4; i += 5) {
            gradient[parts[i]] = {
              r: parts[i + 1] / 255,
              g: parts[i + 2] / 255,
              b: parts[i + 3] / 255,
              a: parts[i + 4]
            };
          }
          heatmapOptions.style.color = gradient;
        }
        break;
      case 'minIntensity': case 'maxIntensity':
        value = value.length ? parseFloat(value) : null;
        if (!isNaN(value)) {
          heatmapOptions[key] = ctlvalue = value;
        }
        break;
      case 'opacity':
        value = value.length ? parseFloat(value) : 0.75;
        if (!isNaN(value)) {
          layerOptions[key] = ctlvalue = value;
        }
        break;
      case 'points':
        if (value.length) {
          points = ctlvalue = parseInt(value, 10);
        }
        break;
      case 'radius': case 'blurRadius':
        if (value.length) {
          value = parseFloat(value);
          if (!isNaN(value)) {
            heatmapOptions.style[key] = ctlvalue = value;
          }
        }
        break;
      case 'updateDelay':
        if (value.length) {
          heatmapOptions[key] = ctlvalue = parseInt(value, 10);
        }
        break;
      // add gaussian and binning when they are added as features
    }
    if (ctlvalue !== undefined) {
      $('#' + ctlkey).val(ctlvalue);
    }
  });
  /* Set gradient controls */
  var gradkeys = Object.keys(heatmapOptions.style.color).sort();
  $.each(gradkeys, function (idx, key) {
    var entry = heatmapOptions.style.color[key];
    $('#gradI' + (idx + 1)).val(key);
    $('#gradR' + (idx + 1)).val(Math.round(entry.r * 255));
    $('#gradG' + (idx + 1)).val(Math.round(entry.g * 255));
    $('#gradB' + (idx + 1)).val(Math.round(entry.b * 255));
    $('#gradA' + (idx + 1)).val(entry.a);
  });

  /* Based on the current controls, fetch a data set and show it as a heatmap.
   */
  function fetch_data() {
    var dataset = $('#dataset').val(),
        url = '../../data/' + $('#dataset option:selected').attr('url');
    $.ajax(url, {
      success: function (resp) {
        window.heatmap.datapoints = null;
        var rows;
        switch (dataset) {
          case 'adderall':
            rows = resp.split(/\r\n|\n|\r/);
            rows.splice(0, 1);
            rows = rows.map(function (r) {
              var fields = r.split(',');
              return [fields[12], fields[24], fields[25]].map(parseFloat);
            });
            break;
          case 'cities':
            rows = resp.split(/\r\n|\n|\r/);
            rows.splice(rows.length - 1, 1);
            rows = rows.map(function (r) {
              var fields = r.split('","');
              return ['' + fields[0].replace(/(^\s+|\s+$|^"|"$)/g, '').length, fields[2].replace(/(^\s+|\s+$|^"|"$)/g, ''), fields[3].replace(/(^\s+|\s+$|^"|"$)/g, '')].map(parseFloat);
            });
            break;
          case 'earthquakes':
            rows = resp;
            break;
        }
        datapoints = rows;
        window.heatmap.datapoints = datapoints;
        var text = 'Loaded: ' + datapoints.length;
        $('#points-loaded').text(text).attr('title', text);
        show_points(datapoints);
      }
    });
  }

  /**
   * Given a set of datapoints, optionally truncate or expand it, then show it
   * as a heatmap.
   *
   * @param {array} datapoints: an array of points to show.
   */
  function show_points(datapoints) {
    window.heatmap.rows = null;
    var rows = datapoints;
    var maxrows = parseInt(points, 10) || rows.length;
    if (rows.length > maxrows) {
      rows = rows.slice(0, maxrows);
    } else if (rows.length < maxrows) {
      rows = rows.slice();
      while (rows.length < maxrows) {
        for (var i = rows.length - 1; i >= 0 && rows.length < maxrows; i -= 1) {
          rows.push([
            rows[i][0] + Math.random() * 0.1 - 0.05,
            rows[i][1] + Math.random() * 0.1 - 0.05,
            rows[i][2] + Math.random() * 0.1 - 0.05]);
        }
      }
    }
    heatmap.data(rows);
    window.heatmap.rows = rows;
    heatmap.draw();
    var text = 'Shown: ' + rows.length;
    $('#points-shown').text(text).attr('title', text);
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
    var processedValue = (
      ctl.is('[type="checkbox"]') ? (value === 'true') : value);
    if (ctl.closest('table.gradient').length) {
      param = 'gradient';
    }
    switch (param) {
      case 'binned':
        heatmapOptions[param] = value;
        heatmap[param](value);
        heatmap.draw();
        break;
      case 'blurRadius': case 'radius':
        processedValue = value.length ? parseFloat(value) : undefined;
        if (isNaN(processedValue) || processedValue === undefined ||
            processedValue < 0) {
          return;
        }
        heatmapOptions.style[param] = processedValue;
        heatmap.style(param, processedValue);
        heatmap.draw();
        break;
      case 'dataset':
        fetch_data();
        break;
      case 'gaussian':
        heatmapOptions.style[param] = processedValue;
        heatmap.style(param, processedValue);
        heatmap.draw();
        break;
      case 'gradient':
        var gradient = {};
        for (var idx = 1; idx <= 6; idx += 1) {
          var gradkey = parseFloat($('#gradI' + idx).val());
          if (isNaN(gradkey)) {
            continue;
          }
          gradient[gradkey] = {
            r: parseInt($('#gradR' + idx).val() || 0) / 255,
            g: parseInt($('#gradG' + idx).val() || 0) / 255,
            b: parseInt($('#gradB' + idx).val() || 0) / 255,
            a: parseFloat($('#gradA' + idx).val() || 0)
          };
        }
        if (!(0 in gradient && 1 in gradient)) {
          value = '';
          break;
        }
        heatmapOptions.style.color = gradient;
        heatmap.style('color', gradient);
        heatmap.draw();
        var gradkeys = Object.keys(heatmapOptions.style.color).sort();
        value = gradkeys.map(function (key) {
          return [key, Math.round(gradient[key].r * 255), Math.round(gradient[key].g * 255), Math.round(gradient[key].b * 255), gradient[key].a].join(',');
        }).join(',');
        break;
      case 'minIntensity': case 'maxIntensity':
        processedValue = value.length ? parseFloat(value) : null;
        if (isNaN(processedValue)) {
          return;
        }
        heatmapOptions[param] = processedValue;
        heatmap[param](processedValue);
        heatmap.draw();
        break;
      case 'opacity':
        processedValue = value.length ? parseFloat(value) : undefined;
        if (isNaN(processedValue) || processedValue === undefined) {
          return;
        }
        layerOptions[param] = processedValue;
        layer[param](processedValue);
        break;
      case 'points':
        points = parseInt(value);
        show_points(datapoints);
        break;
      case 'updateDelay':
        processedValue = value.length ? parseInt(value) : 50;
        heatmapOptions[param] = processedValue;
        heatmap[param](processedValue);
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

  map.createLayer('osm');
  layer = map.createLayer('feature', layerOptions);
  heatmap = layer.createFeature('heatmap', heatmapOptions)
    .intensity(function (d) {
      return d[0];
    })
    .position(function (d) {
      return {x: d[2], y: d[1]};
    });
  /* Make some values available in the global context so curious people can
   * play with them. */
  window.heatmap = {
    map: map,
    layer: layer,
    layerOptions: layerOptions,
    heatmap: heatmap,
    heatmapOptions: heatmapOptions
  };

  fetch_data();
  $('#controls').on('change', change_controls);
});
