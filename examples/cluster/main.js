/* globals utils */

var map = geo.map({
  node: '#map',
  center: {
    x: -98,
    y: 39
  },
  zoom: 3
});
var layer, pointFeature, points, datapoints;
var datarows; // eslint-disable-line no-unused-vars

var query = utils.getQuery();

$.each(query, function (key, value) {
  var ctlvalue, ctlkey = key;
  switch (key) {
    case 'dataset':
      ctlvalue = value ? value : 'adderall';
      break;
    case 'points':
      if (value.length) {
        points = ctlvalue = parseInt(value, 10);
      }
      break;
  }
  if (ctlvalue !== undefined) {
    $('#' + ctlkey).val(ctlvalue);
  }
});

/**
 * Based on the current controls, fetch a data set and show it as a clustered
 * points.
 */
function fetch_data() {
  var dataset = $('#dataset').val(),
      url = '../../data/' + $('#dataset option:selected').attr('url');
  $.ajax(url, {
    success: function (resp) {
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
      var text = 'Loaded: ' + datapoints.length;
      $('#points-loaded').text(text).attr('title', text);
      show_points(datapoints);
    }
  });
}

/* Given a set of datapoints, optionally truncate or expand it, then show it
 * as clustered points.
 *
 * @param {array} datapoints an array of points to show.
 */
function show_points(datapoints) {
  datarows = null;
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
  pointFeature.data(rows);
  datarows = rows;
  pointFeature.draw();
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
  if (ctl.closest('table.gradient').length) {
    param = 'gradient';
  }
  switch (param) {
    case 'dataset':
      fetch_data();
      break;
    case 'points':
      points = parseInt(value);
      show_points(datapoints);
      break;
  }
  // update the url to reflect the changes
  query[param] = value;
  if (value === '' || (ctl.attr('placeholder') &&
      value === ctl.attr('placeholder'))) {
    delete query[param];
  }
  utils.setQuery(query);
}

function injectStyle(feature, property, clusterStyle) {
  var styleFunc = feature.style.get(property);
  feature.style(property, function (d) {
    if (d.__cluster) {
      return clusterStyle;
    }
    return styleFunc.apply(this, arguments);
  });
}

map.createLayer('osm');
layer = map.createLayer('feature', {
  renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
  features: query.renderer ? undefined : ['point']
});
pointFeature = layer.createFeature('point', {})
  .position(function (d) {
    return {x: d[2], y: d[1]};
  });
injectStyle(pointFeature, 'radius', 10);
injectStyle(pointFeature, 'stroke', true);
injectStyle(pointFeature, 'fill', true);
injectStyle(pointFeature, 'strokeColor', 'black');
injectStyle(pointFeature, 'fillColor', 'black');
injectStyle(pointFeature, 'strokeOpacity', 1);
injectStyle(pointFeature, 'strokeWidth', 1);
injectStyle(pointFeature, 'fillOpacity', 0.5);
pointFeature.clustering({radius: 0.012});

fetch_data();
$('#controls').on('change', change_controls);
