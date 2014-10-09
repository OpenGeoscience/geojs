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

    var interactor = geo.mapInteractor({
      map: map,
      panMoveButton: 'left',
      panWheelEnabled: false,
      zoomMoveButton: null,
      zoomWheelEnabled: false,
    });

    function handler(evt) {
      handler.nCalls += 1;
      handler.evt = evt;
    }
    handler.nCalls = 0;
    handler.evt = {};

    map.geoOn(geo.event.pan, handler);

    // initiate a pan
    interactor.simulateEvent(
      'mousedown',
      {
        map: {x: 0, y: 0},
        button: 'left'
      }
    );

    // trigger a pan
    interactor.simulateEvent(
      'mousemove',
      {
        map: {x: 10, y: 10},
        button: 'left'
      }
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

    // end the pan
    interactor.simulateEvent(
      'mouseup',
      {
        map: {x: 0, y: 20},
        button: 'left'
      }
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

  it('Test zoom event propagation', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor({
      map: map,
      panMoveButton: null,
      panWheelEnabled: false,
      zoomMoveButton: null,
      zoomWheelEnabled: true,
    });

    function handler(evt) {
      handler.nCalls += 1;
      handler.evt = evt;
    }
    handler.nCalls = 0;
    handler.evt = {};

    map.geoOn(geo.event.zoom, handler);

    // initialize the mouse position
    interactor.simulateEvent(
      'mousemove',
      {
        map: {x: 20, y: 20},
      }
    );

    // trigger a zoom
    interactor.simulateEvent(
      'mousewheel',
      {
        wheelDelta: {x: 20, y: -10},
      }
    );

    // check the pan event was called
    expect(handler.nCalls).toBe(1);
    expect(handler.evt.zoomFactor).toBe(-10);
  });
});
