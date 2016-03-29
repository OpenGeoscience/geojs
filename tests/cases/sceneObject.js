describe('geo.sceneObject', function () {
  'use strict';

  var geo = require('../test-utils').geo;
  var $ = require('jquery');

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
  describe('Check tree operators', function () {
    it('addChild', function () {
      var parent = new geo.sceneObject(),
          children = [
            new geo.sceneObject(),
            new geo.sceneObject(),
            new geo.sceneObject()
          ];
      children.forEach(function (child) {
        parent.addChild(child);
      });

      expect(parent.parent()).toBe(null);
      parent.children().forEach(function (child, idx) {
        expect(child).toBe(children[idx]);
        expect(child.parent()).toBe(parent);
        expect(child.children().length).toBe(0);
      });
    });

    it('removeChild', function () {
      function deepCount(obj) {
        var n = 1;
        obj.children().forEach(function (child) {
          n += deepCount(child);
        });
        return n;
      }
      function spawnThree(r) {
        r.addChild(new geo.sceneObject());
        r.addChild(new geo.sceneObject());
        r.addChild(new geo.sceneObject());
      }
      var root = new geo.sceneObject(), child;
      spawnThree(root);
      expect(deepCount(root)).toBe(4);
      root.children().forEach(function (child) {
        spawnThree(child);
        child.children().forEach(spawnThree);
      });
      expect(deepCount(root)).toBe(40);

      root.removeChild(root.children()[0]);
      expect(deepCount(root)).toBe(27);

      child = root.children()[0];
      child.removeChild(child.children()[2]);
      expect(deepCount(root)).toBe(23);

      child = new geo.sceneObject();
      root.addChild(child);
      expect(deepCount(root)).toBe(24);

      root.removeChild(child);
      expect(deepCount(root)).toBe(23);

      root.children().forEach(root.removeChild);
      expect(deepCount(root)).toBe(1);
    });
  });

  describe('Check signal propagation', function () {
    function makeNode(root) {
      var child = new geo.sceneObject();
      child._handler = new CallCounter(null);
      child.count = function () {
        return child._handler.ncalls;
      };
      child.geoOn('signal', child._handler.call);
      if (root) {
        root.addChild(child);
      }
      return child;
    }

    it('Simple tree', function () {
      var root = makeNode(),
          child = makeNode(root),
          grandchild = makeNode(child);
      function checkCounts(n) {
        expect(root.count()).toBe(n);
        expect(child.count()).toBe(n);
        expect(grandchild.count()).toBe(n);
      }
      checkCounts(0);

      root.geoTrigger('signal');
      checkCounts(1);

      child.geoTrigger('signal');
      checkCounts(2);

      grandchild.geoTrigger('signal');
      checkCounts(3);
    });

    it('Shallow tree', function () {
      var root = makeNode();
      function checkCounts(n) {
        expect(root.count()).toBe(n);
        root.children().forEach(function (child) {
          expect(child.count()).toBe(n);
        });
      }

      var i, n;
      for (i = 0; i < 10; i++) {
        makeNode(root);
      }

      checkCounts(0);

      root.geoTrigger('signal');
      checkCounts(1);

      n = 1;
      root.children().forEach(function (child) {
        child.geoTrigger('signal');
        checkCounts(++n);
      });
    });

    it('Binary tree', function () {
      var root = makeNode(), nTrigger = 0;

      function checkCounts(root, n) {
        expect(root.count()).toBe(n);
        root.children().forEach(function (child) {
          checkCounts(child, n);
        });
      }

      function makeLevel(root, depth) {
        if (depth > 5) {
          return;
        }

        makeLevel(makeNode(root), depth + 1);
        makeLevel(makeNode(root), depth + 1);
      }

      function triggerEach(thisRoot) {
        thisRoot.geoTrigger('signal');
        checkCounts(root, ++nTrigger);
        thisRoot.children().forEach(function (child) {
          triggerEach(child);
        });
      }

      makeLevel(root, 0);
      checkCounts(root, 0);

      triggerEach(root);
    });

    it('Stop propagation', function () {
      var root, child1, child2, child2Called = false;
      root = geo.sceneObject();
      child1 = geo.sceneObject();
      child2 = geo.sceneObject();

      root.addChild(child1);
      child1.addChild(child2);

      child2.geoOn('signal', function () {
        child2Called = true;
      });
      root.geoTrigger('signal');

      expect(child2Called).toBe(true);

      child1.geoOn('signal', function (args) {
        args.geo.stopPropagation = true;
      });

      child2Called = false;
      root.geoTrigger('signal');

      expect(child2Called).toBe(false);
    });

    it('Children only', function () {
      var root, child1, child2, child1Called = false,
          child2Called = false, rootCalled = false;
      root = geo.sceneObject();
      child1 = geo.sceneObject();
      child2 = geo.sceneObject();

      root.addChild(child1);
      child1.addChild(child2);

      root.geoOn('signal', function () {
        rootCalled = true;
      });
      child1.geoOn('signal', function () {
        child1Called = true;
      });
      child2.geoOn('signal', function () {
        child2Called = true;
      });
      child1.geoTrigger('signal', {}, true);

      expect(child1Called).toBe(true);
      expect(child2Called).toBe(true);
      expect(rootCalled).toBe(false);
    });
  });
  describe('Check onIdle handlers', function () {
    var root = geo.sceneObject(),
        child1 = geo.sceneObject(),
        child2 = geo.sceneObject(),
        child3 = geo.sceneObject();

    root.addChild(child1);
    root.addChild(child2);
    child2.addChild(child3);

    it('child defers to parent', function () {
      var defer = $.Deferred(),
          handlerRoot = new CallCounter(null),
          handler1 = new CallCounter(null),
          handler2 = new CallCounter(null),
          handler3 = new CallCounter(null);

      function checkCallCount(count) {
        expect(handlerRoot.ncalls).toBe(count);
        expect(handler1.ncalls).toBe(count);
        expect(handler2.ncalls).toBe(count);
        expect(handler3.ncalls).toBe(count);
      }

      child3.addPromise(defer);
      root.onIdle(handlerRoot.call);
      child1.onIdle(handler1.call);
      child2.onIdle(handler2.call);
      child3.onIdle(handler3.call);

      checkCallCount(0);

      defer.resolve();

      checkCallCount(1);

      defer = $.Deferred();
      child3.addPromise(defer);

      checkCallCount(1);

      defer.resolve();

      checkCallCount(1);

      root.onIdle(handlerRoot.call);
      child1.onIdle(handler1.call);
      child2.onIdle(handler2.call);
      child3.onIdle(handler3.call);

      checkCallCount(2);
    });

    it('aysnchronous events from multiple children', function (done) {
      window.setTimeout(function () {
        var defer = $.Deferred();
        child1.addPromise(defer);

        window.setTimeout(function () {
          defer.resolve();
        }, 100);
      }, 0);
      window.setTimeout(function () {
        var defer = $.Deferred();
        child2.addPromise(defer);

        window.setTimeout(function () {
          defer.resolve();
        }, 200);
      }, 0);
      window.setTimeout(function () {
        var defer = $.Deferred();
        child3.addPromise(defer);

        window.setTimeout(function () {
          defer.resolve();
        }, 40);
      }, 10);

      window.setTimeout(function () {
        var handler = new CallCounter(null);
        root.onIdle(handler.call);
        expect(handler.ncalls).toBe(0);
        window.setTimeout(function () {
          expect(handler.ncalls).toBe(1);
          done();
        }, 400);
      }, 50);

    });
  });
});
