
window.startTest = function (done) {
  'use strict';

  var map = geo.map({node: '#map', zoom: 3, center: {x: -70, y: 40}});

  map.createLayer(
    'osm',
    {url: function () { return '/data/white.jpg'; }}
  );
  map.createLayer(
    'osm',
    {attribution: '', url: function () { return '/data/red.jpg'; }}
  );
  map.createLayer('ui').createWidget('slider');
  map.createLayer(
    'osm',
    {attribution: '', url: function () { return '/data/blue.jpg'; }}
  );
  map.createLayer('ui').createWidget('slider');

  // give the tiles a chance to load
  map.onIdle(done);
};
