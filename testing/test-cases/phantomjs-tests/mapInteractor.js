/* global describe, it, beforeEach, afterEach, expect, $, geo,
   mockAnimationFrame, unmockAnimationFrame, stepAnimationFrame,
   mockDate, unmockDate, advanceDate */

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

  var zoomFactor = 120;
  var rotationFactor = 120;

  function mockedMap(node) {

    var map = geo.object();
    var base = geo.object();
    var info = {
      pan: 0,
      zoom: 0,
      rotation: 0,
      rotationArgs: {},
      panArgs: {},
      zoomArgs: {},
      center: $.extend({}, {x: 0, y: 0})
    };

    map.node = function () { return $(node); };
    base.displayToGcs = function (val) {
      return {
        x: val.x - info.center.x - $(node).width() / 2,
        y: val.y - info.center.y - $(node).height() / 2
      };
    };
    base.gcsToDisplay = function (val) {
      return {
        x: val.x + info.center.x + $(node).width() / 2,
        y: val.y + info.center.y + $(node).height() / 2
      };
    };
    map.baseLayer = function () { return base; };
    map.zoom = function (arg) {
      if (arg === undefined) {
        return 2;
      }
      info.zoom += 1;
      info.zoomArgs = arg;
    };
    map.zoom.nCalls = 0;
    map.rotation = function (arg) {
      if (arg === undefined) {
        return 0.1;
      }
      info.rotation += 1;
      info.rotationArgs = arg;
    };
    map.rotation.nCalls = 0;
    map.pan = function (arg) {
      info.pan += 1;
      info.panArgs = arg;
      info.center.x += info.panArgs.x || 0;
      info.center.y += info.panArgs.y || 0;
    };
    map.center = function () {
      return {x: info.center.x, y: info.center.y};
    };
    map.size = function () {
      return {width: 100, height: 100};
    };
    map.transition = function (arg) {
      if (arg === undefined) {
        return map.inTransition;
      }
      map.inTransition = arg;
    };
    map.transitionCancel = function () {
      if (map.inTransition) {
        map.inTransition = null;
        info.cancelCount = (info.cancelCount || 0) + 1;
        return true;
      }
      return false;
    };
    map.maxBounds = function () {
      return {left: -200, top: 200, right: 200, bottom: -200};
    };
    map.displayToGcs = base.displayToGcs;
    map.gcsToDisplay = base.gcsToDisplay;
    map.info = info;
    return map;
  }

  beforeEach(function () {
    // create a new div
    $('body').append('<div id="mapNode1" class="mapNode testNode"></div>');
    $('body').append('<div id="mapNode2" class="mapNode testNode"></div>');
  });

  afterEach(function () {
    // delete the div
    $('.testNode').remove();
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
      momentum: {enabled: false},
      panMoveButton: 'left',
      panWheelEnabled: false,
      zoomMoveButton: null,
      zoomWheelEnabled: false,
      rotateMoveButton: null,
      rotateWheelEnabled: false,
      throttle: false
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
      momentum: {enabled: false},
      zoomAnimation: {enabled: false},
      panMoveButton: null,
      panWheelEnabled: false,
      zoomMoveButton: null,
      zoomWheelEnabled: true,
      rotateMoveButton: null,
      rotateWheelEnabled: false,
      throttle: false
    });

    // initialize the mouse position
    interactor.simulateEvent(
      'mousemove',
      {
        map: {x: 20, y: 20}
      }
    );
    // mark that we are in a transition and make sure we called
    // transitionCancel
    map.inTransition = true;

    // trigger a zoom
    interactor.simulateEvent(
      'wheel',
      {
        wheelDelta: {x: 20, y: -10},
        wheelMode: 0
      }
    );

    // check the zoom event was called
    expect(map.info.zoom).toBe(1);
    expect(map.info.zoomArgs).toBe(2 + 10 / zoomFactor);
    expect(map.info.cancelCount).toBe(1);
  });

  it('Test zoom right click event propagation', function () {
    var map = mockedMap('#mapNode1'), z;

    var interactor = geo.mapInteractor({
      map: map,
      zoomAnimation: {enabled: false},
      panMoveButton: null,
      panWheelEnabled: false,
      zoomMoveButton: 'right',
      zoomWheelEnabled: false,
      rotateMoveButton: null,
      rotateWheelEnabled: false,
      throttle: false
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
    expect(map.info.zoomArgs).toBe(2 + 10 / zoomFactor);

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
    expect(map.info.zoomArgs).toBe(z - 15 / zoomFactor);
  });

  it('Test rotation wheel event propagation', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor({
      map: map,
      momentum: {enabled: false},
      panMoveButton: null,
      panWheelEnabled: false,
      zoomMoveButton: null,
      zoomWheelEnabled: false,
      rotateMoveButton: null,
      rotateWheelEnabled: true,
      rotateWheelModifiers: {ctrl: false},
      rotateWheelScale: 1,
      throttle: false
    });

    // initialize the mouse position
    interactor.simulateEvent(
      'mousemove',
      {
        map: {x: 20, y: 20}
      }
    );

    // trigger a rotation
    interactor.simulateEvent(
      'wheel',
      {
        wheelDelta: {x: 20, y: 10},
        wheelMode: 0
      }
    );

    // check the rotation event was called
    expect(map.info.rotation).toBe(1);
    expect(map.info.rotationArgs).toBe(0.1 + 10 / rotationFactor);
  });

  it('Test rotation left click event propagation', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor({
      map: map,
      panMoveButton: null,
      panWheelEnabled: false,
      zoomMoveButton: null,
      zoomWheelEnabled: false,
      rotateMoveButton: 'left',
      rotateMoveModifiers: {'ctrl': false},
      rotateWheelEnabled: false,
      throttle: false
    });

    // initialize the rotation
    interactor.simulateEvent(
      'mousedown',
      {
        map: {x: 20, y: 20},
        button: 'left'
      }
    );

    // create a rotation event
    interactor.simulateEvent(
      'mousemove',
      {
        map: {x: 20, y: 10},
        button: 'left'
      }
    );

    // check the rotation event was called
    expect(map.info.rotation).toBe(1);
    expect(map.info.rotationArgs).toBeCloseTo(
        0.1 - Math.atan2(20 - 50, 20 - 50) + Math.atan2(10 - 50, 20 - 50));

    // create a rotation event
    interactor.simulateEvent(
      'mousemove',
      {
        map: {x: 30, y: 25},
        button: 'left'
      }
    );

    // check the rotation event was called
    expect(map.info.rotation).toBe(2);
    expect(map.info.rotationArgs).toBeCloseTo(
        0.1 - Math.atan2(20 - 50, 20 - 50) + Math.atan2(25 - 50, 30 - 50));
  });

  describe('pause state', function () {
    it('defaults', function () {
      expect(geo.mapInteractor().pause()).toBe(false);
    });
    it('getter/setter', function () {
      var interactor = geo.mapInteractor();
      expect(interactor.pause(true)).toBe(interactor);
      expect(interactor.pause()).toBe(true);
      expect(interactor.pause(true)).toBe(interactor);
      expect(interactor.pause()).toBe(true);
      expect(interactor.pause(false)).toBe(interactor);
      expect(interactor.pause()).toBe(false);
      expect(interactor.pause(false)).toBe(interactor);
      expect(interactor.pause()).toBe(false);
      expect(interactor.pause(true)).toBe(interactor);
      expect(interactor.pause()).toBe(true);
    });
    it('ignores mouse down', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({map: map, throttle: false});

      interactor.pause(true);
      interactor.simulateEvent(
        'mousedown',
        {
          map: {x: 20, y: 20},
          button: 'left'
        }
      );
      interactor.pause(false);
      interactor.simulateEvent(
        'mousemove',
        {
          map: {x: 25, y: 25},
          button: 'left'
        }
      );
      interactor.simulateEvent(
        'mouseup',
        {
          map: {x: 25, y: 25},
          button: 'left'
        }
      );
      expect(map.info.pan).toBe(0);
    });
    it('ignores mouse move', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({map: map, throttle: false});

      interactor.simulateEvent(
        'mousedown',
        {
          map: {x: 20, y: 20},
          button: 'left'
        }
      );
      interactor.pause(true);
      interactor.simulateEvent(
        'mousemove',
        {
          map: {x: 25, y: 25},
          button: 'left'
        }
      );
      interactor.pause(false);
      interactor.simulateEvent(
        'mouseup',
        {
          map: {x: 20, y: 20},
          button: 'left'
        }
      );
      expect(map.info.pan).toBe(0);
    });
    it('ignores mouse up', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({map: map, throttle: false});

      interactor.simulateEvent(
        'mousedown',
        {
          map: {x: 20, y: 20},
          button: 'left'
        }
      );
      interactor.simulateEvent(
        'mousemove',
        {
          map: {x: 25, y: 25},
          button: 'left'
        }
      );
      interactor.pause(true);
      interactor.simulateEvent(
        'mouseup',
        {
          map: {x: 20, y: 20},
          button: 'left'
        }
      );
      interactor.pause(false);
      interactor.simulateEvent(
        'mousemove',
        {
          map: {x: 35, y: 35},
          button: 'left'
        }
      );
      expect(map.info.pan).toBe(2);
      expect(map.info.panArgs).toEqual({x: 10, y: 10});
    });
    it('ignores mouse wheel', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({map: map, throttle: false});

      interactor.pause(true);
      interactor.simulateEvent(
        'wheel',
        {
          map: {x: 20, y: 20},
          wheelDelta: {x: 20, y: -10},
          wheelMode: 0
        }
      );
      expect(map.info.zoom).toBe(0);
      expect(map.info.rotation).toBe(0);
    });
  });

  describe('click events', function () {
    it('not triggered when disabled', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: false
            },
            throttle: false
          }), triggered = false;

      map.geoOn(geo.event.mouseclick, function () {
        triggered = true;
      });
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      interactor.simulateEvent('mouseup', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      expect(triggered).toBe(false);
    });
    it('triggered by fast click', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true
            },
            throttle: false
          }), triggered = 0;

      map.geoOn(geo.event.mouseclick, function () {
        triggered += 1;
      });
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      interactor.simulateEvent('mouseup', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      expect(triggered).toBe(1);
    });
    it('triggered by fast async click', function (done) {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true,
              cancelOnMove: false,
              duration: 1000
            },
            throttle: false
          }), triggered = 0;

      map.geoOn(geo.event.mouseclick, function () {
        triggered += 1;
      });
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      window.setTimeout(function () {
        interactor.simulateEvent('mouseup', {
          map: {x: 20, y: 20},
          button: 'left'
        });
        expect(triggered).toBe(1);
        done();
      }, 50);
    });
    it('not triggered by slow click', function (done) {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true,
              cancelOnMove: false,
              duration: 10
            },
            throttle: false
          }), triggered = 0;

      map.geoOn(geo.event.mouseclick, function () {
        triggered += 1;
      });
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      window.setTimeout(function () {
        interactor.simulateEvent('mouseup', {
          map: {x: 20, y: 20},
          button: 'left'
        });
        expect(triggered).toBe(0);
        done();
      }, 50);
    });
    it('triggered by move then click', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true,
              cancelOnMove: false,
              duration: 500
            },
            throttle: false
          }), triggered = 0;

      map.geoOn(geo.event.mouseclick, function () {
        triggered += 1;
      });
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      interactor.simulateEvent('mousemove', {
        map: {x: 30, y: 30},
        button: 'left'
      });
      interactor.simulateEvent('mouseup', {
        map: {x: 30, y: 30},
        button: 'left'
      });
      expect(triggered).toBe(1);
    });
    it('not triggered by move then click', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true,
              cancelOnMove: true,
              duration: 500
            },
            throttle: false
          }), triggered = 0;

      map.geoOn(geo.event.mouseclick, function () {
        triggered += 1;
      });
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      interactor.simulateEvent('mousemove', {
        map: {x: 30, y: 30},
        button: 'left'
      });
      interactor.simulateEvent('mouseup', {
        map: {x: 30, y: 30},
        button: 'left'
      });
      expect(triggered).toBe(0);
    });
    it('not triggered by disabled button', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true,
              cancelOnMove: true,
              duration: 500,
              buttons: {left: false}
            },
            throttle: false
          }), triggered = 0;

      map.geoOn(geo.event.mouseclick, function () {
        triggered += 1;
      });
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      interactor.simulateEvent('mouseup', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      expect(triggered).toBe(0);
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'right'
      });
      interactor.simulateEvent('mouseup', {
        map: {x: 20, y: 20},
        button: 'right'
      });
      expect(triggered).toBe(1);
    });
    it('does not trigger a pan', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true,
              cancelOnMove: false
            },
            throttle: false
          });
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      interactor.simulateEvent('mousemove', {
        map: {x: 30, y: 30},
        button: 'left'
      });
      interactor.simulateEvent('mouseup', {
        map: {x: 30, y: 30},
        button: 'left'
      });
      expect(map.info.pan).toBe(0);
    });
    it('detaches document level handlers', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true,
              cancelOnMove: false
            },
            throttle: false
          }), ncalls = 0;
      interactor.simulateEvent('mousedown', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      interactor.simulateEvent('mousemove', {
        map: {x: 30, y: 30},
        button: 'left'
      });
      $(document).on('testevent.geojs', function () {
        ncalls += 1;
      });
      interactor.simulateEvent('mouseup', {
        map: {x: 30, y: 30},
        button: 'left'
      });
      $(document).trigger('testevent');
      expect(ncalls).toBe(0);
    });
  });
  describe('throttled map interactions', function () {
    it('pan', function (done) {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            throttle: 100,
            click: {
              enabled: false
            },
            momentum: {
              enabled: false
            }
          });

      interactor.simulateEvent(
        'mousedown',
        {
          map: {x: 20, y: 20},
          button: 'left'
        }
      );
      interactor.simulateEvent(
        'mousemove',
        {
          map: {x: 25, y: 25},
          button: 'left'
        }
      );
      interactor.simulateEvent(
        'mousemove',
        {
          map: {x: 20, y: 30},
          button: 'left'
        }
      );

      window.setTimeout(function () {
        interactor.simulateEvent(
          'mousemove',
          {
            map: {x: 100, y: 100},
            button: 'left'
          }
        );
        interactor.simulateEvent(
          'mousemove',
          {
            map: {x: 25, y: 25},
            button: 'left'
          }
        );

        window.setTimeout(function () {
          expect(map.info.pan).toBe(2);
          expect(map.info.panArgs).toEqual({x: 0, y: 0});

          interactor.simulateEvent(
            'mouseup',
            {
              map: {x: 25, y: 25},
              button: 'left'
            }
          );

          done();
        }, 100);
      }, 50);

      // the first event is syncronous all others will be async
      expect(map.info.pan).toBe(1);
      expect(map.info.panArgs).toEqual({x: 5, y: 5});
    });
    it('zoom', function (done) {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            zoomAnimation: {enabled: false},
            throttle: 100,
            momentum: {
              enabled: false
            }
          });

      interactor.simulateEvent(
        'wheel',
        {
          wheelDelta: {x: 20, y: -10},
          wheelMode: 0
        }
      );
      interactor.simulateEvent(
        'wheel',
        {
          wheelDelta: {x: 20, y: -10},
          wheelMode: 0
        }
      );

      window.setTimeout(function () {
        interactor.simulateEvent(
          'wheel',
          {
            wheelDelta: {x: 20, y: -10},
            wheelMode: 0
          }
        );
        interactor.simulateEvent(
          'wheel',
          {
            wheelDelta: {x: 20, y: -10},
            wheelMode: 0
          }
        );

        window.setTimeout(function () {
          expect(map.info.zoom).toBe(2);
          expect(map.info.zoomArgs).toBe(2 + 30 / zoomFactor);

          done();
        }, 100);
      }, 50);

      // the first event is syncronous all others will be async
      expect(map.info.zoom).toBe(1);
      expect(map.info.zoomArgs).toBe(2 + 10 / zoomFactor);
    });
  });

  describe('Public utility methods', function () {
    it('options', function () {
      var interactor = geo.mapInteractor();
      expect(interactor.options().panMoveButton).toBe('left');
      interactor.options({panMoveButton: 'middle'});
      expect(interactor.options().panMoveButton).toBe('middle');
    });
  });

  it('Test momentum', function () {
    var map = mockedMap('#mapNode1'), start;

    var interactor = geo.mapInteractor({
      map: map,
      momentum: {enabled: true},
      panMoveButton: 'left',
      panWheelEnabled: false,
      throttle: false
    });
    mockAnimationFrame();
    mockDate();
    // initiate a pan and release
    interactor.simulateEvent(
      'mousedown', {map: {x: 0, y: 0}, button: 'left'});
    interactor.simulateEvent(
      'mousemove', {map: {x: 10, y: 0}, button: 'left'});
    // check the pan event was called
    expect(map.info.pan).toBe(1);
    expect(map.info.panArgs.x).toBe(10);
    expect(map.info.panArgs.y).toBe(0);
    interactor.simulateEvent(
      'mouseup', {map: {x: 10, y: 0}, button: 'left'});
    start = new Date().getTime();
    stepAnimationFrame(start);
    expect(map.info.pan).toBe(2);
    expect(map.info.panArgs.x).toBeGreaterThan(0.25);
    expect(map.info.panArgs.y).toBe(0);
    stepAnimationFrame(start + 0.25);
    expect(map.info.pan).toBe(3);
    expect(map.info.panArgs.x).toBeGreaterThan(0);
    expect(map.info.panArgs.y).toBe(0);
    // now pan, then release with a long delay and make sure no momentum occurs
    interactor.simulateEvent(
      'mousedown', {map: {x: 0, y: 0}, button: 'left'});
    var lastPan = $.extend(true, {}, map.info);
    interactor.simulateEvent(
      'mousemove', {map: {x: 10, y: 0}, button: 'left'});
    expect(map.info.pan).toBe(lastPan.pan + 1);
    expect(map.info.panArgs.x).toBe(10);
    advanceDate(1000);  // wait to release
    interactor.simulateEvent(
      'mouseup', {map: {x: 10, y: 0}, button: 'left'});
    stepAnimationFrame(start);
    stepAnimationFrame(start + 0.25);
    expect(map.info.pan).toBe(lastPan.pan + 1);
    expect(map.info.panArgs.x).toBe(10);
    unmockDate();
    unmockAnimationFrame();
  });

  it('Test springback', function () {
    $('#mapNode1').css({width: '400px', height: '400px'});
    var map = mockedMap('#mapNode1'), start;

    var interactor = geo.mapInteractor({
      map: map,
      momentum: {enabled: true},  // you must have momentum to have springback
      spring: {enabled: true, springConstant: 0.00005},
      panMoveButton: 'left',
      panWheelEnabled: false,
      throttle: false
    });
    mockAnimationFrame();
    mockDate();
    // pan past the max bounds
    interactor.simulateEvent(
      'mousedown', {map: {x: 0, y: 0}, button: 'left'});
    interactor.simulateEvent(
      'mousemove', {map: {x: 199, y: 0}, button: 'left'});
    expect(map.info.pan).toBe(1);
    expect(map.info.panArgs.x).toBe(199);
    expect(map.info.panArgs.y).toBe(0);
    interactor.simulateEvent(
      'mousemove', {map: {x: 201, y: 0}, button: 'left'});
    interactor.simulateEvent(
      'mousemove', {map: {x: 202, y: 0}, button: 'left'});
    expect(map.info.pan).toBe(3);
    expect(map.info.panArgs.x).toBeCloseTo(1);
    interactor.simulateEvent(
      'mouseup', {map: {x: 200.1, y: 0}, button: 'left'});
    start = new Date().getTime();
    stepAnimationFrame(start);
    expect(map.info.pan).toBe(4);
    expect(map.info.panArgs.x).toBeLessThan(0);
    stepAnimationFrame(start + 0.25);
    expect(map.info.pan).toBe(5);
    expect(map.info.panArgs.x).toBeLessThan(0);
    unmockDate();
    unmockAnimationFrame();
  });
});
