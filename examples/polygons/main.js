/* globals $, geo, utils */

var polygonDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  var query = utils.getQuery();
  var map = geo.map({
    node: '#map',
    center: {
      x: -88.0,
      y: 29
    },
    zoom: 4
  });
  if (query.map !== 'false') {
    map.createLayer('osm');
  }
  var layer = map.createLayer('feature', {
    renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
    features: query.renderer ? undefined : ['polygon']
  });
  var polygons = layer.createFeature('polygon', {selectionAPI: true});
  $.getJSON('../../data/land_polygons.json').done(function (data) {
    polygons.data(data)
      /* This is the default accessor, so we don't have to define it outselves.
      .polygon(function (d) {
        return d;
      })
      */
      .position(function (d) {
        return {x: d[0], y: d[1]};
      })
      .style('fillOpacity', 0.5)
      .style('fillColor', function (d, idx, poly, polyidx) {
        return poly.hover ? 'blue' : {
          r: (polyidx % 256) / 255,
          g: polyidx / (data.length - 1),
          b: 0.25
        };
      })
      .geoOn(geo.event.feature.mouseover, function (evt) {
        if (!evt.data.hover) {
          evt.data.hover = true;
          this.modified();
          this.draw();
        }
      })
      .geoOn(geo.event.feature.mouseout, function (evt) {
        if (evt.data.hover) {
          evt.data.hover = false;
          this.modified();
          this.draw();
        }
      })
      .draw();

    polygonDebug.map = map;
    polygonDebug.layer = layer;
    polygonDebug.polygons = polygons;
  });
});
