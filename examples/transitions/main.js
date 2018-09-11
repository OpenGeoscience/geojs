/* globals $, d3, geo, utils */

// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    zoom: 6,
    center: {x: 28.9550, y: 41.0136}
  });

  var query = utils.getQuery();

  if (query.test) {
    $('#test').removeClass('hidden');
  }

  // Add an OSM layer
  map.createLayer('osm', {
    renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined
  });

  // Bind button clicks to map transitions
  $('#pan-to-london').click(function () {
    map.transition({
      center: {x: -0.1275, y: 51.5072},
      duration: 2000
    });
  });

  $('#elastic-to-moscow').click(function () {
    map.transition({
      center: {x: 37.6167, y: 55.7500},
      duration: 2000,
      ease: function (t) {
        return Math.pow(2.0, -10.0 * t) * Math.sin((t - 0.075) * (2.0 * Math.PI) / 0.3) + 1.0;
      }
    });
  });

  $('#bounce-to-istanbul').click(function () {
    map.transition({
      center: {x: 28.9550, y: 41.0136},
      duration: 2000,
      ease: function (t) {
        var r = 2.75;
        var s = 7.5625;
        if (t < 1.0 / r) {
          return s * t * t;
        }
        if (t < 2.0 / r) {
          t -= 1.5 / r;
          return s * t * t + 0.75;
        }
        if (t < 2.5 / r) {
          t -= 2.25 / r;
          return s * t * t + 0.9375;
        }
        t -= 2.625 / r;
        return s * t * t + 0.984375;
      }
    });
  });

  $('#fly-to-bern').click(function () {
    map.transition({
      center: {x: 7.4500, y: 46.9500},
      duration: 2000,
      interp: d3.interpolateZoom
    });
  });

  $('#spin-to-budapest').click(function () {
    map.transition({
      center: {x: 19.0514, y: 47.4925},
      rotation: Math.PI * 2,
      duration: 2000
    });
  });

  $('#test').click(function () {
    geo.util.timeRequestAnimationFrame(undefined, undefined, undefined, 10000);
    var list = [
      'pan-to-london', 'elastic-to-moscow', 'bounce-to-istanbul',
      'fly-to-bern', 'spin-to-budapest'];
    var maxrepeat = 3, repeat, i, l;
    for (repeat = 0, i = 0; repeat < maxrepeat; repeat += 1) {
      for (l = 0; l < list.length; l += 1, i += 1) {
        window.setTimeout((function (id) {
          return function () {
            $(id).click();
          };
        })('#' + list[l]), i * 2250);
      }
    }
    window.setTimeout(function () {
      var res = geo.util.timeReport('requestAnimationFrame');
      console.log(JSON.stringify(res));
      var modal = $(
        '<div class="modal fade"><div class="modal-dialog">' +
        '<div class="modal-content"><div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal">&times;' +
        '</button><h4 class="modal-title">Test Results</h4></div>' +
        '<div class="modal-body"/></div></div></div>'
      );
      var report = {
        count: res.count,
        max: res.max,
        above_threshold: res.above_threshold,
        subcalls: res.subcalls,
        stddev: res.stddev,
        average: res.average
      };
      $('.modal-body', modal).append($('<div/>').text(
        JSON.stringify(report, undefined, 2)));
      modal.modal();
    }, maxrepeat * list.length * 2250);
  });
});
