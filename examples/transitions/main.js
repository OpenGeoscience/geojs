$(function () {
  'use strict';

  function draw_map() {

  var map;

  $(function () {

    map = geo.map({node: '#map', center: {x: -70, y: 30}, zoom: 10});
    map.createLayer('osm');
    var ui = map.createLayer('ui');
    var legend = ui.createWidget('legend');


    var data = [{x: -70, y: 30}];

    var point_gl0 = map.createLayer('feature', {'render': 'vgl'}).createFeature('point');
        // ,
        // point_d30 = map.createLayer('feature', {'render': 'd3'}).createFeature('point'),
        // point_gl1 = null,
        // point_d31 = null;

    // Reove this line to watch the points get offset
    // map.bounds(
    //   { lowerLeft:
    //       {x:-100, y:0 },
    //     upperRight:
    //       {x:-60, y:40} }
    // );

    var gl0_style = {
      'radius': 12,
      'strokeColor': 'steelblue',
      'strokeWidth': 2,
      'fillColor': 'steelblue',
      'fillOpacity': 0.25
    };

   //  var d30_style = {
   //    'radius': 12,
   //    'strokeColor': 'firebrick',
   //    'strokeWidth': 2,
   //    'fillColor': 'firebrick',
   //    'fillOpacity': 0.25
   //  };

   // var gl1_style = {
   //    'radius': 6,
   //    'stroke': false,
   //    'fillColor': 'blue',
   //    'fillOpacity': 1
   //  };

   //  var d31_style = {
   //    'radius': 6,
   //    'stroke': false,
   //    'fillColor': 'red',
   //    'fillOpacity': 1
   //  };

    legend.categories([
      {name: 'gl reference', style: gl0_style, type: 'point'},
      // {name: 'd3 reference', style: d30_style, type: 'point'},
      // {name: 'gl delayed', style: gl1_style, type: 'point'},
      // {name: 'd3 delayed', style: d31_style, type: 'point'}
    ]);

    point_gl0
      .style(gl0_style)
      .data([{x: -70, y: 30}]);

    // point_d30
    //   .style(d30_style)
    //   .data([{x: -65, y: 30}]);

    map.draw();

    // draw points
    function draw_points() {
      point_gl1 = map.createLayer('feature', {'render': 'vgl'}).createFeature('point');
      point_d31 = map.createLayer('feature', {'render': 'd3'}).createFeature('point');

      point_gl1
        .style(gl1_style)
        .data([{x: -75, y: 30}]);

      point_d31
        .style(d31_style)
        .data([{x: -65, y: 30}]);

      map.draw();
    }

    function draw_points_after_2seconds() {

      var i = 0;
      function tick() {
        i += 1;
        $('#time-left').val((2 - i / 100).toFixed(2));
        if (i < 200) {
          window.setTimeout(tick, 10);
        } else {
          draw_points();
        }
      }
      tick();
    }

    $('#add-point').click(draw_points_after_2seconds);
  });
}

draw_map();
});


