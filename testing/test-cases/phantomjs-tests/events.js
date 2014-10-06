/*global describe, it, expect, geo*/
describe('geo.event', function () {
  'use strict';

  it('Unique event names', function () {
    var key1, key2;
    for (key1 in geo.event) {
      if (geo.event.hasOwnProperty(key1)) {
        for (key2 in geo.event) {
          if (geo.event.hasOwnProperty(key2) && key1 !== key2) {
            expect(geo.event[key1]).not.toEqual(geo.event[key2]);
          }
        }
      }
    }
  });

  it('Ensure event instances have all static event types', function () {
    var key, evt = geo.event();

    for (key in evt) {
      if (evt.hasOwnProperty(key) && typeof evt[key] === 'string') {
        expect(evt[key]).toBe(geo.event[key]);
      }
    }
    for (key in geo.event) {
      if (geo.event.hasOwnProperty(key) && typeof geo.event[key] === 'string') {
        expect(geo.event[key]).toBe(evt[key]);
      }
    }
  });

  describe('Event namespacing', function () {
    it('Create a namespaced event object', function () {
      var evt = geo.event.namespace('test');

      expect(evt.zoom).toBe(geo.event.zoom + '.test');
      expect(evt.namespace()).toEqual(['test']);
    });

    it('Nested namespacing', function () {
      var evt = geo.event.namespace('one').namespace('two');

      expect(evt.zoom).toBe(geo.event.zoom + '.one.two');
      expect(evt.namespace()).toEqual(['one', 'two']);
    });
  });
});
