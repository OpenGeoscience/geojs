/*global window, geo, inherit, $, d3*/
window.startTest = function(done) {
  var mapOptions = {center : { y: 40, x: -105}},
      myMap = window.geoTests.createOsmMap(mapOptions);

  function draw(data) {
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
          .position(function (d) { return {x: d.lon, y: d.lat}; });

        s_update.call(this, request);
      };

      return this;
    };
    inherit(timeAnimatedLayer, geo.featureLayer);

    geo.registerLayer('timeAnimatedLayer', timeAnimatedLayer);

    var layer = myMap.createLayer('timeAnimatedLayer', {
      renderer: 'd3Renderer',
      data: data
    });
    myMap.onIdle(done);
  }

  window.geoTests.loadCitiesData(draw);

  window.animateForward = function (nFrames, done) {
    var i;
    for (i = 0; i < nFrames; i += 1) {
      myMap.stepAnimationForward();
    }
    if (done) {
      myMap.onIdle(done);
    }
  };

  window.animateBackward = function (nFrames, done) {
    var i;
    for (i = 0; i < nFrames; i += 1) {
      myMap.stepAnimationBackward();
    }
    if (done) {
      myMap.onIdle(done);
    }
  };

  window.animateToEnd = function (done) {
    myMap.animate();
    myMap.geoOn(geo.event.animationComplete, function () {
      myMap.onIdle(done);
    });
  };
};
