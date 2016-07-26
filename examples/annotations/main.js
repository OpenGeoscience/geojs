/* globals $, geo, utils */

var annotationDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  var query = utils.getQuery();
  var map = geo.map({
    node: '#map',
    center: {
      x: -119.5420833,
      y: 37.4958333
    },
    zoom: 8
  });
  if (query.map !== 'false') {
    if (query.map !== 'satellite') {
      annotationDebug.mapLayer = map.createLayer('osm');
    }
    if (query.map === 'satellite' || query.map === 'dual') {
      annotationDebug.satelliteLayer = map.createLayer('osm', {url: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png', opacity: query.map === 'dual' ? 0.25 : 1});
    }
  }
  var layer = map.createLayer('annotation', {
    renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
    features: query.renderer ? undefined : ['polygon']
  });

  map.draw();

  annotationDebug.map = map;
  annotationDebug.layer = layer;
});
