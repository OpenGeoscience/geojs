window.startTest = function (done) {
  'use strict';

  var mapOptions = { center: { y: 40.0, x: -105.0 } };

  var myMap = window.geoTests.createOsmMap(mapOptions);

  var layer = myMap.createLayer('feature');
  var feature = layer.createFeature('point');

  window.geoTests.loadCitiesData(function (citieslatlon) {
    var numPoints = 250000,
        points = [], i, times = [], starttime, stoptime, totaltime = 0,
        frames = 0, pass = 0, dx = 0, dy = 0, animTimes = [];

    function postLoadTest() {
      times.sort(function (a, b) { return a - b; });
      if (times.length > 5) {
        times = times.slice(1, times.length - 1);
      }
      for (i = 0; i < times.length; i += 1) {
        totaltime += times[i];
      }
      totaltime /= times.length;
      console.log('Load time ' + totaltime + ' ms (average across ' +
                  times.length + ' loads)');
      console.log(times);
      /* Test animation time. */
      starttime = new Date().getTime();
      animationFrame();
      $('#map').append($('<div style="display: none" id="loadResults">')
        .attr('results', totaltime));
    }

    function postAnimationTest() {
      var vpf, opac, i, j, v, fps, frametime;

      console.log('Average framerate ' +
        (frames * 1000.0 / (stoptime - starttime)));

      vpf = feature.verticesPerFeature();
      opac = feature.actors()[0].mapper().getSourceBuffer('fillOpacity');
      for (i = v = 0; i < numPoints; i += 1) {
        for (j = 0; j < vpf; j += 1, v += 1) {
          opac[v] = 0.05;
        }
      }
      feature.actors()[0].mapper().updateSourceBuffer('fillOpacity');
      myMap.draw();

      for (i = animTimes.length - 1; i > 0; i -= 1) {
        animTimes[i] -= animTimes[i - 1];
      }

      animTimes = animTimes.slice(1);
      animTimes.sort(function (a, b) { return a - b; });
      frametime = animTimes[parseInt(0.99 * animTimes.length)];
      fps = 1000.0 / frametime;
      console.log('Usable framerate ' + fps);
      console.log(animTimes);
      $('#map').append($('<div style="display: none" id="framerateResults">')
        .attr('results', fps));

      myMap.onIdle(done);
    }

    function loadTest() {
      starttime = new Date().getTime();
      feature.data(points)
        .style({
          fillColor: 'black',
          fillOpacity: 0.05,
          stroke: false,
          radius: 5
        });
      myMap.draw();
      stoptime = new Date().getTime();
      times.push(stoptime - starttime);
      if (times.length < 12 && stoptime - starttime < 10000) {
        window.setTimeout(loadTest, 1);
      } else {
        postLoadTest();
      }
    }

    function animationFrame() {
      var vpf, opac, vis, i, j, v;

      vpf = feature.verticesPerFeature();
      opac = feature.actors()[0].mapper().getSourceBuffer('fillOpacity');
      for (i = v = 0; i < numPoints; i += 1) {
        /* show 20% of the points each frame */
        vis = (i % 5) === (frames % 5) ? 0.1 : 0.0;
        for (j = 0; j < vpf; j += 1, v += 1) {
          opac[v] = vis;
        }
      }
      feature.actors()[0].mapper().updateSourceBuffer('fillOpacity');
      myMap.draw();
      frames += 1;
      stoptime = new Date().getTime();
      animTimes.push(stoptime);
      if (animTimes.length < 2 || (animTimes.length < 201 &&
          stoptime - animTimes[0] < 10000)) {
        window.setTimeout(animationFrame, 1);
      } else {
        postAnimationTest();
      }
    }

    /* Duplicate the data, offsetting the additional points */
    while (points.length < numPoints) {
      for (i = 0; i < citieslatlon.length && points.length < numPoints;
           i += 1) {
        points.push({
          x: citieslatlon[i].lon + dx,
          y: citieslatlon[i].lat + dy,
          z: citieslatlon[i].elev
        });
      }
      pass += 1;
      dx = Math.cos(pass) * 0.2;
      dy = Math.sin(pass) * 0.2;
    }

    loadTest();

  });
};
