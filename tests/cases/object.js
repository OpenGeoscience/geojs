describe('geo.object', function () {

  var geo = require('../test-utils').geo;

  describe('Basic functionality', function () {

    function CallCounter(extraData) {
      var m_this = this;
      this.ncalls = 0;
      this.call = function (evtData) {
        if (extraData !== null) {
          expect(evtData).toBe(extraData);
        }
        m_this.ncalls++;
      };
    }

    it('Make a single object with one event handler', function () {
      var obj = new geo.object(),
          evtData = {},
          foo = new CallCounter(evtData);

      expect(obj.geoIsOn('testevent')).toBe(false);
      obj.geoOn('testevent', foo.call);
      expect(obj.geoIsOn('testevent')).toBe(true);
      expect(obj.geoIsOn(['testevent', 'anotherevent'])).toBe(true);
      expect(obj.geoIsOn('testevent', 'not foo.call')).toBe(false);
      expect(obj.geoIsOn('testevent', foo.call)).toBe(true);
      obj.geoTrigger('anotherevent', evtData);
      expect(foo.ncalls).toBe(0);

      obj.geoTrigger('testevent', evtData);
      expect(foo.ncalls).toBe(1);

      obj.geoTrigger('testevent', evtData);
      expect(foo.ncalls).toBe(2);

      obj.geoTrigger('test', evtData);
      expect(foo.ncalls).toBe(2);

      obj.geoOff('testevent', foo.call);
      obj.geoTrigger('testevent', evtData);
      expect(foo.ncalls).toBe(2);
    });

    it('Make a single object with several handlers on one event', function () {
      var obj = new geo.object(),
          evtData = {},
          foo = {
            handler1: new CallCounter(evtData),
            handler2: new CallCounter(evtData),
            handler3: new CallCounter(evtData),
            handler4: new CallCounter(evtData)
          };
      function checkAll(n) {
        expect(foo.handler1.ncalls).toBe(foo.handler2.ncalls);
        expect(foo.handler2.ncalls).toBe(foo.handler3.ncalls);
        expect(foo.handler3.ncalls).toBe(foo.handler4.ncalls);
        expect(foo.handler4.ncalls).toBe(n);
      }

      obj.geoOn('event', foo.handler1.call);
      obj.geoOn('event', foo.handler2.call);
      obj.geoOn('event', foo.handler3.call);
      obj.geoOn('event', foo.handler4.call);

      checkAll(0);

      obj.geoTrigger('event', evtData);
      checkAll(1);

      obj.geoTrigger('notevent', evtData);
      checkAll(1);

      obj.geoTrigger('event', evtData);
      checkAll(2);

      obj.geoTrigger('event', evtData);
      checkAll(3);

      obj.geoTrigger('another event', evtData);
      checkAll(3);

      obj.geoOff('event', foo.handler1.call);
      obj.geoOff('event', foo.handler3.call);
      obj.geoTrigger('event', evtData);
      expect(foo.handler1.ncalls).toBe(3);
      expect(foo.handler2.ncalls).toBe(4);
      expect(foo.handler3.ncalls).toBe(3);
      expect(foo.handler4.ncalls).toBe(4);

    });

    it('Make several objects with several events', function () {
      var obj = new geo.object(),
          d1 = {},
          d2 = {},
          d3 = {},
          d4 = {},
          foo = {
            evt1: {
              data: d1,
              handler: new CallCounter(d1)
            },
            evt2: {
              data: d2,
              handler: new CallCounter(null)
            },
            evt3: {
              data: d3,
              handler: new CallCounter(d3)
            },
            evt4: {
              data: d4,
              handler: new CallCounter(d4)
            }
          };

      function checkAll(n1, n2, n3, n4) {
        expect(foo.evt1.handler.ncalls).toBe(n1);
        expect(foo.evt2.handler.ncalls).toBe(n2);
        expect(foo.evt3.handler.ncalls).toBe(n3);
        expect(foo.evt4.handler.ncalls).toBe(n4);
      }
      obj.geoOn('event1', foo.evt1.handler.call);
      obj.geoOn('event3', foo.evt3.handler.call);
      obj.geoOn('event4', foo.evt4.handler.call);
      obj.geoOn('event1', foo.evt2.handler.call);
      obj.geoOn('event2', foo.evt2.handler.call);
      obj.geoOn('event4', foo.evt2.handler.call);

      checkAll(0, 0, 0, 0);

      obj.geoTrigger('event3', foo.evt3.data);
      checkAll(0, 0, 1, 0);

      obj.geoTrigger('event3', foo.evt3.data);
      checkAll(0, 0, 2, 0);

      obj.geoTrigger('event5');
      checkAll(0, 0, 2, 0);

      obj.geoTrigger('event1', foo.evt1.data);
      checkAll(1, 1, 2, 0);

      obj.geoTrigger('event4', foo.evt4.data);
      checkAll(1, 2, 2, 1);

      obj.geoTrigger('event4', foo.evt4.data);
      checkAll(1, 3, 2, 2);

      obj.geoTrigger('event3', foo.evt3.data);
      checkAll(1, 3, 3, 2);

      obj.geoTrigger('event2');
      checkAll(1, 4, 3, 2);

      obj.geoOff('event4', foo.evt2.handler.call);
      obj.geoOff('event1', foo.evt1.handler.call);
      obj.geoOff('event3', foo.evt3.handler.call);

      obj.geoTrigger('event3', foo.evt3.data);
      checkAll(1, 4, 3, 2);

      obj.geoTrigger('event5');
      checkAll(1, 4, 3, 2);

      obj.geoTrigger('event1', foo.evt1.data);
      checkAll(1, 5, 3, 2);

      obj.geoTrigger('event4', foo.evt4.data);
      checkAll(1, 5, 3, 3);

      obj.geoTrigger('event4', foo.evt4.data);
      checkAll(1, 5, 3, 4);

      obj.geoTrigger('event3', foo.evt3.data);
      checkAll(1, 5, 3, 4);

      obj.geoTrigger('event2');
      checkAll(1, 6, 3, 4);

    });

    it('Test object.geoOn([], function) call signature', function () {
      var obj = new geo.object(),
          data = {},
          foo = new CallCounter(data);

      obj.geoOn(['event1', 'event2', 'event3'], foo.call);

      obj.geoTrigger('event1', data);
      expect(foo.ncalls).toBe(1);

      obj.geoTrigger('event2', data);
      expect(foo.ncalls).toBe(2);

      obj.geoOff(['event2', 'event1'], foo.call);

      obj.geoTrigger('event1', data);
      expect(foo.ncalls).toBe(2);

      obj.geoTrigger('event3', data);
      expect(foo.ncalls).toBe(3);
    });

    it('Test a non-function handler', function () {
      sinon.stub(console, 'warn', function () {});
      var obj = new geo.object(),
          evtData = {},
          handler = new CallCounter(evtData);

      obj.geoOn('event1', undefined);
      expect(console.warn.calledOnce);
      obj.geoOn('event1', handler.call);
      obj.geoTrigger('event1', evtData);
      expect(handler.ncalls).toBe(1);
      console.warn.restore();
    });

    it('Test a handler that has an error', function () {
      sinon.stub(console, 'warn', function () {});
      var obj = new geo.object(),
          evtData = {},
          handler = new CallCounter(evtData);

      obj.geoOn('event1', function () { throw new Error('fail'); });
      obj.geoOn('event1', handler.call);
      obj.geoTrigger('event1', evtData);
      expect(handler.ncalls).toBe(1);
      expect(console.warn.calledOnce);
      console.warn.restore();
    });
  });

});
