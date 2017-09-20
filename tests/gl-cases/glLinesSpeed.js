var $ = require('jquery');

describe('glLinesSpeed', function () {
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
    var numLines = 100000,
        lines = [], i, j, times = [], starttime, stoptime, totaltime = 0,
        frames = 0, animTimes = [], firsttime;

    var mapOptions = {center: {x: -105.0, y: 40.0}};
    myMap = common.createOsmMap(mapOptions, {}, true);

    var layer = myMap.createLayer('feature');
    var feature = layer.createFeature('line', {
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
      opac = feature.actors()[0].mapper().getSourceBuffer('strokeOpacity');
      for (i = v = 0; i < numLines; i += 1) {
        for (j = 0; j < vpf; j += 1, v += 1) {
          opac[v] = 0.05;
        }
      }
      feature.actors()[0].mapper().updateSourceBuffer('strokeOpacity');
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
      expect(fps).toBeGreaterThan(1.0);
      $('#map').append($('<div style="display: none" id="framerateResults">')
        .attr('results', fps));

      myMap.onIdle(done);
    }

    function loadTest() {
      starttime = new Date().getTime();
      feature.data(lines)
        .style({
          strokeColor: function (d) {
            return d.strokeColor;
          },
          antialiasing: 0,
          strokeWidth: 5,
          strokeOpacity: 0.05
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
      opac = feature.actors()[0].mapper().getSourceBuffer('strokeOpacity');
      for (i = v = 0; i < numLines; i += 1) {
        /* show 20% of the lines each frame */
        vis = (i % 10) === (frames % 10) ? 0.1 : -1.0;
        for (j = 0; j < vpf; j += 1, v += 1) {
          opac[v] = vis;
        }
      }
      feature.actors()[0].mapper().updateSourceBuffer('strokeOpacity');
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
      /* Connect various cities with lines */
      for (j = 1; lines.length < numLines; j += 1) {
        for (i = 0; i < citieslatlon.length - j && lines.length < numLines;
             i += j + 1) {
          lines.push([{
            x: citieslatlon[i].lon,
            y: citieslatlon[i].lat,
            z: citieslatlon[i].elev,
            strokeColor: {r: 0, g: 0, b: 1}
          }, {
            x: citieslatlon[i + j].lon,
            y: citieslatlon[i + j].lat,
            z: citieslatlon[i + j].elev,
            strokeColor: {r: 1, g: 1, b: 0}
          }]);
        }
      }

      firsttime = new Date().getTime();
      loadTest();
    });
  }, 30000);
});
