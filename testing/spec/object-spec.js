/*global describe, it, expect, geo*/
describe('geo.object', function() {

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

      obj.on('testevent', foo.call);
      obj.trigger('anotherevent', evtData);
      expect(foo.ncalls).toBe(0);

      obj.trigger('testevent', evtData);
      expect(foo.ncalls).toBe(1);

      obj.trigger('testevent', evtData);
      expect(foo.ncalls).toBe(2);

      obj.trigger('test', evtData);
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

      obj.on('event', foo.handler1.call);
      obj.on('event', foo.handler2.call);
      obj.on('event', foo.handler3.call);
      obj.on('event', foo.handler4.call);
      
      checkAll(0);

      obj.trigger('event', evtData);
      checkAll(1);

      obj.trigger('notevent', evtData);
      checkAll(1);

      obj.trigger('event', evtData);
      checkAll(2);
      
      obj.trigger('event', evtData);
      checkAll(3);
      
      obj.trigger('another event', evtData);
      checkAll(3);
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
      obj.on('event1', foo.evt1.handler.call);
      obj.on('event3', foo.evt3.handler.call);
      obj.on('event4', foo.evt4.handler.call);
      obj.on('event1', foo.evt2.handler.call);
      obj.on('event2', foo.evt2.handler.call);
      obj.on('event4', foo.evt2.handler.call);

      checkAll(0, 0, 0, 0);

      obj.trigger('event3', foo.evt3.data);
      checkAll(0, 0, 1, 0);

      obj.trigger('event3', foo.evt3.data);
      checkAll(0, 0, 2, 0);
      
      obj.trigger('event5');
      checkAll(0, 0, 2, 0);
      
      obj.trigger('event1', foo.evt1.data);
      checkAll(1, 1, 2, 0);
      
      obj.trigger('event4', foo.evt4.data);
      checkAll(1, 2, 2, 1);
      
      obj.trigger('event4', foo.evt4.data);
      checkAll(1, 3, 2, 2);
      
      obj.trigger('event3', foo.evt3.data);
      checkAll(1, 3, 3, 2);
      
      obj.trigger('event2');
      checkAll(1, 4, 3, 2);
    });

    it('Test object.on([], function) call signature', function () {
      var obj = new geo.object(),
          data = {},
          foo = new CallCounter(data);
      
      obj.on(['event1', 'event2'], foo.call);

      obj.trigger('event1', data);
      expect(foo.ncalls).toBe(1);
      
      obj.trigger('event2', data);
      expect(foo.ncalls).toBe(2);
    });

  });

});
