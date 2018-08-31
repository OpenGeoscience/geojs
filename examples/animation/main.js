// Run after the DOM loads
$(function () {
  'use strict';

  var layer, pointFeature, points, datapoints,
      timeRecords = {generate: [], update: [], frames: []},
      animationState = {};

  var map = geo.map({
    node: '#map',
    center: {
      x: -98,
      y: 39
    },
    zoom: 3
  });
  var layerOptions = {
    features: ['point']
  };

  var animationStyles = {
    fill: false,
    fillColor: false,
    fillOpacity: true,
    stroke: false,
    strokeColor: false,
    strokeOpacity: true,
    strokeWidth: true,
    radius: true
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
    var ctlvalue, ctlkey = key, ctl;
    switch (key) {
      case 'dataset':
        ctlvalue = value ? value : 'adderall';
        break;
      case 'points':
        if (value.length) {
          points = ctlvalue = parseInt(value, 10);
        }
        break;
      default:
        if (animationStyles[key] !== undefined) {
          animationStyles[key] = ctlvalue = value === 'true';
        }
    }
    if (ctlvalue !== undefined) {
      ctl = $('#' + ctlkey);
      if (ctl.is('[type="checkbox"]')) {
        ctl.prop('checked', value === 'true' || value === true);
      } else {
        ctl.val(ctlvalue);
      }
    }
  });

  /* Based on the current controls, fetch a data set and show it as a heatmap.
   */
  function fetch_data() {
    var dataset = $('#dataset').val(),
        url = '../../data/' + $('#dataset option:selected').attr('url');
    $.ajax(url, {
      success: function (resp) {
        var wasPlaying = animationState.mode === 'play';
        animation_pause();
        animationState = {};
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
            animationState.orderedData = true;
            rows = resp;
            break;
        }
        datapoints = rows;
        var text = 'Loaded: ' + datapoints.length;
        $('#points-loaded').text(text).attr('title', text);
        show_points(datapoints);
        reset_styles();
        if (wasPlaying) {
          animation_play();
        }
      }
    });
  }

  /* Given a set of datapoints, optionally truncate or expand it, then show it
   * as a heatmap.
   *
   * @param {array} datapoints: an array of points to show.
   */
  function show_points(datapoints) {
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
    var processedValue = (
      ctl.is('[type="checkbox"]') ? (value === 'true') : value);
    if (ctl.closest('table.gradient').length) {
      param = 'gradient';
    }
    switch (param) {
      case 'dataset':
        fetch_data();
        break;
      case 'points':
        points = parseInt(value);
        var wasPlaying = animationState.mode === 'play';
        animation_pause();
        show_points(datapoints);
        reset_styles();
        if (wasPlaying) {
          animation_play();
        }
        break;
      default:
        if (animationStyles[param] !== undefined) {
          animationStyles[param] = processedValue;
          reset_styles();
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
   * Render a frame of the animation and then request another frame as soon as
   * possible.
   */
  function animation_frame() {
    var datalen = animationState.order.length,
        styles = animationState.styleArrays,
        curTime = Date.now(), genTime, updateTime,
        position, i, idx, p;
    timeRecords.frames.push(curTime);
    animationState.raf = null;
    position = ((curTime - animationState.startTime) / animationState.duration) % 1;
    if (position < 0) {
      position += 1;
    }
    animationState.position = position;

    for (idx = 0; idx < datalen; idx += 1) {
      i = animationState.order[idx];
      p = idx / datalen + position;
      if (p > 1) {
        p -= 1;
      }
      styles.p[i] = p;
    }
    if (animationStyles.fill) {
      for (i = 0; i < datalen; i += 1) {
        styles.fill[i] = styles.p[i] >= 0.1 ? false : true;
      }
    }
    if (animationStyles.fillColor) {
      for (i = 0; i < datalen; i += 1) {
        p = styles.p[i];
        if (p >= 0.1) {
          styles.fillColor[i].r = 0;
          styles.fillColor[i].g = 0;
          styles.fillColor[i].b = 0;
        } else {
          styles.fillColor[i].r = p * 10;
          styles.fillColor[i].g = p * 8.39;
          styles.fillColor[i].b = p * 4.39;
        }
      }
    }
    if (animationStyles.fillOpacity) {
      for (i = 0; i < datalen; i += 1) {
        p = styles.p[i];
        styles.fillOpacity[i] = p >= 0.1 ? 0 : 1.0 - p * 10;  // 1 - 0
      }
    }
    if (animationStyles.radius) {
      for (i = 0; i < datalen; i += 1) {
        p = styles.p[i];
        styles.radius[i] = p >= 0.1 ? 0 : 2 + 100 * p;  // 2 - 12
      }
    }
    if (animationStyles.stroke) {
      for (i = 0; i < datalen; i += 1) {
        styles.stroke[i] = styles.p[i] >= 0.1 ? false : true;
      }
    }
    if (animationStyles.strokeColor) {
      for (i = 0; i < datalen; i += 1) {
        p = styles.p[i];
        if (p >= 0.1) {
          styles.strokeColor[i].r = 0;
          styles.strokeColor[i].g = 0;
          styles.strokeColor[i].b = 0;
        } else {
          styles.strokeColor[i].r = p * 8.51;
          styles.strokeColor[i].g = p * 6.04;
          styles.strokeColor[i].b = 0;
        }
      }
    }
    if (animationStyles.strokeOpacity) {
      for (i = 0; i < datalen; i += 1) {
        p = styles.p[i];
        styles.strokeOpacity[i] = p >= 0.1 ? 0 : 1.0 - p * p * 100;  // (1 - 0) ^ 2
      }
    }
    if (animationStyles.strokeWidth) {
      for (i = 0; i < datalen; i += 1) {
        p = styles.p[i];
        styles.strokeWidth[i] = p >= 0.1 ? 0 : 3 - 30 * p;  // 3 - 0
      }
    }
    var updateStyles = {};
    $.each(animationStyles, function (key, use) {
      if (use) {
        updateStyles[key] = styles[key];
      }
    });
    genTime = Date.now();
    pointFeature.updateStyleFromArray(updateStyles, null, true);
    updateTime = Date.now();
    timeRecords.generate.push(genTime - curTime);
    timeRecords.update.push(updateTime - genTime);
    show_framerate();
    if (animationState.mode === 'play') {
      animationState.raf = window.requestAnimationFrame(animation_frame);
    }
  }

  /**
   * Stop any animation timeout, but don't do anything else.
   */
  function animation_pause() {
    if (animationState.mode && animationState.mode !== 'pause' && animationState.mode !== 'stop') {
      if (animationState.raf) {
        window.cancelAnimationFrame(animationState.raf);
        animationState.raf = null;
      }
      animationState.mode = 'pause';
    }
  }

  /**
   * Start playing an animation.  If we haven't played it yet, create some
   * arrays used for the animation.
   */
  function animation_play() {
    if (animationState.mode === 'play' || !pointFeature.data()) {
      return;
    }
    var data = pointFeature.data(),
        datalen = data.length;
    if (!datalen) {
      return;
    }
    animationState.duration = 15000;  // in milliseconds
    if (animationState.position === undefined || animationState.position === null) {
      animationState.position = 0;
    }
    animationState.startTime = Date.now() - animationState.duration * animationState.position;
    if (!animationState.styleArrays || datalen !== animationState.order.length) {
      animationState.order = new Array(datalen);
      if (!animationState.orderedData) {
        var posFunc = pointFeature.position(), posVal, i;
        // sort our data by x so we get a visual ripple across it
        for (i = 0; i < datalen; i += 1) {
          posVal = posFunc(data[i], i);
          animationState.order[i] = {i: i, x: posVal.x, y: posVal.y};
        }
        animationState.order = animationState.order.sort(function (a, b) {
          if (a.x !== b.x) { return b.x - a.x; }
          if (a.y !== b.y) { return b.y - a.y; }
          return b.i - a.i;
        }).map(function (val) {
          return val.i;
        });
      } else {
        for (i = 0; i < datalen; i += 1) {
          animationState.order[i] = i;
        }
      }
      animationState.styleArrays = {
        p: new Array(datalen),
        radius: new Array(datalen),
        fill: new Array(datalen),
        fillColor: new Array(datalen),
        fillOpacity: new Array(datalen),
        stroke: new Array(datalen),
        strokeColor: new Array(datalen),
        strokeOpacity: new Array(datalen),
        strokeWidth: new Array(datalen)
      };
      for (i = 0; i < datalen; i += 1) {
        animationState.styleArrays.fillColor[i] = {r: 0, g: 0, b: 0};
        animationState.styleArrays.strokeColor[i] = {r: 0, g: 0, b: 0};
      }
    }
    animationState.mode = 'play';
    animation_frame();
  }

  /**
   * Clear any animation timeout and reset the styles to the original values.
   */
  function animation_stop() {
    if (animationState.mode && animationState.mode !== 'stop') {
      if (animationState.raf) {
        window.cancelAnimationFrame(animationState.raf);
        animationState.raf = null;
      }
      reset_styles();
      animationState.position = null;
      animationState.mode = 'stop';
    }
  }

  /**
   * Reset all of the styles to the defaults and redraw the feature.
   */
  function reset_styles() {
    pointFeature.style({
      fill: true,
      fillColor: { r: 1.0, g: 0.839, b: 0.439 },
      fillOpacity: 0.8,
      radius: 5.0,
      stroke: true,
      strokeColor: { r: 0.851, g: 0.604, b: 0.0 },
      strokeWidth: 1.25,
      strokeOpacity: 1.0
    });
    pointFeature.draw();
  }

  /**
   * Show the framerate averaged over the last five seconds.
   */
  function show_framerate() {
    if (timeRecords.frames.length < 2) {
      return;
    }
    var timeSpan = 5000,
        endPos = timeRecords.frames.length - 1,
        endTime = timeRecords.frames[endPos],
        startPos, startTime, fps, generate = 0, update = 0;
    for (startPos = endPos; startPos > 0; startPos -= 1) {
      if (endTime - timeRecords.frames[startPos] > timeSpan) {
        break;
      }
      generate += timeRecords.generate[startPos];
      update += timeRecords.update[startPos];
    }
    startTime = timeRecords.frames[startPos];
    timeSpan = endTime - startTime;
    fps = (endPos - startPos) * 1000 / timeSpan;
    generate /= (endPos - startPos);
    update /= (endPos - startPos);
    $('#timing-framerate').text(fps.toFixed(1));
    $('#timing-generate').text(generate.toFixed(1));
    $('#timing-update').text(update.toFixed(1));
    if (startPos > 1000) {
      timeRecords.frames.splice(0, startPos);
      timeRecords.generate.splice(0, startPos);
      timeRecords.update.splice(0, startPos);
    }
  }

  map.createLayer('osm');
  layer = map.createLayer('feature', layerOptions);
  pointFeature = layer.createFeature('point', {
    primitiveShape: query.primitive ? query.primitive : 'sprite'
  })
  .position(function (d) {
    return {x: d[2], y: d[1]};
  });

  fetch_data();
  $('#controls').on('change', change_controls);
  $('button#play').on('click', animation_play);
  $('button#pause').on('click', animation_pause);
  $('button#stop').on('click', animation_stop);
});
