var $ = require('jquery');

describe('glPointsSpeed', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('speed test', function (done) {
    var numPoints = 250000,
        points = [], i, times = [], starttime, stoptime, totaltime = 0,
        frames = 0, animTimes = [], firsttime, dx = 0, dy = 0, pass = 0;

    var mapOptions = {center: {x: -105.0, y: 40.0}};
    myMap = common.createOsmMap(mapOptions, {}, true);

    var layer = myMap.createLayer('feature', {renderer: 'vgl'});
    var feature = layer.createFeature('point', {
      selectionAPI: false,
      dynamicDraw: true
    });

    function postLoadTest() {
      times.sort(function (a, b) { return a - b; });
      if (times.length > 5) {
        times = times.slice(1, times.length - 1);
      }
      totaltime = 0;
      for (i = 0; i < times.length; i += 1) {
        totaltime += times[i];
      }
      totaltime /= times.length;
      console.log('Load time ' + totaltime + ' ms (average across ' +
                  times.length + ' loads)');
      console.log(times);
      // very minimal test threshold
      expect(totaltime).toBeLessThan(10000);
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
      // very minimal test threshold; this is mostly to collect data
      expect(fps).toBeGreaterThan(0.1);
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
      if (times.length < 12 && stoptime - firsttime < 10000) {
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
        vis = (i % 10) === (frames % 10) ? 0.1 : -1.0;
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

    common.loadCitiesData(function (citieslatlon) {
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

      firsttime = new Date().getTime();
      loadTest();
    });
  }, 30000);
});
