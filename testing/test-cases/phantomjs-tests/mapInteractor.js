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
    var info = {
      pan: 0,
      zoom: 0,
      panArgs: {},
      zoomArgs: {}
    };

    map.node = function () { return $(node); };
    base.displayToGcs = function (x) { return x; };
    map.baseLayer = function () { return base; };
    map.zoom = function (arg) {
      if (arg === undefined) {
        return 2;
      }
      info.zoom += 1;
      info.zoomArgs = arg;
    };
    map.zoom.nCalls = 0;
    map.pan = function (arg) {
      info.pan += 1;
      info.panArgs = arg;
    };
    map.center = function () {
      return {x: 0, y: 0};
    };
    map.displayToGcs = base.displayToGcs;
    map.info = info;
    map._zoomCallback = function () {};
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
    expect(map.info.pan).toBe(1);
    expect(map.info.panArgs.x).toBe(10);
    expect(map.info.panArgs.y).toBe(10);

    // trigger a pan
    interactor.simulateEvent(
      'mousemove',
      {
        map: {x: 9, y: 12},
        button: 'left'
      }
    );

    // check the pan event was called
    expect(map.info.pan).toBe(2);
    expect(map.info.panArgs.x).toBe(-1);
    expect(map.info.panArgs.y).toBe(2);

    // trigger a pan on a different element
    $('#mapNode2').trigger(
      evtObj('mousemove', {pageX: 0, pageY: 20})
    );

    // check the pan event was called
    expect(map.info.pan).toBe(3);

    // end the pan
    interactor.simulateEvent(
      'mouseup',
      {
        map: {x: 0, y: 20},
        button: 'left'
      }
    );

    // check the pan event was NOT called
    expect(map.info.pan).toBe(3);

    // trigger another mousemove
    $('#mapNode1').trigger(
      evtObj('mousemove', {pageX: 10, pageY: 0})
    );

    // check the pan event was NOT called
    expect(map.info.pan).toBe(3);
  });

  it('Test zoom wheel event propagation', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor({
      map: map,
      panMoveButton: null,
      panWheelEnabled: false,
      zoomMoveButton: null,
      zoomWheelEnabled: true,
    });

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

    // check the zoom event was called
    expect(map.info.zoom).toBe(1);
    expect(map.info.zoomArgs).toBe(2 - 10 / 120);
  });

  it('Test zoom right click event propagation', function () {
    var map = mockedMap('#mapNode1'), z;

    var interactor = geo.mapInteractor({
      map: map,
      panMoveButton: null,
      panWheelEnabled: false,
      zoomMoveButton: 'right',
      zoomWheelEnabled: false,
    });

    // initialize the zoom
    interactor.simulateEvent(
      'mousedown',
      {
        map: {x: 20, y: 20},
        button: 'right'
      }
    );

    // create a zoom event
    interactor.simulateEvent(
      'mousemove',
      {
        map: {x: 20, y: 10},
        button: 'right'
      }
    );

    // check the zoom event was called
    expect(map.info.zoom).toBe(1);
    expect(map.info.zoomArgs).toBe(2 + 10 / 120);

    z = map.zoom();

    // create a zoom event
    interactor.simulateEvent(
      'mousemove',
      {
        map: {x: 30, y: 25},
        button: 'right'
      }
    );

    // check the zoom event was called
    expect(map.info.zoom).toBe(2);
    expect(map.info.zoomArgs).toBe(z - 15 / 120);
  });
});
