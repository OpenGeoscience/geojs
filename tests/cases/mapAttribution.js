describe('Test adding and remove attribution via layers', function () {
  'use strict';

  var $ = require('jquery');
  var createMap = require('../test-utils').createMap;

  // Return all attribution nodes
  function getAttribution() {
    return $('#map > .geo-attribution > .geo-attribution-layer');
  }

  it('Attribution added via constructor argument', function () {
    var map = createMap();

    map.createLayer('feature', {
      attribution: '<div id="test-constructor"/>',
      renderer: 'd3'
    });

    var $a = getAttribution();
    expect($a.length).toBe(1);
    expect($a.find('#test-constructor').length).toBe(1);
  });

  it('Modifying an attribution after creation', function () {
    var map = createMap();

    var layer = map.createLayer('feature', {renderer: 'd3'});

    layer.attribution('<div id="test-setter"/>');

    var $a = getAttribution();
    expect($a.length).toBe(1);
    expect($a.find('#test-setter').length).toBe(1);
  });

  it('Multiple attributions', function () {
    var map = createMap();

    var layer = map.createLayer('feature', {renderer: 'd3'});
    layer.attribution('<div id="test-1"/>');

    layer = map.createLayer('feature', {renderer: 'd3'});
    layer.attribution('<div id="test-2"/>');

    layer = map.createLayer('feature', {renderer: 'd3'});
    layer.attribution('<div id="test-3"/>');

    var $a = getAttribution();
    expect($a.length).toBe(3);
    expect($a.find('#test-1').length).toBe(1);
    expect($a.find('#test-2').length).toBe(1);
    expect($a.find('#test-3').length).toBe(1);
  });

  it('Remove attribution on remove layer', function () {
    var map = createMap();

    var layer = map.createLayer('feature', {renderer: 'd3'});
    layer.attribution('<div id="test"/>');

    var $a = getAttribution();
    expect($a.length).toBe(1);

    map.deleteLayer(layer);

    $a = getAttribution();
    expect($a.length).toBe(0);
  });
});
