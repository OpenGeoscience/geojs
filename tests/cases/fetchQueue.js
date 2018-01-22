// Test geo.core.fetchQueue

describe('geo.core.fetchQueue', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var report = [],
      reference = 1;

  function make_deferred() {
    var item = {ref: reference};
    reference += 1;
    item.process = function () {
      item.defer = $.Deferred();
      item.defer.done(function () {
        report.push({ref: item.ref, success: true});
      }).fail(function () {
        report.push({ref: item.ref, success: false});
      }).promise(item);
      return item;
    };
    return item;
  }

  // test cache size settings
  describe('queue size', function () {
    beforeEach(function () {
      report = [];
      reference = 1;
    });

    it('queue is the expected size', function (done) {
      var q = geo.fetchQueue({size: 2}), dlist = [];

      expect(q.length).toBe(0);

      dlist.push(make_deferred());
      q.add(dlist[0], dlist[0].process);
      expect(q.length).toBe(0);
      expect(q.processing).toBe(1);

      dlist.push(make_deferred());
      q.add(dlist[1], dlist[1].process);
      dlist.push(make_deferred());
      q.add(dlist[2], dlist[2].process);
      expect(q.length).toBe(1);
      expect(q.processing).toBe(2);

      dlist.push(make_deferred());
      q.add(dlist[3], dlist[3].process);
      expect(q.length).toBe(2);
      expect(q.processing).toBe(2);
      expect(q._queue[0]).toBe(dlist[3]);
      expect(q.get(dlist[3])).toBe(0);

      // adding an existing item should move it to the front
      q.add(dlist[2], dlist[2].process);
      expect(q.length).toBe(2);
      expect(q.processing).toBe(2);
      expect(q._queue[0]).toBe(dlist[2]);
      expect(q.get(dlist[2])).toBe(0);

      expect(q.remove(dlist[2])).toBe(true);
      expect(q.length).toBe(1);
      expect(q.processing).toBe(2);

      expect(q.remove(dlist[2])).toBe(false);
      expect(q.length).toBe(1);
      expect(q.processing).toBe(2);

      dlist[0].defer.resolve();
      window.setTimeout(function () { // wait for next time slice
        expect(q.length).toBe(0);
        expect(q.processing).toBe(2);

        dlist[3].defer.resolve();
        window.setTimeout(function () { // wait for next time slice
          expect(q.length).toBe(0);
          expect(q.processing).toBe(1);

          done();
        }, 0);
      }, 0);
    });

    it('queue size can be changed', function (done) {
      var q = geo.fetchQueue({size: 2}), dlist = [];

      expect(q.size).toBe(2);

      for (var i = 0; i < 5; i += 1) {
        dlist.push(make_deferred());
        // add items at end of queue
        q.add(dlist[i], dlist[i].process, true);
      }
      expect(q.length).toBe(3);
      expect(q.processing).toBe(2);

      // increasing the size should start another item processing
      q.size = 3;
      expect(q.size).toBe(3);
      expect(q.length).toBe(2);
      expect(q.processing).toBe(3);

      // but decresing it won't stop one
      q.size = 1;
      expect(q.size).toBe(1);
      expect(q.length).toBe(2);
      expect(q.processing).toBe(3);

      dlist[0].defer.resolve();
      window.setTimeout(function () { // wait for next time slice
        expect(q.length).toBe(2);
        expect(q.processing).toBe(2);

        dlist[1].defer.resolve();
        window.setTimeout(function () { // wait for next time slice
          expect(q.length).toBe(2);
          expect(q.processing).toBe(1);

          dlist[2].defer.resolve();
          window.setTimeout(function () { // wait for next time slice
            expect(q.length).toBe(1);
            expect(q.processing).toBe(1);
            done();
          }, 0);
        }, 0);
      }, 0);
    });

    it('queue removes and skips unneeded items', function (done) {
      var q = geo.fetchQueue({
        size: 2,
        track: 4,
        needed: function (item) {
          return (item.ref % 2) === 1;
        }
      });
      var qrefs = [
        [], // 1 being processed
        [], // 1 being processed, 2 rejected
        [], // 1 and 3 being processed
        [4],
        [5, 4],
        [6, 5, 4],
        [7, 6, 5, 4],
        [7, 5],
        [9, 7, 5],
        [10, 9, 7, 5],
        [11, 9, 7, 5],
        [11, 9, 7, 5],
        [13, 11, 9, 7, 5],
        [13, 11, 9, 7, 5]
      ];
      var dlist = [], i, j, reportOrder = [1, 3, 11, 13, 7, 9, 5];

      for (i = 0; i < 14; i += 1) {
        dlist.push(make_deferred());
        q.add(dlist[i], dlist[i].process);
        expect(q.length).toBe(qrefs[i].length);
        for (j = 0; j < q.length; j += 1) {
          expect(q._queue[j].ref).toBe(qrefs[i][j]);
          expect(q.get(dlist[qrefs[i][j] - 1])).toBe(j);
        }
        for (j = 0; j < dlist.length; j += 1) {
          expect(q.get(dlist[j])).toBe($.inArray(dlist[j].ref, qrefs[i]));
        }
      }

      function process() {
        if (q.processing) {
          for (i = 0; i < dlist.length; i += 1) {
            if (dlist[i].defer) {
              dlist[i].defer.resolve();
            }
          }
          window.setTimeout(process, 0);
          return;
        }

        expect(report.length).toBe(reportOrder.length);
        for (i = 0; i < report.length; i += 1) {
          expect(report[i].ref).toBe(reportOrder[i]);
        }
        done();
      }

      process();
    });

    it('batch ordering', function (done) {
      var q = geo.fetchQueue({size: 1}), dlist = [], i;
      var reportOrder = [
        1, 22, 23, 20, 19, 17, 13, 14, 16, 11, 10, 5,
        7, 8, 4, 2, 3, 6, 9, 12, 15, 18, 21, 24
      ];

      /* We add items to the queue stack-like, so the last added gets processed
       * first, unless they are batched or added at the end.  For this test,
       * the first item (1) will be processed immediately.  Items 2-4, 9-12,
       * 17-20 are added without batching, while items 5-8, 13-16, 21-24 are
       * batched.  Every third item is added at the end. */
      for (i = 0; i < 24; i += 1) {
        if ((i % 8) === 0) {
          q.batch(false);
          expect(q.batch()).toBe(false);
        } else if ((i % 4) === 0) {
          q.batch(true);
          expect(q.batch()).toBe(parseInt(i / 8, 10) + 1);
        }
        dlist.push(make_deferred());
        q.add(dlist[i], dlist[i].process, (i % 3) === 2);
      }

      function process() {
        if (q.processing) {
          for (i = 0; i < dlist.length; i += 1) {
            if (dlist[i].defer) {
              dlist[i].defer.resolve();
            }
          }
          window.setTimeout(process, 0);
          return;
        }

        expect(report.length).toBe(reportOrder.length);
        for (i = 0; i < report.length; i += 1) {
          expect(report[i].ref).toBe(reportOrder[i]);
        }
        done();
      }

      process();
    });
  });
});
