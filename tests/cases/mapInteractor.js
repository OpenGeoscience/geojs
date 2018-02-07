describe('mapInteractor', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
  var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
  var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;
  var mockDate = require('../test-utils').mockDate;
  var unmockDate = require('../test-utils').unmockDate;
  var advanceDate = require('../test-utils').advanceDate;

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

  var panFactor = 120;
  var zoomFactor = 120;
  var rotationFactor = 120;

  function mockedMap(node) {

    var map = geo.object();
    var voidfunc = function () {};
    var info = {
      pan: 0,
      zoom: 0,
      rotation: 0,
      centerCalls: 0,
      rotationArgs: {},
      panArgs: {},
      zoomArgs: {},
      center: $.extend({}, {x: 0, y: 0})
    };

    map.node = function () { return $(node); };
    map.displayToGcs = function (val) {
      return {
        x: val.x - info.center.x - $(node).width() / 2,
        y: val.y - info.center.y - $(node).height() / 2
      };
    };
    map.gcsToDisplay = function (val) {
      return {
        x: val.x + info.center.x + $(node).width() / 2,
        y: val.y + info.center.y + $(node).height() / 2
      };
    };
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
    map.center = function (arg) {
      if (arg === undefined) {
        return {x: info.center.x, y: info.center.y};
      }
      info.center.x = arg.x;
      info.center.y = arg.y;
      info.centerCalls += 1;
      info.centerArgs = arg;
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
    map.info = info;

    map.createLayer = function () {
      var layer = geo.object();
      layer.createFeature = function () {
        var feature = geo.object();
        feature.style = voidfunc;
        feature.data = voidfunc;
        feature.draw = voidfunc;
        return feature;
      };
      layer.clear = voidfunc;
      return layer;
    };
    map.deleteLayer = voidfunc;
    map.discreteZoom = function (arg) {
      if (arg === undefined) {
        return map.info.discreteZoom;
      }
      map.info.discreteZoom = arg;
    };
    map.gcs = function (arg) {
      return 'EPSG:3857';
    };
    map.scheduleAnimationFrame = function (callback) {
      return window['requestAnimationFrame'](callback);
    };
    return map;
  }

  /* Create an instance of the actual map */
  function create_map(opts) {
    opts = $.extend({width: 500, height: 500, autoResize: false}, opts);
    opts.node = '#mapNode1';
    return geo.map(opts);
  }

  beforeEach(function () {
    // create a new div
    $('<div id="mapNode1" class="mapNode testNode"></div>')
        .css({width: '800px', height: '600px'}).appendTo('body');
    $('<div id="mapNode2" class="mapNode testNode"></div>')
        .css({width: '800px', height: '600px'}).appendTo('body');
  });

  afterEach(function () {
    // delete the div and clean up lingering event handlers
    $('.testNode').remove();
    $(document).off('.geojs');
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

  it('Test initialization with array values.', function () {
    var map = mockedMap('#mapNode1');
    var interactor = geo.mapInteractor({
      map: map,
      actions: [{action: geo.geo_action.pan, input: 'left'}],
      momentum: {actions: [geo.geo_action.pan]}
    });
    expect(interactor.options().actions.length).toBe(1);
    expect(interactor.options().momentum.actions.length).toBe(1);
  });

  it('Test pan wheel event propagation', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor({
      map: map,
      momentum: {enabled: false},
      zoomAnimation: {enabled: false},
      actions: [{
        action: geo.geo_action.pan,
        input: 'wheel'
      }],
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
    // trigger a pan
    interactor.simulateEvent(
      'wheel',
      {
        wheelDelta: {x: 20, y: -10},
        wheelMode: 0
      }
    );

    // check the zoom event was called
    expect(map.info.pan).toBe(1);
    expect(map.info.panArgs.x).toBeCloseTo(20 / panFactor);
    expect(map.info.panArgs.y).toBeCloseTo(-10 / panFactor);
    expect(map.info.cancelCount).toBe(1);
  });

  it('Test pan event propagation', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor({
      map: map,
      momentum: {enabled: false},
      actions: [{
        action: geo.geo_action.pan,
        input: 'left'
      }],
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
      actions: [{
        action: geo.geo_action.zoom,
        input: 'wheel'
      }],
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
      actions: [{
        action: geo.geo_action.zoom,
        input: 'right'
      }],
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
      actions: [{
        action: geo.geo_action.rotate,
        input: 'wheel'
      }],
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
      actions: [{
        action: geo.geo_action.rotate,
        input: 'left'
      }],
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

  it('Test zoom selection event propagation', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor({
      map: map,
      actions: [{
        action: geo.geo_action.zoomselect,
        input: 'left',
        selectionRectangle: geo.event.zoomselect
      }, {
        action: geo.geo_action.unzoomselect,
        input: 'middle',
        selectionRectangle: geo.event.unzoomselect
      }],
      throttle: false
    });

    // initialize the selection
    interactor.simulateEvent(
      'mousedown', {map: {x: 20, y: 20}, button: 'left'}
    );
    interactor.simulateEvent(
      'mousemove', {map: {x: 30, y: 20}, button: 'left'}
    );
    interactor.simulateEvent(
      'mouseup.geojs', {map: {x: 40, y: 50}, button: 'left'}
    );

    // check the selection event was called
    expect(map.info.zoom).toBe(1);
    expect(map.info.zoomArgs).toBeCloseTo(3.75, 1);
    expect(map.info.centerCalls).toBe(1);
    expect(map.info.centerArgs.x).toBeCloseTo(-370);
    expect(map.info.centerArgs.y).toBeCloseTo(-265);

    map.discreteZoom(true);

    // start with an unzoom, but switch to a zoom
    interactor.simulateEvent(
      'mousedown', {map: {x: 20, y: 20}, button: 'middle'}
    );
    interactor.simulateEvent(
      'mousedown', {map: {x: 20, y: 20}, button: 'left'}
    );
    interactor.simulateEvent(
      'mousemove.geojs', {map: {x: 0, y: -30}, button: 'left'}
    );
    interactor.simulateEvent(
      'mouseup.geojs', {map: {x: 0, y: -30}, button: 'left'}
    );
    expect(map.info.zoom).toBe(2);
    expect(map.info.zoomArgs).toBe(3);
    expect(map.info.centerCalls).toBe(2);
    expect(map.info.centerArgs.x).toBeCloseTo(-20);
    expect(map.info.centerArgs.y).toBeCloseTo(-40);

    /* If there is no movement, nothing should happen */
    interactor.simulateEvent(
      'mousedown', {map: {x: 20, y: 20}, button: 'left'}
    );
    interactor.simulateEvent(
      'mouseup.geojs', {map: {x: 20, y: 20}, button: 'left'}
    );
    expect(map.info.zoom).toBe(2);
  });

  it('Test unzoom selection event propagation', function () {
    var map = mockedMap('#mapNode1');

    var interactor = geo.mapInteractor({
      map: map,
      actions: [{
        action: geo.geo_action.zoomselect,
        input: 'left',
        selectionRectangle: geo.event.zoomselect
      }, {
        action: geo.geo_action.unzoomselect,
        input: 'middle',
        selectionRectangle: geo.event.unzoomselect
      }],
      throttle: false
    });

    // initialize the selection
    interactor.simulateEvent(
      'mousedown', {map: {x: 20, y: 20}, button: 'middle'}
    );
    interactor.simulateEvent(
      'mousemove', {map: {x: 30, y: 20}, button: 'middle'}
    );
    interactor.simulateEvent(
      'mouseup.geojs', {map: {x: 40, y: 50}, button: 'middle'}
    );

    // check the selection event was called
    expect(map.info.zoom).toBe(1);
    expect(map.info.zoomArgs).toBeCloseTo(0.25, 1);
    expect(map.info.centerCalls).toBe(0);
    expect(map.info.pan).toBe(1);
    expect(map.info.panArgs.x).toBeCloseTo(-370);
    expect(map.info.panArgs.y).toBeCloseTo(-265);
  });

  it('Test selection event propagation', function () {
    var map = mockedMap('#mapNode1'),
        triggered = 0,
        clickTriggered = 0;

    var interactor = geo.mapInteractor({
      map: map,
      actions: [{
        action: geo.geo_action.select,
        input: 'left',
        selectionRectangle: geo.event.select
      }],
      throttle: false
    });
    map.geoOn(geo.event.select, function () {
      triggered += 1;
    });
    map.geoOn(geo.event.mouseclick, function () {
      clickTriggered += 1;
    });

    // initialize the selection
    interactor.simulateEvent(
      'mousedown', {map: {x: 20, y: 20}, button: 'left'}
    );
    interactor.simulateEvent(
      'mousemove.geojs', {map: {x: 30, y: 20}, button: 'left'}
    );
    interactor.simulateEvent(
      'mouseup.geojs', {map: {x: 40, y: 50}, button: 'left'}
    );

    // check the selection event was called
    expect(map.info.zoom).toBe(0);
    expect(map.info.centerCalls).toBe(0);
    expect(map.info.pan).toBe(0);
    expect(triggered).toBe(1);

    // click should still work
    interactor.simulateEvent(
      'mousedown', {map: {x: 20, y: 20}, button: 'left'}
    );
    interactor.simulateEvent(
      'mousemove.geojs', {map: {x: 20, y: 20}, button: 'left'}
    );
    interactor.simulateEvent(
      'mouseup.geojs', {map: {x: 20, y: 20}, button: 'left'}
    );
    expect(triggered).toBe(1);
    expect(clickTriggered).toBe(1);
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
              duration: 0
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
              duration: 0
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
    it('triggered by zero distance move then click', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true,
              cancelOnMove: true,
              duration: 0
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
        map: {x: 20, y: 20},
        button: 'left'
      });
      interactor.simulateEvent('mouseup', {
        map: {x: 20, y: 20},
        button: 'left'
      });
      expect(triggered).toBe(1);
    });
    it('not triggered by disabled button', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            click: {
              enabled: true,
              cancelOnMove: true,
              duration: 0,
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
    var clock;

    // Instrument setTimeout and friends using sinon
    beforeEach(function () {
      clock = sinon.useFakeTimers();
    });
    afterEach(function () {
      clock.restore();
    });

    it('pan', function () {
      var map = mockedMap('#mapNode1'),
          interactor = geo.mapInteractor({
            map: map,
            throttle: 100,
            click: {
              enabled: false
            },
            momentum: {
              enabled: false
            },
            zoomAnimation: {
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
          map: {x: 20, y: 20},
          button: 'left'
        }
      );

      clock.tick(100);
      expect(map.info.pan).toBe(1);
      expect(map.info.panArgs).toEqual({x: 0, y: 0});

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

      clock.tick(50);
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

      clock.tick(100);
      expect(map.info.pan).toBe(2);
      expect(map.info.panArgs).toEqual({x: 5, y: 5});

      interactor.simulateEvent(
        'mouseup',
        {
          map: {x: 25, y: 25},
          button: 'left'
        }
      );
    });
    it('zoom', function () {
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

      clock.tick(100);
      expect(map.info.zoom).toBe(1);
      expect(map.info.zoomArgs).toBe(2 + 10 / zoomFactor);

      interactor.simulateEvent(
        'wheel',
        {
          wheelDelta: {x: 20, y: -10},
          wheelMode: 0
        }
      );

      clock.tick(50);
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

      clock.tick(100);
      expect(map.info.zoom).toBe(2);
      expect(map.info.zoomArgs).toBe(2 + 30 / zoomFactor);
    });
  });

  describe('Public utility methods', function () {
    it('options', function () {
      var interactor = geo.mapInteractor();
      expect(interactor.options().zoomScale).toBe(1);
      interactor.options({zoomScale: 1.5});
      expect(interactor.options().zoomScale).toBe(1.5);
    });
    it('addAction, hasAction, and removeAction', function () {
      var actions, lenactions;
      var testActions = [{
        action: 'action1',
        name: 'nameA',
        input: 'right',
        modifiers: {meta: true}
      }, {
        action: 'action2',
        name: 'nameA',
        input: 'left',
        modifiers: {meta: true}
      }, {
        action: 'action3',
        name: 'nameB',
        input: 'right',
        modifiers: {meta: true}
      }];
      var map = mockedMap('#mapNode1');
      var interactor = geo.mapInteractor({map: map});

      lenactions = interactor.options().actions.length;
      interactor.addAction({});
      expect(interactor.options().actions.length).toBe(lenactions);

      expect(interactor.hasAction(testActions[0])).toBe(null);
      expect(interactor.hasAction('action1')).toBe(null);
      expect(interactor.hasAction('action1', 'nameA')).toBe(null);
      expect(interactor.hasAction(undefined, 'nameA')).toBe(null);
      interactor.addAction(testActions[0], true);
      actions = interactor.options().actions;
      expect(actions.length).toBe(lenactions + 1);
      expect(actions[actions.length - 1]).toBe(testActions[0]);
      expect(interactor.hasAction(testActions[0])).toBe(testActions[0]);
      expect(interactor.hasAction('action1')).toBe(testActions[0]);
      expect(interactor.hasAction('action1', 'nameA')).toBe(testActions[0]);
      expect(interactor.hasAction(undefined, 'nameA')).toBe(testActions[0]);

      expect(interactor.hasAction(testActions[1])).toBe(null);
      expect(interactor.hasAction('action2')).toBe(null);
      expect(interactor.hasAction('action2', 'nameA')).toBe(null);
      expect(interactor.hasAction(undefined, 'nameA')).toBe(testActions[0]);
      interactor.addAction(testActions[1]);
      actions = interactor.options().actions;
      expect(actions[0]).toBe(testActions[1]);
      expect(interactor.hasAction(testActions[1])).toBe(testActions[1]);
      expect(interactor.hasAction('action2')).toBe(testActions[1]);
      expect(interactor.hasAction('action2', 'nameA')).toBe(testActions[1]);
      expect(interactor.hasAction(undefined, 'nameA')).toBe(testActions[1]);

      interactor.addAction(testActions[2]);
      expect(interactor.hasAction(testActions[2])).toBe(testActions[2]);
      expect(interactor.removeAction('action3')).toBe(1);
      expect(interactor.hasAction(testActions[2])).toBe(null);
      expect(interactor.removeAction('action3')).toBe(0);

      expect(interactor.removeAction(undefined, 'nameA')).toBe(2);
      expect(interactor.hasAction('action1')).toBe(null);
      expect(interactor.hasAction('action2')).toBe(null);
      expect(interactor.hasAction(undefined, 'nameA')).toBe(null);
      expect(interactor.removeAction(undefined, 'nameA')).toBe(0);
    });
  });

  describe('General public utility methods', function () {
    it('actionMatch', function () {
      var actions = [{
        action: 'a',
        input: 'left',
        modifiers: 'ctrl'
      }, {
        action: 'b',  // unreachable, because a will always trigger
        input: 'left',
        modifiers: {ctrl: true, shift: true}
      }, {
        action: 'c',
        input: 'right',
        modifiers: {ctrl: true, shift: true}
      }, {
        action: 'd',
        input: 'right',
        modifiers: {ctrl: true, shift: false, alt: true}
      }, {
        action: 'e',
        input: 'right',
        modifiers: 'ctrl'
      }, {
        action: 'f',
        input: {left: true, right: true}
      }, {
        action: 'g',
        input: 'left'
      }];
      geo.util.adjustActions(actions);
      expect(geo.util.actionMatch({wheel: true}, {}, actions)).toBe(undefined);
      expect(geo.util.actionMatch({left: true}, {}, actions).action).toBe('g');
      expect(geo.util.actionMatch({left: true}, {ctrl: true}, actions).action).toBe('a');
      expect(geo.util.actionMatch({left: true}, {shift: true}, actions).action).toBe('g');
      expect(geo.util.actionMatch({left: true}, {ctrl: true, shift: true}, actions).action).toBe('a');
      expect(geo.util.actionMatch({right: true}, {}, actions)).toBe(undefined);
      expect(geo.util.actionMatch({right: true}, {ctrl: true}, actions).action).toBe('e');
      expect(geo.util.actionMatch({right: true}, {shift: true}, actions)).toBe(undefined);
      expect(geo.util.actionMatch({right: true}, {ctrl: true, shift: true}, actions).action).toBe('c');
      expect(geo.util.actionMatch({right: true}, {ctrl: true, shift: true, alt: true}, actions).action).toBe('c');
      expect(geo.util.actionMatch({right: true}, {ctrl: true, shift: false, alt: true}, actions).action).toBe('d');
      expect(geo.util.actionMatch({right: true}, {ctrl: true, shift: false}, actions).action).toBe('e');
      expect(geo.util.actionMatch({left: true, right: true}, {ctrl: true}, actions).action).toBe('a');
      expect(geo.util.actionMatch({left: true, right: true}, {}, actions).action).toBe('f');
    });
  });

  it('Test momentum', function () {
    mockAnimationFrame();
    var map = mockedMap('#mapNode1'), start;

    var interactor = geo.mapInteractor({
      map: map,
      momentum: {enabled: true},
      actions: [{
        action: geo.geo_action.pan,
        input: 'left'
      }],
      throttle: false
    });
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
    mockAnimationFrame();
    $('#mapNode1').css({width: '400px', height: '400px'});
    var map = mockedMap('#mapNode1'), start;

    var interactor = geo.mapInteractor({
      map: map,
      momentum: {enabled: true},  // you must have momentum to have springback
      spring: {enabled: true, springConstant: 0.00005},
      actions: [{
        action: geo.geo_action.pan,
        input: 'left'
      }],
      throttle: false
    });
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

  describe('Zoom Animation', function () {
    var map, interactor;
    beforeEach(function () {
      mockAnimationFrame();

      /* we use the actual map as we want to check that the transitions behave
       * as expected, too. */
      map = create_map({discreteZoom: false, zoom: 2});
      interactor = geo.mapInteractor({
        map: map,
        momentum: {enabled: false},
        throttle: false
      });
      map.interactor(interactor);
    });
    afterEach(function () {
      map.exit();
      unmockAnimationFrame();
    });
    it('zoom once', function () {

      var lastZoom, start;
      interactor.simulateEvent(
        'wheel',
        {wheelDelta: {x: 0, y: -20}, wheelMode: 0}
      );
      start = new Date().getTime();
      stepAnimationFrame(start);
      expect(map.zoom()).toBe(2);
      stepAnimationFrame(start + 50);
      expect(map.zoom()).toBeGreaterThan(2);
      expect(map.zoom()).toBeLessThan(2 + 20 / zoomFactor);
      lastZoom = map.zoom();
      stepAnimationFrame(start + 100);
      expect(map.zoom()).toBeGreaterThan(lastZoom);
      expect(map.zoom()).toBeLessThan(2 + 20 / zoomFactor);
      stepAnimationFrame(start + 500);
      expect(map.zoom()).toBeCloseTo(2 + 20 / zoomFactor);
    });
    it('zoom multiple', function () {
      var lastZoom, start;
      map.zoom(2);
      interactor.simulateEvent(
        'wheel',
        {wheelDelta: {x: 0, y: -20}, wheelMode: 0}
      );
      start = new Date().getTime();
      stepAnimationFrame(start);
      expect(map.zoom()).toBe(2);
      stepAnimationFrame(start + 50);
      expect(map.zoom()).toBeGreaterThan(2);
      expect(map.zoom()).toBeLessThan(2 + 20 / zoomFactor);
      lastZoom = map.zoom();
      stepAnimationFrame(start + 100);
      expect(map.zoom()).toBeGreaterThan(lastZoom);
      expect(map.zoom()).toBeLessThan(2 + 20 / zoomFactor);
      lastZoom = map.zoom();
      interactor.simulateEvent(
        'wheel',
        {wheelDelta: {x: 0, y: -20}, wheelMode: 0}
      );
      stepAnimationFrame(start + 150);
      stepAnimationFrame(start + 200);
      expect(map.zoom()).toBeGreaterThan(lastZoom);
      expect(map.zoom()).toBeLessThan(2 + 40 / zoomFactor);
      stepAnimationFrame(start + 500);
      expect(map.zoom()).toBeLessThan(2 + 40 / zoomFactor);
      stepAnimationFrame(start + 650);
      expect(map.zoom()).toBeCloseTo(2 + 40 / zoomFactor);
    });
    it('discrete zoom', function () {
      var lastZoom, start;
      map.zoom(2);
      map.discreteZoom(true);
      interactor.simulateEvent(
        'wheel',
        {wheelDelta: {x: 0, y: -20}, wheelMode: 0}
      );
      start = new Date().getTime();
      stepAnimationFrame(start);
      expect(map.zoom()).toBe(2);
      stepAnimationFrame(start + 50);
      expect(map.zoom()).toBeGreaterThan(2);
      expect(map.zoom()).toBeLessThan(3);
      lastZoom = map.zoom();
      stepAnimationFrame(start + 100);
      expect(map.zoom()).toBeGreaterThan(lastZoom);
      expect(map.zoom()).toBeLessThan(3);
      lastZoom = map.zoom();
      /* This wheel event is essentially ignored as the resulting zoom won't
       * change. */
      interactor.simulateEvent(
        'wheel',
        {wheelDelta: {x: 0, y: -20}, wheelMode: 0}
      );
      stepAnimationFrame(start + 150);
      stepAnimationFrame(start + 200);
      expect(map.zoom()).toBeGreaterThan(lastZoom);
      expect(map.zoom()).toBeLessThan(3);
      stepAnimationFrame(start + 500);
      expect(map.zoom()).toBeLessThan(3);
      stepAnimationFrame(start + 650);
      expect(map.zoom()).toBe(3);
    });
    it('interrupted discrete zoom', function () {
      var lastZoom, start;
      map.zoom(2);
      map.discreteZoom(true);
      interactor.simulateEvent(
        'wheel',
        {wheelDelta: {x: 0, y: -20}, wheelMode: 0}
      );
      start = new Date().getTime();
      stepAnimationFrame(start);
      expect(map.zoom()).toBe(2);
      stepAnimationFrame(start + 50);
      expect(map.zoom()).toBeGreaterThan(2);
      expect(map.zoom()).toBeLessThan(3);
      lastZoom = map.zoom();
      stepAnimationFrame(start + 100);
      expect(map.zoom()).toBeGreaterThan(lastZoom);
      expect(map.zoom()).toBeLessThan(3);
      lastZoom = map.zoom();
      /* A click will finish the zoom immediately. */
      interactor.simulateEvent(
        'mousedown',
        {map: {x: 0, y: 0}, button: 'left'}
      );
      stepAnimationFrame(start + 150);
      expect(map.zoom()).toBe(3);
      interactor.simulateEvent(
        'mouseup',
        {map: {x: 0, y: 0}, button: 'left'}
      );
    });
  });
  describe('Momemtum and mouse move interaction', function () {
    var map, interactor;
    beforeEach(function () {
      /* we use the actual map as we need it to be a sceneobject */
      map = create_map({discreteZoom: false, zoom: 2});
      interactor = geo.mapInteractor({map: map});
      map.interactor(interactor);
    });
    afterEach(function () {
      map.exit();
    });
    it('Test mousemove after momementum', function () {
      var lastmap;

      function lastmove(evt) {
        lastmap = evt.map;
      }

      map.geoOn(geo.event.mousemove, lastmove);
      interactor.simulateEvent(
        'mousemove', {map: {x: 4, y: 5}});
      expect(lastmap).toEqual({x: 4, y: 5});
      interactor.simulateEvent(
        'mousedown', {map: {x: 10, y: 10}, button: 'left'});
      expect(lastmap).toEqual({x: 4, y: 5});
      interactor.simulateEvent(
        'mouseup.geojs', {map: {x: 10, y: 10}, button: 'left'});
      expect(lastmap).toEqual({x: 4, y: 5});
      interactor.simulateEvent(
        'mousemove', {map: {x: 17, y: 27}});
      expect(lastmap).toEqual({x: 17, y: 27});
      interactor.simulateEvent(
        'mousedown', {map: {x: 30, y: 30}, button: 'right'});
      expect(lastmap).toEqual({x: 17, y: 27});
      interactor.simulateEvent(
        'mouseup.geojs', {map: {x: 30, y: 30}, button: 'right'});
      expect(lastmap).toEqual({x: 17, y: 27});
      interactor.simulateEvent(
        'mousemove', {map: {x: 47, y: 57}});
      expect(lastmap).toEqual({x: 47, y: 57});
    });
  });

  it('Test keyboard interaction and event and propagation', function () {
    var map = mockedMap('#mapNode1'),
        interactor = geo.mapInteractor({map: map}),
        keyboardSettings,
        cancel = false,
        lastmove,
        triggered = 0;

    // check the zoom event was called
    interactor.simulateEvent('keyboard', {keys: 'shift+plus', shift: true});
    expect(map.info.zoom).toBe(1);
    expect(map.info.zoomArgs).toBe(3);
    expect(map.zoom()).toBe(2);

    // check the zoom event was called with a smaller factor
    interactor.simulateEvent('keyboard', {keys: 'plus'});
    expect(map.info.zoom).toBe(2);
    expect(map.info.zoomArgs).toBe(2.05);
    expect(map.zoom()).toBe(2);

    // check the zoom event is not called with the wrong meta keys
    interactor.simulateEvent('keyboard', {keys: 'plus', shift: false, ctrl: true});
    expect(map.info.zoom).toBe(2);

    // check that the keyaction is triggered
    map.geoOn(geo.event.keyaction, function (evt) {
      if (cancel) {
        evt.move.cancel = true;
      }
      lastmove = evt.move;
      triggered += 1;
    });
    interactor.simulateEvent('keyboard', {keys: 'plus'});
    expect(map.info.zoom).toBe(3);
    expect(triggered).toBe(1);
    // check that the action can be canceled
    cancel = true;
    interactor.simulateEvent('keyboard', {keys: 'plus'});
    expect(map.info.zoom).toBe(3);
    expect(triggered).toBe(2);
    cancel = false;
    // test a variety of keyboard events
    var keyTests = {
      '1': {zoom: 0},
      '2': {zoom: 3},
      'plus': {zoomDelta: 0.05},
      '-': {zoomDelta: -0.05},
      '0': {rotation: 0},
      '>': {rotationDelta: -1 * Math.PI / 180},
      '<': {rotationDelta: 1 * Math.PI / 180},
      'up': {panY: 1},
      'down': {panY: -1},
      'left': {panX: 1},
      'right': {panX: -1}
    };
    for (var key in keyTests) {
      if (keyTests.hasOwnProperty(key)) {
        triggered = 0;
        interactor.simulateEvent('keyboard', {keys: key});
        expect(triggered).toBe(1);
        for (var prop in keyTests[key]) {
          if (keyTests[key].hasOwnProperty(prop)) {
            expect(lastmove[prop]).toBe(keyTests[key][prop]);
          }
        }
      }
    }

    // test modifying the keyboard settings and the focus highlight class
    keyboardSettings = interactor.keyboard();
    expect(keyboardSettings.focusHighlight).not.toBe(undefined);
    keyboardSettings.focusHighlight = false;
    expect(interactor.keyboard(keyboardSettings)).toBe(interactor);
    expect(map.node().hasClass('highlight-focus')).toBe(false);
    keyboardSettings.focusHighlight = true;
    expect(interactor.keyboard(keyboardSettings)).toBe(interactor);
    expect(map.node().hasClass('highlight-focus')).toBe(true);

    // test creating a interactor with a different set of keyboard actions
    interactor = geo.mapInteractor({map: map, keyboard: {actions: {'zoom.0': ['1']}}});
    triggered = 0;
    interactor.simulateEvent('keyboard', {keys: '1'});
    expect(triggered).toBe(1);
    triggered = 0;
    interactor.simulateEvent('keyboard', {keys: '2'});
    expect(triggered).toBe(0);
  });

  it('Test touch interactions', function () {
    var map = mockedMap('#mapNode1'),
        interactor = geo.mapInteractor({map: map}),
        clickTriggered = 0;

    expect(interactor.hasTouchSupport()).toBe(true);

    // check the pan event was called
    interactor.simulateEvent(
      'panstart', {touch: true, center: {x: 20, y: 20}});
    interactor.simulateEvent(
      'panmove', {touch: true, center: {x: 30, y: 20}});
    interactor.simulateEvent(
      'panend', {touch: true, center: {x: 40, y: 20}});
    expect(map.info.pan).toBe(2);
    expect(map.info.panArgs.x).toBe(10);
    expect(map.info.panArgs.y).toBe(0);

    // A two-pointer event will end the action
    interactor.simulateEvent(
      'panstart', {touch: true, center: {x: 20, y: 20}});
    interactor.simulateEvent(
      'hammer.input', {touch: true, center: {x: 30, y: 20}, pointers: [1]});
    interactor.simulateEvent(
      'panmove', {touch: true, center: {x: 30, y: 20}});
    expect(map.info.pan).toBe(4);
    interactor.simulateEvent(
      'hammer.input', {touch: true, center: {x: 40, y: 20}, pointers: [1, 2]});
    interactor.simulateEvent(
      'panmove', {touch: true, center: {x: 50, y: 20}});
    interactor.simulateEvent(
      'panend', {touch: true, center: {x: 60, y: 20}});
    expect(map.info.pan).toBe(4);
    expect(map.info.panArgs.x).toBe(10);
    expect(map.info.panArgs.y).toBe(0);

    // check the two-fingered pan event was called
    interactor.simulateEvent(
      'rotatestart', {touch: true, center: {x: 20, y: 20}});
    // first movement exceeds the threshold, but doesn't register
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 31, y: 21}});
    // second movement will result in a pan
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 42, y: 22}});
    interactor.simulateEvent(
      'rotateend', {touch: true, center: {x: 53, y: 23}});
    expect(map.info.pan).toBe(5);
    expect(map.info.panArgs.x).toBe(11);
    expect(map.info.panArgs.y).toBe(1);

    // a spurious event will end the action
    interactor.simulateEvent(
      'rotatestart', {touch: true, center: {x: 20, y: 20}});
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 30, y: 20}});
    interactor.simulateEvent(
      'spurious', {touch: true, center: {x: 30, y: 20}});
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 40, y: 20}});
    interactor.simulateEvent(
      'rotateend', {touch: true, center: {x: 50, y: 20}});
    expect(map.info.pan).toBe(5);

    // a mouse move will end the action
    interactor.simulateEvent(
      'rotatestart', {touch: true, center: {x: 20, y: 20}});
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 30, y: 20}});
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 30, y: 20}, pointerType: 'mouse'});
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 40, y: 20}});
    interactor.simulateEvent(
      'rotateend', {touch: true, center: {x: 50, y: 20}});
    expect(map.info.pan).toBe(5);

    // a zero-threshold will result in a faster pan
    interactor.options({zoomrotateMinimumPan: 0});
    interactor.simulateEvent(
      'rotatestart', {touch: true, center: {x: 20, y: 20}});
    // first movement will result in a pan
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 32, y: 22}});
    expect(map.info.pan).toBe(6);
    expect(map.info.panArgs.x).toBe(12);
    expect(map.info.panArgs.y).toBe(2);
    // second movement will result in a pan
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 44, y: 23}});
    interactor.simulateEvent(
      'rotateend', {touch: true, center: {x: 53, y: 23}});
    expect(map.info.pan).toBe(7);
    expect(map.info.panArgs.x).toBe(12);
    expect(map.info.panArgs.y).toBe(1);

    // check the two-fingered rotate event was called
    interactor.simulateEvent(
      'rotatestart', {touch: true, center: {x: 20, y: 20}, rotation: 30});
    // first movement exceeds the threshold, but doesn't register
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 20, y: 20}, rotation: 35});
    // second movement will result in a rotation
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 20, y: 20}, rotation: 40});
    interactor.simulateEvent(
      'rotateend', {touch: true, center: {x: 20, y: 20}, rotation: 45});
    expect(map.info.rotation).toBe(1);
    expect(map.info.rotationArgs).toBe(0.1 + 5 * Math.PI / 180);

    // check the two-fingered scale event was called
    interactor.simulateEvent(
      'rotatestart', {touch: true, center: {x: 20, y: 20}, scale: 1});
    // first movement exceeds the threshold, but doesn't change the zoom
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 20, y: 20}, scale: 1.1});
    expect(map.info.zoom).toBe(1);
    expect(map.info.zoomArgs).toBe(2);
    // second movement will result in a zoom
    interactor.simulateEvent(
      'rotatemove', {touch: true, center: {x: 20, y: 20}, scale: 1.2});
    expect(map.info.zoom).toBe(2);
    expect(map.info.zoomArgs).toBe(2 + Math.log2(1.2) - Math.log2(1.1));
    interactor.simulateEvent(
      'rotateend', {touch: true, center: {x: 20, y: 20}, scale: 1.3});
    expect(map.info.zoom).toBe(2);

    // test tap
    map.geoOn(geo.event.mouseclick, function () {
      clickTriggered += 1;
    });
    interactor.simulateEvent(
      'singletap', {touch: true, center: {x: 20, y: 20}});
    expect(clickTriggered).toBe(1);
    // don't get a second click event from a non-tap.
    interactor.simulateEvent(
      'mousedown', {map: {x: 20, y: 20}, button: 'left'});
    interactor.simulateEvent(
      'mouseup', {map: {x: 20, y: 20}, button: 'left'});
    expect(clickTriggered).toBe(1);
    // but another tap will trigger another event
    interactor.simulateEvent(
      'singletap', {touch: true, center: {x: 20, y: 20}});
    expect(clickTriggered).toBe(2);
  });
});
describe('Optional Dependencies', function () {
  var $ = require('jquery');
  var geo = require('../test-utils').geo;

  beforeEach(function () {
    // create a new div
    $('<div id="mapNode1" class="mapNode testNode"></div>')
        .css({width: '800px', height: '600px'}).appendTo('body');
  });

  afterEach(function () {
    // delete the div and clean up lingering event handlers
    $('.testNode').remove();
    $(document).off('.geojs');
  });

  it('test missing Hammer library', function () {
    var old = __webpack_modules__[require.resolveWeak('hammerjs')];  // eslint-disable-line
    __webpack_modules__[require.resolveWeak('hammerjs')] = null;  // eslint-disable-line
    delete __webpack_require__.c[require.resolveWeak('hammerjs')];  // eslint-disable-line
    var map = geo.map({node: '#mapNode1'}),
        interactor = map.interactor();

    expect(interactor.hasTouchSupport()).toBe(true);
    expect(map.center().x).toBeCloseTo(0);
    // We shouldn't process pan touch events
    interactor.simulateEvent(
      'panstart', {touch: true, center: {x: 20, y: 20}});
    interactor.simulateEvent(
      'panmove', {touch: true, center: {x: 30, y: 20}});
    interactor.simulateEvent(
      'panend', {touch: true, center: {x: 40, y: 20}});
    expect(map.center().x).toBeCloseTo(0);
    __webpack_modules__[require.resolveWeak('hammerjs')] = old;  // eslint-disable-line
    delete __webpack_require__.c[require.resolveWeak('hammerjs')];  // eslint-disable-line
  });
});
