/*global window, geo, inherit, $, d3*/
window.startTest = function(done) {
  var mapOptions = {node: '#map',
                    zoom : 2,
                    center : [40, -105]},
    myMap = geo.map(mapOptions),
    osm = myMap.createLayer('osm', {baseUrl: '/data/tiles/'});

  var timeAnimatedLayer = function(arg) {
    "use strict";
    if (!(this instanceof timeAnimatedLayer)) {
      return new timeAnimatedLayer(arg);
    }
    geo.featureLayer.call(this, arg);

    var s_update = this._update, m_start, m_end, m_timesteps, i, time,
        m_startIndex = 0, m_endIndex = 10, m_pointFeature = null;

    m_start = new Date();
    m_end = new Date(m_start.getTime());
    m_end.setDate(m_end.getDate() + 100);
    m_timesteps = {};


    // Generate some fake timesteps
    for(i=0; i< 100; i++) {
      time = new Date(m_start.getTime());
      time.setDate(time.getDate() + i);
      m_timesteps[time.getTime()]= (Math.random() * 100) + 1;
    }

    this.timeRange = function() {

      return {'start': m_start, 'end': m_end, deltaUnits: 'days', delta: 1};
    };

    this._update = function(request) {
      var latlons;

      if (request === undefined || !request.hasOwnProperty('timestep')) {
        return;
      }

      latlons = arg.data.slice(m_startIndex++, m_endIndex++);

      if (!m_pointFeature) {
        m_pointFeature = this.createFeature('point');
        m_pointFeature.style({
          'radius': function () { return 5; },
          'color': function () { return {r: 1, g: 0, b: 0}; },
          'stroke': function () { return false; }
        });
      }
      
      m_pointFeature.data(latlons)
        .position(function (d) { return {x: d.x(), y: d.y()}; });

      s_update.call(this, request);
    };

    return this;
  };
  inherit(timeAnimatedLayer, geo.featureLayer);

  geo.registerLayer('timeAnimatedLayer', timeAnimatedLayer);

  function updateAndDraw(width, height) {
    myMap.resize(0, 0, width, height);
    myMap.draw();
  }

  function resizeCanvas() {
    $('#map').width('100%');
    $('#map').height('100%');
    updateAndDraw($('#map').width(), $('#map').height());
  }
  resizeCanvas();

  /// Resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);

  function draw(data) {
    var layer = myMap.createLayer('timeAnimatedLayer', {
      renderer: 'd3Renderer',
      data: data
    });
    myMap.onIdle(done);
  }

  $.ajax({
    type: "GET",
    url: "/data/cities.csv",
    dataType: "text",
    success: function (csv) {
      var i, row, rows = csv.split('\n'),
          data = [], lat, lng;
      for (i = 0; i < rows.length; i++) {
        row = rows[i].split(',');
        if (row[2]) {
          lat = row[2];
          lat = lat.replace(/(^\s+|\s+$|^\"|\"$)/g, '');
          lat = parseFloat(lat);
          lng = row[3];
          lng = lng.replace(/(^\s+|\s+$|^\"|\"$)/g, '');
          lng = parseFloat(lng);

          data.push(geo.latlng(lat, lng));
        }
      }
      draw(data);
    }
  });

  window.animateForward = function (nFrames) {
    var i;
    for (i = 0; i < nFrames; i += 1) {
      myMap.stepAnimationForward();
    }
  };

  window.animateBackward = function (nFrames) {
    var i;
    for (i = 0; i < nFrames; i += 1) {
      myMap.stepAnimationBackward();
    }
  };

  window.animateToEnd = function (done) {
    myMap.animate();
    myMap.on(geo.event.animationComplete, function () {
      myMap.onIdle(done);
    });
  };
};
