describe('Testing onIdle event handling', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;

  describe('immediate callback', function () {
    it('no deferred', function () {
      var obj = geo.object(), called = false;

      obj.onIdle(function () {
        called = true;
      });

      expect(called).toBe(true);
    });

    it('resolved deferred', function (done) {
      var obj = geo.object(), defer = $.Deferred();

      obj.addPromise(defer);
      window.setTimeout(function () {
        var called = false;
        defer.resolve();

        obj.onIdle(function () {
          called = true;
        });

        expect(called).toBe(true);
        done();
      }, 0);
    });
  });

  describe('asynchronous callbacks', function () {
    it('single deferred', function (done) {
      var obj = geo.object(), defer = $.Deferred();

      obj.addPromise(defer);
      obj.onIdle(function () {
        done();
      });
      window.setTimeout(function () {
        defer.resolve();
      }, 10);
    });

    it('resolved defer', function (done) {
      var obj = geo.object(), defer = $.Deferred();

      defer.resolve();
      obj.addPromise(defer);
      obj.onIdle(function () {
        done();
      });
    });

    it('two defers', function (done) {
      var obj = geo.object(), defer1, defer2, count = 0;

      function callCounter() {
        count += 1;
      }

      defer1 = $.Deferred();
      defer2 = $.Deferred();
      obj.addPromise(defer1);
      obj.addPromise(defer2);
      obj.onIdle(callCounter);

      defer2.resolve();

      expect(count).toBe(0);

      window.setTimeout(function () {
        defer1.resolve();
        expect(count).toBe(1);
        done();
      }, 10);

    });

    it('duplicate defers', function (done) {
      var obj = geo.object(), defer1, count = 0;

      function callCounter() {
        count += 1;
      }

      defer1 = $.Deferred();
      obj.addPromise(defer1);
      obj.addPromise(defer1);
      obj.onIdle(callCounter);

      expect(count).toBe(0);

      window.setTimeout(function () {
        defer1.resolve();
        expect(count).toBe(1);
      }, 10);

      window.setTimeout(function () {
        defer1.resolve();
        expect(count).toBe(1);
      }, 20);

      window.setTimeout(done, 100);

    });

    it('interleaving events', function (done) {
      var obj, defer1, defer2, defer3, defer4, f1, f2, f3, f4;

      function callCounter() {
        var nCalls = 0, func;

        func = function () {
          nCalls += 1;
        };

        func.nCalls = function () {
          return nCalls;
        };

        return func;
      }

      obj = geo.object();
      defer1 = $.Deferred();
      defer2 = $.Deferred();
      defer3 = $.Deferred();
      defer4 = $.Deferred();

      f1 = callCounter();
      f2 = callCounter();
      f3 = callCounter();
      f4 = callCounter();

      obj.addPromise(defer1);
      obj.onIdle(f1);
      obj.onIdle(f2);

      window.setTimeout(function () {
        obj.addPromise(defer2);
        expect(f1.nCalls()).toBe(0);
        expect(f2.nCalls()).toBe(0);
        expect(f3.nCalls()).toBe(0);
        expect(f4.nCalls()).toBe(0);
      }, 20);
      window.setTimeout(function () {
        defer2.resolve();
        expect(f1.nCalls()).toBe(0);
        expect(f2.nCalls()).toBe(0);
        expect(f3.nCalls()).toBe(0);
        expect(f4.nCalls()).toBe(0);
      }, 40);
      window.setTimeout(function () {
        obj.addPromise(defer3);
        expect(f1.nCalls()).toBe(0);
        expect(f2.nCalls()).toBe(0);
        expect(f3.nCalls()).toBe(0);
        expect(f4.nCalls()).toBe(0);
      }, 60);
      window.setTimeout(function () {
        obj.onIdle(f3);
        expect(f1.nCalls()).toBe(0);
        expect(f2.nCalls()).toBe(0);
        expect(f3.nCalls()).toBe(0);
        expect(f4.nCalls()).toBe(0);
      }, 80);
      window.setTimeout(function () {
        defer3.resolve();
        defer1.resolve();
        expect(f1.nCalls()).toBe(1);
        expect(f2.nCalls()).toBe(1);
        expect(f3.nCalls()).toBe(1);
        expect(f4.nCalls()).toBe(0);
      }, 100);
      window.setTimeout(function () {
        obj.addPromise(defer4);
        obj.onIdle(f4);
        expect(f1.nCalls()).toBe(1);
        expect(f2.nCalls()).toBe(1);
        expect(f3.nCalls()).toBe(1);
        expect(f4.nCalls()).toBe(0);
      }, 120);
      window.setTimeout(function () {
        defer1.resolve();
        defer4.resolve();
        expect(f1.nCalls()).toBe(1);
        expect(f2.nCalls()).toBe(1);
        expect(f3.nCalls()).toBe(1);
        expect(f4.nCalls()).toBe(1);
        done();
      }, 200);

    });
  });
});
