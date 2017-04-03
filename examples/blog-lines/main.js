/* global utils */

var Libraries = {
  geojs: {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/geojs/{version}/geo.min.js',
    defaultVersion: 'current',
    mainReference: 'geo',
    versions: {
      current: {
        lib: window.geo,
        deferred: $.when()  // a resolved deferred
      }
    }
  },
  leaflet: {
    url: 'https://unpkg.com/leaflet@{version}/dist/leaflet.js',
    defaultVersion: '1.0.2',
    mainReference: 'L'
  },
  mapbox: {
    url: 'https://api.mapbox.com/mapbox.js/v{version}/mapbox.js',
    defaultVersion: '3.0.1',
    mainReference: 'L'
  },
  mapboxgl: {
    url: 'https://api.mapbox.com/mapbox-gl-js/v{version}/mapbox-gl.js',
    defaultVersion: '0.28.0',
    mainReference: 'mapboxgl'
  }
};

var DataSources = {
  roads: {
    url: '../../data/roads.json',
    success: function (resp) {
      DataSources.roads.data = $.map(resp, function (item) {
        return [item.data];
      });
    }
  }
};

var nextId = 1;
var DemoList = [];
var Attributes = [
  'library', 'version', 'renderer', 'data', 'lines', 'x', 'y', 'zoom',
  'strokeColor', 'strokeOpacity', 'strokeWidth', 'strokeOffset', 'lineCap',
  'lineJoin', 'miterLimit', 'antialiasing', 'debug', 'referenceLines'
];

var ReferenceLineData = [
  [[-86.00, 31.5], [-86.00, 32.3]], [[-86.00, 32.3], [-85.95, 32.3]], [[-85.95, 32.3], [-85.95, 31.5]],
  [[-85.85, 31.5], [-85.80, 32.3]], [[-85.80, 32.3], [-85.75, 31.5]], [[-85.75, 31.5], [-85.70, 32.3]],
  [[-85.65, 31.6], [-85.60, 32.0]], [[-85.60, 32.0], [-85.55, 31.6]],
  [[-85.45, 31.6], [-85.45, 31.8]], [[-85.45, 31.8], [-85.40, 31.6]], [[-85.40, 31.6], [-85.40, 31.8]],
  [[-85.30, 31.8], [-85.275, 32.0]], [[-85.275, 32.0], [-85.25, 31.8]],
  [[-85.15, 31.5], [-85.15, 32.3]],
  [[-85.00, 31.5], [-85.00, 31.9]], [[-85.00, 31.9], [-85.00, 32.3]],
  [[-84.85, 31.5], [-84.75, 31.9]], [[-84.75, 31.9], [-84.85, 32.3]]
];

var LineData = [
  [[-86.00, 31.5], [-86.00, 32.3], [-85.95, 32.3], [-85.95, 31.5]],
  [[-85.85, 31.5], [-85.80, 32.3], [-85.75, 31.5], [-85.70, 32.3]],
  [[-85.65, 31.6], [-85.60, 32.0], [-85.55, 31.6]],
  [[-85.45, 31.6], [-85.45, 31.8], [-85.40, 31.6], [-85.40, 31.8]],
  [[-85.30, 31.8], [-85.275, 32.0], [-85.25, 31.8]],
  [[-85.15, 31.5], [-85.15, 32.3]],
  [[-85.00, 31.5], [-85.00, 31.9], [-85.00, 32.3]],
  [[-84.85, 31.5], [-84.75, 31.9], [-84.85, 32.3]]
];

var MapStart = {
  x: -85.44956,
  y: 31.87798,
  zoom: 10
};

/**
 * Check if a library is loaded.  If not, load it.  Return a Deferred that
 * resolves when the library is loaded.
 *
 * @param {object} opts: options on the library to load.
 *   library: a key to the library.  'geojs' is falsy.
 *   version: a GeoJS version to load from a CDN.  Defaults to defaultVersion
 *      of the library.
 * @return {Deferred}: a deferred object for the library.
 */
function libraryReady(opts) {
  var library = opts.library || 'geojs';
  var version = opts.version || Libraries[library].defaultVersion;
  if (!Libraries[library].versions) {
    Libraries[library].versions = {};
  }
  if (!Libraries[library].versions[version]) {
    var url = Libraries[library].url.replace(/{version}/g, version);
    var info = {
      deferred: $.ajax({url: url, dataType: 'script'}).done(function () {
        info.lib = window[Libraries[library].mainReference];
      })
    };
    Libraries[library].versions[version] = info;
  }
  return Libraries[library].versions[version].deferred;
}

/**
 * After a library is loaded, return the main reference.
 *
 * @param {object} opts: options on the library.
 *   library: a key to the library.  'geojs' is falsy.
 *   version: a GeoJS version to load from a CDN.  Defaults to defaultVersion
 *      of the library.
 * @returns {object}: the main library reference.
 */
function libraryReference(opts) {
  var library = opts.library || 'geojs';
  var version = opts.version || Libraries[library].defaultVersion;
  return Libraries[library].versions[version].lib;
}

/**
 * Check if a data set is loaded.  If not, load it.  Return a Deferred that
 * resolves when the data is loaded.
 *
 * @param {object} opts: options on the data to load.
 *   data: data to load.
 * @return {Deferred}: a deferred object for the library.
 */
function dataReady(opts) {
  if (!DataSources[opts.data]) {
    return $.when();
  }
  var src = DataSources[opts.data];
  if (!src.deferred) {
    src.deferred = $.ajax({
      url: src.url,
      success: src.success
    });
  }
  return src.deferred;
}

/**
 * After data is loaded, return the data or a subset of the data.
 *
 * @param {object} opts: options on the data to load.
 *   data: data to load.
 *   lines: minimum number of line segments.
 * @return {Deferred}: a deferred object for the library.
 */
function dataReference(opts) {
  if (!DataSources[opts.data]) {
    return LineData;
  }
  opts.referenceLines = 'false';
  var maxsegments = parseInt(opts.lines, 10) || 10000;
  if (!DataSources[opts.data][maxsegments]) {
    var rawdata = DataSources[opts.data].data,
        numlines, segments = 0, offset = 0;
    for (numlines = 0; numlines < rawdata.length && segments < maxsegments; numlines += 1) {
      segments += rawdata[numlines].length - 1;
    }
    DataSources[opts.data][maxsegments] = rawdata.slice(0, numlines);
    /* duplicate lines so we can test with larger numbers of lines */
    while (segments < maxsegments) {
      offset += 2;
      for (numlines = 0; numlines < rawdata.length && segments < maxsegments; numlines += 1) {
        DataSources[opts.data][maxsegments].push(
          $.map(rawdata[numlines], function (point) {
            return [[point[0] + offset, point[1]]];
          })
        );
        segments += rawdata[numlines].length - 1;
      }
    }
  }
  return DataSources[opts.data][maxsegments];
}

/**
 * Check if an element is in the viewport.
 *
 * @param {selector|element} elem: the element to check.
 * @returns {boolean}: true if any of the element is in the viewport.
 */
function elementInViewport(elem) {
  var pos = $(elem)[0].getBoundingClientRect();
  return (
    pos.left < window.innerWidth &&
    pos.top < window.innerHeight &&
    pos.right > 0 &&
    pos.bottom > 0);
}

/**
 * Remove or add demos based on visibility in the viewport.  This is done to
 * prevent there being "Too many active WebGL contexts".  This error message
 * can still appear, as the contexts may not be garbage collected in a timely
 * manner, but should cause no problems in rendering.
 */
function updateDemos() {
  /* remove, then add */
  $.each(DemoList, function (idx, opts) {
    var visible = elementInViewport(opts.node);
    if (!visible && opts.deferred && opts.result) {
      if (opts.result.exit) {
        opts.result.exit.call(opts.result.map);
      }
      opts.deferred = opts.result = undefined;
    }
  });
  $.each(DemoList, function (idx, opts) {
    var visible = elementInViewport(opts.node);
    if (visible && !opts.deferred) {
      linesTest(opts);
    }
  });
}

/**
 * Update the shown demos to the current value of the feature control.
 */
function updateSelect() {
  var option = $('#feature').val();
  var rows = $('#lines_table tr.option[option="' + option + '"]');
  $('#info').empty().append(
    $('td', rows.eq(1)).eq(0).children().clone()
  );
  $('#main_list .entry').empty().addClass('unsupported');
  $.each(DemoList, function (idx, opts) {
    if (opts.parentOption === option) {
      var entry = $('#main_list .entry').eq(opts.parentPosition - 1);
      entry.removeClass('unsupported').append(opts.parentHref);
    }
  });
  updateDemos();
}

/**
 * Given a style parameter value, if it is a comma-separated list convert it
 * into a function.  Otherwise, return the value as a string or number.
 *
 * @param {string|undefined|null} val: the value to parse and convert.
 * @param {string|number|undefined} defaultValue: the value to return if the
 *      specified value is null, undefined, or the empty string.
 * @param {boolean} isString: if falsy, convert values to floats.
 * @returns {string|number|function}: a converted value.
 */
function getStyleParam(val, defaultValue, isString) {
  'use strict';
  if (val === undefined || val === null || val === '') {
    return defaultValue;
  }
  val = val.split(',');
  if (!isString) {
    for (var i = 0; i < val.length; i += 1) {
      val[i] = parseFloat(val[i]);
    }
  }
  if (val.length === 1) {
    return val[0];
  }
  return function (d, i) {
    return val[i % val.length];
  };
}

/**
 * Given a style parameter value, return a singular value.  If this would
 * convert into a function, return the zeroth value.
 *
 * @param {string|undefined|null} val: the value to parse and convert.
 * @param {string|number|undefined} defaultValue: the value to return if the
 *      specified value is null, undefined, or the empty string.
 * @param {boolean} isString: if falsy, convert values to floats.
 * @returns {string|number}: a converted value.
 */
function getStyleValue(val, defaultValue, isString) {
  return geo.util.ensureFunction(getStyleParam(val, defaultValue, isString))(0, 0);
}

/**
 * Show a GeoJS map with lines.
 *
 * @param {object} opts: options on how to render the lines.  Options include:
 *   renderer: one of 'vgl', 'canvas', or 'd3'.  Defaults to 'vgl'.
 *   version: a GeoJS version to load from a CDN.  Defaults to 'current' which
 *      uses the local GeoJS.
 *   node: a jquery selector of a div to render the map into.  Defaults to
 *      '#map'.
 *   width: an optional width in pixels to set the node's size.
 *   height: an optional width in pixels to set the node's size.
 *   strokeColor, strokeOpacity, strokeWidth, strokeOffset, lineCap, lineJoin,
 *      miterLimit, antialiasing, debug: parameters for the line feature.
 */
function geojsLinesTest(opts) {
  'use strict';

  var geo = libraryReference(opts);

  $(opts.node).removeClass('ready');
  // create the map
  var map = geo.map({
    node: opts.node,
    zoom: (opts.zoom || MapStart.zoom) - (opts.scale || 0),
    center: {x: opts.x || MapStart.x, y: opts.y || MapStart.y},
    wrapX: false,
    clampBoundsX: true
  });

  // create a feature layer using the desired renderer
  var renderer = opts.renderer;
  var layer = map.createLayer('feature', {
    renderer: renderer === 'html' ? null : !renderer ? 'vgl' : renderer
  });
  var baseStyle = {
    antialiasing: getStyleValue(opts.antialiasing, 1),
    debug: opts.debug === 'true',
    miterLimit: getStyleValue(opts.miterLimit, 10)
  };
  // create lines using all of the specified styles
  var lines = layer.createFeature('line', {style: baseStyle})
    .data(dataReference(opts))
    .line(function (d) {
      return d;
    })
    .position(function (d, index, item, itemIdx) {
      return {x: d[0], y: d[1]};
    })
    .style($.extend({
      lineCap: getStyleParam(opts.lineCap, undefined, true),
      lineJoin: getStyleParam(opts.lineJoin, undefined, true),
      strokeColor: getStyleParam(opts.strokeColor, 'black', true),
      strokeWidth: getStyleParam(opts.strokeWidth, 48 / Math.pow(2, opts.scale || 0)),
      strokeOpacity: getStyleParam(opts.strokeOpacity, 0.5),
      strokeOffset: getStyleParam(opts.strokeOffset, 0),
      closed: function (line, idx) {
        return (line[0][0] === line[line.length - 1][0] &&
                line[0][1] === line[line.length - 1][1]);
      }
    }, baseStyle));
  if (opts.referenceLines !== 'false') {
    // create reference lines
    var reference = layer.createFeature('line', {style: baseStyle})
      .data(ReferenceLineData)
      .line(function (d) {
        return d;
      })
      .position(function (d, index, item, itemIdx) {
        return {x: d[0], y: d[1]};
      })
      .style($.extend({
        strokeColor: 'blue',
        strokeWidth: 16 / Math.pow(2, opts.scale || 0),
        strokeOpacity: 1
      }, baseStyle));
  }

  map.draw();

  map.onIdle(function () {
    map.scheduleAnimationFrame(function () {
      $(opts.node).addClass('ready');
    }, 'readyFlag');
  });

  // return references to the various objects
  return {
    map: map,
    layer: layer,
    opts: opts,
    lines: lines,
    reference: reference,
    data: dataReference(opts),
    exit: map.exit
  };
}

/**
 * Show a Leaflet or MapBox map with lines.
 *
 * @param {object} opts: options on how to render the lines.  Options include:
 *   library: one of 'leaflet' or 'mapbox'.
 *   renderer: one of 'canvas' or 'svg'.  Defaults to 'svg'.
 *   node: a jquery selector of a div to render the map into.  Defaults to
 *      '#map'.
 *   width: an optional width in pixels to set the node's size.
 *   height: an optional width in pixels to set the node's size.
 *   strokeColor, strokeOpacity, strokeWidth, lineCap, lineJoin: parameters for
 *      the line feature.
 */
function leafletLinesTest(opts) {
  var L = libraryReference(opts);
  var renderer = opts.renderer;
  switch (renderer) {
    case 'canvas':
      renderer = L.canvas(); break;
    default:
      renderer = undefined;
  }

  // set the main div's size if requested
  var node = opts.node;
  if (!node.attr('id')) {
    node.attr('id', 'leaflet_' + nextId);
    nextId += 1;
  }

  // create the map
  var map = L.map(node.attr('id'), {
    attributionControl: false,
    zoomControl: false,
    center: L.latLng({lng: opts.x || MapStart.x, lat: opts.y || MapStart.y}),
    zoom: (opts.zoom || MapStart.zoom) - (opts.scale || 0),
    rotate: true  // enable rotation when supported
  });

  // create lines using all of the specified styles
  var lineData = $.map(dataReference(opts), function (line) {
    return [$.map(line, function (point) {
      return [L.latLng({lng: point[0], lat: point[1]})];
    })];
  });
  var lines = L.polyline(lineData, {
    smoothFactor: 0,  // don't reduce lines
    lineCap: getStyleValue(opts.lineCap, 'butt', true),
    lineJoin: getStyleValue(opts.lineJoin, 'miter', true),
    color: getStyleValue(opts.strokeColor, 'black', true),
    weight: getStyleValue(opts.strokeWidth, 48 / Math.pow(2, opts.scale || 0)),
    opacity: getStyleValue(opts.strokeOpacity, 0.5),
    renderer: renderer
    // no strokeOffset, antialiasing, miterLimit
  }).addTo(map);
  // create reference lines
  if (opts.referenceLines !== 'false') {
    var refLineData = $.map(ReferenceLineData, function (line) {
      return [$.map(line, function (point) {
        return [L.latLng({lng: point[0], lat: point[1]})];
      })];
    });
    var reference = L.polyline(refLineData, {
      smoothFactor: 0,  // don't reduce lines
      color: 'blue',
      weight: 16 / Math.pow(2, opts.scale || 0),
      lineCap: 'butt',
      lineJoin: 'miter',
      opacity: 1,
      renderer: renderer
    }).addTo(map);
  }

  // There is no direct support for miterlimit, but if the map is using SVG,
  // we can manully set it.
  $('svg path', node).attr('stroke-miterlimit', parseFloat(opts.miterLimit || 10));

  // return references to the various objects
  return {
    map: map,
    opts: opts,
    lines: lines,
    lineData: lineData,
    reference: reference,
    refLineData: refLineData,
    exit: map.remove
  };
}

/**
 * Show a MapBox-GL map with lines.
 *
 * @param {object} opts: options on how to render the lines.  Options include:
 *   node: a jquery selector of a div to render the map into.  Defaults to
 *      '#map'.
 *   width: an optional width in pixels to set the node's size.
 *   height: an optional width in pixels to set the node's size.
 *   strokeColor, strokeOpacity, strokeWidth, lineCap, lineJoin: parameters for
 *      the line feature.
 */
function mapboxglLinesTest(opts) {
  var mapboxgl = libraryReference(opts);

  function r13(a) {
    return a.replace(/[a-z]/gi, function (c) {
      return String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    });
  }

  // mildly obfuscate our public token.  It still has to be public, but at
  // least it will require a modicum of effort to scrape.
  mapboxgl.accessToken = r13('cx.rlW1VwbvM2SloT9h') +
    r13('APVfVzRvBvWwnKqkn3c1nUZjZQL0Zaugp3W') +
    r13('woQIcMUS3Va0.o8z-EM8N-Z1ijs7j7OpPzD');
  // create the map
  var map = new mapboxgl.Map({
    container: opts.node[0],
    center: [opts.x || MapStart.x, opts.y || MapStart.y],
    // mapboxgl uses a zoom levle that is 1 off from other libraries
    zoom: (opts.zoom || MapStart.zoom) - 1 - (opts.scale || 0),
    style: {version: 8, sources: {}, layers: []},
    bearingSnap: 0,
    pitchWithRotate: false,
    attributionControl: false
  });

  map.on('load', function () {
    // lines are added in GeoJSON format
    var lineData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiLineString',
        coordinates: dataReference(opts)
      }
    };
    map.addSource('lineData', {
      type: 'geojson',
      data: lineData
    });
    map.addLayer({
      id: 'lineData',
      type: 'line',
      source: 'lineData',
      layout: {
        'line-cap': getStyleValue(opts.lineCap, 'butt', true),
        'line-join': getStyleValue(opts.lineJoin, 'miter', true),
        'line-miter-limit': getStyleValue(opts.miterLimit, 10)
      },
      paint: {
        'line-opacity': getStyleValue(opts.strokeOpacity, 0.5),
        'line-color': getStyleValue(opts.strokeColor, 'black', true),
        'line-width': getStyleValue(opts.strokeWidth, 48 / Math.pow(2, opts.scale || 0)),
        'line-offset': getStyleValue(opts.strokeOffset, 0) * getStyleValue(opts.strokeWidth, 48 / Math.pow(2, opts.scale || 0)) * 0.5,
        'line-blur': getStyleValue(opts.antialiasing, 1) / 2
      }
    });

    // create reference lines
    if (opts.referenceLines !== 'false') {
      var refLineData = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'MultiLineString',
          coordinates: ReferenceLineData
        }
      };
      map.addSource('refLineData', {
        type: 'geojson',
        data: refLineData
      });
      map.addLayer({
        id: 'refLineData',
        type: 'line',
        source: 'refLineData',
        layout: {
          'line-cap': 'butt',
          'line-join': 'miter'
        },
        paint: {
          'line-opacity': 1,
          'line-color': 'blue',
          'line-width': 16 / Math.pow(2, opts.scale || 0)
        }
      });
    }

    // return references to the various objects
    opts.result = {
      map: map,
      opts: opts,
      lineData: lineData,
      refLineData: refLineData,
      exit: map.remove
    };
  });
}

/**
 * Show a variety of maps with lines.
 *
 * @param {object} opts: options on how to render the lines.  Options include:
 *   library: one of 'geojs', 'leaflet', 'mapbox', or 'mapboxgl'.  Defaults to
 *      'geojs'.
 *   version: a library version to load.  Varies by library.
 *   renderer: one of 'vgl', 'canvas', 'd3', 'svg'.  Varues by library.
 *   node: a jquery selector of a div to render the map into.  Defaults to
 *      '#map'.
 *   width: an optional width in pixels to set the node's size.
 *   height: an optional width in pixels to set the node's size.
 *   strokeColor, strokeOpacity, strokeWidth, strokeOffset, lineCap, lineJoin,
 *      miterLimit, antialiasing, debug: parameters for the line feature.
 */
function linesTest(opts) {
  // set the main div's size if requested.
  var node = $(opts.node || '#map');
  opts.node = node;
  if (opts.width) {
    node.css('width', opts.width + 'px');
  }
  if (opts.height) {
    node.css('height', opts.height + 'px');
  }
  opts.deferred = $.when(libraryReady(opts), dataReady(opts)).then(function () {
    var result;
    switch (opts.library) {
      case 'leaflet': case 'mapbox':
        result = leafletLinesTest(opts);
        break;
      case 'mapboxgl':
        mapboxglLinesTest(opts);
        break;
      default:
        result = geojsLinesTest(opts);
        break;
    }
    if (result) {
      opts.result = result;
    }
  });
}

// Run after the DOM loads
$(function () {
  'use strict';

  var query = utils.getQuery();
  if (query.mode !== 'table' && query.mode !== 'select') {
    $('#lines_table,#lines_list').remove();
    $('#map').css('display', 'block');
    linesTest(query);
    window.example = query;
  } else {
    $('.geojs,.leaflet,.mapbox,.mapboxgl').each(function () {
      var elem = $(this);
      var opts = {};
      var linkOpts = {};
      $.each(Attributes, function (idx, attr) {
        var value = elem.closest('[' + attr + ']').attr(attr);
        if (value !== undefined) {
          opts[attr] = value;
        }
        value = elem.closest('[link_' + attr + ']').attr('link_' + attr);
        if (value !== undefined) {
          linkOpts[attr] = value;
        }
      });
      var ref = $('<a/>');
      ref.attr('href', '?' + $.param($.extend({}, opts, linkOpts)));
      opts = $.extend({
        parentHref: ref,
        parentOption: elem.closest('.option').attr('option'),
        parentPosition: elem.index(),
        node: $('<div/>'),
        scale: 2,
        width: 320,
        height: 240
      }, opts);
      ref.append(opts.node);
      elem.append(ref);
      DemoList.push(opts);
    });
    if (query.mode === 'table') {
      updateDemos();
    } else {  // select
      $('#lines_table').css('display', 'none');
      $('#lines_list').css('display', 'block');
      $('#lines_table tr.option').each(function () {
        var elem = $(this),
            option = elem.attr('option');
        if (!$('#feature option[option="' + option + '"]').length) {
          $('#feature').append($('<option>').attr({
            value: option, option: option
          }).text($('th', elem).eq(0).text()));
        }
      });
      $('#feature').on('change', updateSelect);
      $('#feature').val($('#feature option').eq(0).val()).trigger('change');
    }
    $(window).on('scroll', updateDemos);
  }
});
