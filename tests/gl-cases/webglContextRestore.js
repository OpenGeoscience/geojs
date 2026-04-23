describe('webglContextRestore', function () {
  var common = require('../test-common');
  var imageTest = require('../image-test');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    if (myMap) {
      myMap.exit();
      myMap = null;
    }
  });

  it('recovers after WEBGL_lose_context lose/restore', function (done) {
    var mapOptions = {center: {x: -95, y: 39}, zoom: 4};
    myMap = common.createOsmMap(mapOptions, {}, true);

    var layer = myMap.createLayer('feature', {renderer: 'webgl'});
    layer.createFeature('point')
      .data([{x: -95, y: 39}, {x: -96, y: 38.5}, {x: -94, y: 39.5}])
      .position(function (d) {
        return d;
      })
      .style({
        radius: 8,
        fillColor: {r: 0.9, g: 0.1, b: 0.1},
        fillOpacity: 1
      });

    myMap.draw();
    myMap.onIdle(function () {
      var renderer = layer.renderer();
      var context = renderer && renderer._glContext && renderer._glContext();
      var ext = context && context.getExtension &&
        context.getExtension('WEBGL_lose_context');
      var canvas = renderer && renderer.canvas && renderer.canvas().get(0);

      if (!ext || !ext.loseContext || !ext.restoreContext || !canvas) {
        pending('WEBGL_lose_context is not available in this environment.');
        done();
        return;
      }

      // Losing/restoring context can emit expected transient shader/program
      // compile/link errors/warnings/logs while the context is invalid; suppress them for
      // this test window so they don't clutter the output.
      var originalConsoleError = console.error;
      var originalConsoleWarn = console.warn;
      var originalConsoleLog = console.log;
      console.error = function () {};
      console.warn = function () {};
      console.log = function () {};
      function restoreConsoleMethods() {
        if (console.error !== originalConsoleError) {
          console.error = originalConsoleError;
        }
        if (console.warn !== originalConsoleWarn) {
          console.warn = originalConsoleWarn;
        }
        if (console.log !== originalConsoleLog) {
          console.log = originalConsoleLog;
        }
      }

      var restoreTimeout = window.setTimeout(function () {
        restoreConsoleMethods();
        fail('Timed out waiting for webglcontextrestored.');
        done();
      }, 5000);

      canvas.addEventListener('webglcontextrestored', function () {
        window.clearTimeout(restoreTimeout);
        myMap.draw();
        myMap.onIdle(function () {
          restoreConsoleMethods();
          expect(renderer._glContext()).toBeTruthy();
          done();
        });
      }, {once: true});

      canvas.addEventListener('webglcontextlost', function (evt) {
        // Required for restoration in many browsers/drivers.
        evt.preventDefault();
        // Defer restore until after the lost event handler returns.
        window.setTimeout(function () {
          ext.restoreContext();
        }, 0);
      }, {once: true});

      ext.loseContext();
    });
  }, 30000);
});
