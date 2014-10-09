/* global describe, it, beforeEach, afterEach, expect, $, geo */

describe('mapInteractor', function () {
  'use strict';

  // An event object template that will work with the interactor
  // handlers.
  var evtObj = function (type, args) {
    args = $.extend({}, {
      pageX: 0,
      pageY: 0,
      type: type,
      which: 1,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false
    },
    args
    );

    return new $.Event(type, args);
  };

  function mockedMap(node) {
    var map = geo.object();
    var base = geo.object();

    map.node = function () { return $(node); };
    base.displayToGcs = function (x) { return x; };
    map.baseLayer = function () { return base; };
    map.displayToGcs = base.displayToGcs;
    return map;
  }

  beforeEach(function () {
    // create a new div
    $('body').append('<div id="mapNode1" class="mapNode"></div>');
    $('body').append('<div id="mapNode2" class="mapNode"></div>');
  });

  afterEach(function () {
    // delete the div
    $('.mapNode').remove();
  });

  it('Test initialization with given node.', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor({ map: map });

    expect(interactor.map()).toBe(map);

    interactor.destroy();

    expect(!!interactor.map()).toBe(false);
  });

  it('Test initialization without a map.', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor();

    expect(!!interactor.map()).toBe(false);

    interactor.map(map);
    expect(interactor.map()).toBe(map);

    interactor.destroy();
    expect(!!interactor.map()).toBe(false);

    interactor.map(map);
    expect(interactor.map()).toBe(map);
  });

  it('Test pan event propagation', function () {
    var map = mockedMap('#mapNode1');

    geo.mapInteractor({
      map: map,
      panMoveButton: 'left',
      zoomMoveButton: null
    });

    function handler(evt) {
      handler.nCalls += 1;
      handler.evt = evt;
    }
    handler.nCalls = 0;
    handler.evt = {};

    map.geoOn(geo.event.pan, handler);

    // initiate a pan
    $('#mapNode1').trigger(
        evtObj('mousedown', {pageX: 0, pageY: 0})
    );

    // trigger a pan
    $('#mapNode1').trigger(
      evtObj('mousemove', {pageX: 10, pageY: 10})
    );

    // check the pan event was called
    expect(handler.nCalls).toBe(1);
    expect(handler.evt.screenDelta.x).toBe(10);
    expect(handler.evt.screenDelta.y).toBe(10);

    // trigger a pan on a different element
    $('#mapNode2').trigger(
      evtObj('mousemove', {pageX: 0, pageY: 20})
    );

    // check the pan event was called
    expect(handler.nCalls).toBe(2);
    expect(handler.evt.screenDelta.x).toBe(-10);
    expect(handler.evt.screenDelta.y).toBe(10);

    // end the pan
    $('#mapNode1').trigger(
      evtObj('mouseup', {pageX: 0, pageY: 20})
    );

    // check the pan event was NOT called
    expect(handler.nCalls).toBe(2);

    // trigger another mousemove
    $('#mapNode1').trigger(
      evtObj('mousemove', {pageX: 10, pageY: 0})
    );

    // check the pan event was NOT called
    expect(handler.nCalls).toBe(2);
  });
});
