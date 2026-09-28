/* globals utils */

// We will store some values in exampleDebug to allow experimentation from the
// console
var exampleDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  var query = utils.getQuery();
  var capitals, inPan, animationQueue = [];

  // Load a list of capital cities
  $.when(
    $.ajax({url: '../reprojection/capitals.json'}).done(function (resp) {
      capitals = resp;
    })
  ).then(function () {
    // Once loaded, create our maps.  The two maps are centered on each other,
    // so we can always use the same center, zoom, and rotation.
    var mapParams = {
      center: {
        x: -119.5420833,
        y: 37.4958333
      },
      zoom: 8
    };
    // Our first map uses the default tile set
    var params1 = $.extend(true, {}, mapParams, {node: '#map'});
    params1.animationQueue = animationQueue;
    var map1 = geo.map(params1);
    var layer1 = map1.createLayer('osm');

    var uiLayer1 = map1.createLayer('ui', {zIndex: 2});
    var tooltip1 = uiLayer1.createWidget('dom', {position: {x: 0, y: 0}});
    var tooltipElem1 = $(tooltip1.canvas()).attr('id', 'tooltip1').addClass(
      'hidden');

    if (query.circular === 'true') {
      $('#insetdiv').addClass('circular');
    }
    // The second map uses satellite imagery.  Instead of creating a second
    // map, we could have just created a second layer and then used CSS to
    // limit the size of the layer.
    var params2 = $.extend(true, {}, mapParams, {node: '#insetmap'});
    params2.animationQueue = animationQueue;
    var map2 = geo.map(params2);
    var layer2 = map2.createLayer('osm', {
      source: 'nationalmap-satellite'
    });

    var uiLayer2 = map2.createLayer('ui', {zIndex: 2});
    var tooltip2 = uiLayer2.createWidget('dom', {position: {x: 0, y: 0}});
    var tooltipElem2 = $(tooltip2.canvas()).attr('id', 'tooltip2').addClass(
      'hidden');

    // Place the world capitals on the first map
    var pointLayer1 = map1.createLayer('feature', {features: ['point'], zIndex: 1});
    var pointFeature1 = pointLayer1
      .createFeature('point', {
        selectionAPI: true,
        style: {
          fillColor: '#8080FF',
          fillOpacity: function (d) { return d.opacity ? d.opacity : 0.25; },
          strokeColor: 'black',
          strokeOpacity: function (d) {
            return d.strokeOpacity ? d.strokeOpacity : 0.25;
          }
        },
        visible: query.capitals !== 'false'
      })
      .data(capitals)
      .position(function (d) {
        return {x: d.longitude, y: d.latitude};
      })
      .geoOn(geo.event.feature.mouseclick, function (evt) {
        pointLayer1.map().center({x: evt.data.longitude, y: evt.data.latitude});
      })
      .geoOn(geo.event.feature.mouseover, function (evt) {
        evt.data.opacity = 0.5;
        evt.data.strokeOpacity = 1;
        this.modified();
        this.draw();
        tooltip1.position({x: evt.data.longitude, y: evt.data.latitude});
        tooltipElem1.text(evt.data.city);
        tooltipElem1.removeClass('hidden');

        tooltip2.position({x: evt.data.longitude, y: evt.data.latitude});
        tooltipElem2.text(evt.data.city);
        tooltipElem2.removeClass('hidden');
      })
      .geoOn(geo.event.feature.mouseout, function (evt) {
        evt.data.opacity = undefined;
        evt.data.strokeOpacity = undefined;
        this.modified();
        this.draw();
        tooltipElem1.addClass('hidden');

        tooltipElem2.addClass('hidden');
      })
      .draw();

    // Place the world capitals on the second map
    var pointLayer2 = map2.createLayer('feature', {features: ['point'], zIndex: 1});
    var pointFeature2 = pointLayer2
      .createFeature('point', {
        selectionAPI: true,
        style: {
          fillColor: '#80FF80',
          fillOpacity: function (d) { return d.opacity ? d.opacity : 0.25; },
          strokeColor: 'green',
          strokeOpacity: function (d) {
            return d.strokeOpacity ? d.strokeOpacity : 0.25;
          }
        },
        visible: query.capitals !== 'false'
      })
      .data(capitals)
      .position(function (d) {
        return {x: d.longitude, y: d.latitude};
      })
      .geoOn(geo.event.feature.mouseclick, function (evt) {
        pointLayer2.map().center({x: evt.data.longitude, y: evt.data.latitude});
      })
      .geoOn(geo.event.feature.mouseover, function (evt) {
        evt.data.opacity = 0.5;
        evt.data.strokeOpacity = 1;
        this.modified();
        this.draw();
        tooltip2.position({x: evt.data.longitude, y: evt.data.latitude});
        tooltipElem2.text(evt.data.city);
        tooltipElem2.removeClass('hidden');

        tooltip1.position({x: evt.data.longitude, y: evt.data.latitude});
        tooltipElem1.text(evt.data.city);
        tooltipElem1.removeClass('hidden');
      })
      .geoOn(geo.event.feature.mouseout, function (evt) {
        evt.data.opacity = undefined;
        evt.data.strokeOpacity = undefined;
        this.modified();
        this.draw();
        tooltipElem2.addClass('hidden');

        tooltipElem1.addClass('hidden');
      })
      .draw();

    // Link the two maps together
    map1.geoOn(geo.event.pan, function (evt) {
      // note that we are in a pan event for the first map.  This prevents
      // getting into an endless loop
      if (inPan !== 2) {
        inPan = 1;
        map2.zoom(map1.zoom());
        // If our maps weren't concentric, then we would have to shift centers.
        /*
        var mapOffset1 = $('#map').offset(),
            mapOffset2 = $('#insetmap').offset(),
            centerX2 = mapOffset2.left + $('#insetmap').width() / 2,
            centerY2 = mapOffset2.top + $('#insetmap').height() / 2;
        map2.center(map1.displayToGcs({
          x: centerX2 - mapOffset1.left,
          y: centerY2 - mapOffset1.top}));
         */
        // Since they are concentric, the code is easy.
        map2.center(map1.center());
        map2.rotation(map1.rotation());
        inPan = 0;
      }
    });

    map2.geoOn(geo.event.pan, function (evt) {
      if (inPan !== 1) {
        inPan = 2;
        map1.zoom(map2.zoom());
        map1.center(map2.center());
        map1.rotation(map2.rotation());
        inPan = 0;
      }
    });

    // Expose a lot of internals to an object that can be reached from the
    // console
    exampleDebug.map1 = map1;
    exampleDebug.layer1 = layer1;
    exampleDebug.uiLayer1 = uiLayer1;
    exampleDebug.tooltip1 = tooltip1;
    exampleDebug.tooltipElem1 = tooltipElem1;
    exampleDebug.pointLayer1 = pointLayer1;
    exampleDebug.pointFeature1 = pointFeature1;

    exampleDebug.map2 = map2;
    exampleDebug.layer2 = layer2;
    exampleDebug.uiLayer2 = uiLayer2;
    exampleDebug.tooltip2 = tooltip2;
    exampleDebug.tooltipElem2 = tooltipElem2;
    exampleDebug.pointLayer2 = pointLayer2;
    exampleDebug.pointFeature2 = pointFeature2;
  });
});
