module.exports = (function () {
  'use strict';

  var $ = require('jquery');

  /**
   * This class implements a queue for Deferred objects.  Whenever one of the
   * objects in the queue completes (resolved or rejected), another item in the
   * queue is processed.  The number of concurrently processing items can be
   * adjusted.  At this time (2015-12-29) most major browsers support 6
   * concurrent requests from any given server, so, when using the queue for
   * tile images, thie number of concurrent requests should be 6 * (number of
   * subdomains serving tiles).
   *
   * @class geo.fetchQueue
   *
   * @param {Object?} [options] A configuration object for the queue
   * @param {Number} [options.size=6] The maximum number of concurrent deferred
   *    objects.
   * @param {Number} [options.track=600] The number of objects that are tracked
   *    that trigger checking if any of them have been abandoned.  The fetch
   *    queue can grow to the greater of this size and the number of items that
   *    are still needed.  Setting this to a low number will increase
   *    processing time, to a high number can increase memory.  Ideally, it
   *    should reflect the number of items that are kept in memory elsewhere.
   *    If needed is null, this is ignored.
   * @param {function} [options.needed=null] If set, this function is passed a
   *    Deferred object and must return a truthy value if the object is still
   *    needed.
   */
  var fetchQueue = function (options) {
    if (!(this instanceof fetchQueue)) {
      return new fetchQueue(options);
    }

    options = options || {};
    this._size = options.size || 6;
    this._track = options.track || 600;
    this._needed = options.needed || null;
    this._batch = false;

    var m_this = this,
        m_next_batch = 1;

    /**
     * Get/set the maximum concurrent deferred object size.
     */
    Object.defineProperty(this, 'size', {
      get: function () { return this._size; },
      set: function (n) {
        this._size = n;
        this.next_item();
      }
    });

    /**
     * Get the current queue size.
     */
    Object.defineProperty(this, 'length', {
      get: function () { return this._queue.length; }
    });

    /**
     * Get the current number of processing items.
     */
    Object.defineProperty(this, 'processing', {
      get: function () { return this._processing; }
    });

    /**
     * Remove all items from the queue.
     */
    this.clear = function () {
      this._queue = [];
      this._processing = 0;
      return this;
    };

    /**
     * Add a Deferred object to the queue.
     * @param {Deferred} defer Deferred object to add to the queue.
     * @param {function} callback a function to call when the item's turn is
     *  granted.
     * @param {boolean} atEnd if false, add the item to the front of the queue
     *  if batching is turned off or at the end of the current batch if it is
     *  turned on.  If true, always add the item to the end of the queue.
     */
    this.add = function (defer, callback, atEnd) {
      if (defer.__fetchQueue) {
        var pos = $.inArray(defer, this._queue);
        if (pos >= 0) {
          this._queue.splice(pos, 1);
          this._addToQueue(defer, atEnd);
          return defer;
        }
      }
      var wait = $.Deferred();
      var process = $.Deferred();
      wait.done(function () {
        $.when(callback.call(defer)).always(process.resolve);
      }).fail(process.resolve);
      defer.__fetchQueue = wait;
      this._addToQueue(defer, atEnd);
      $.when(wait, process).always(function () {
        if (m_this._processing > 0) {
          m_this._processing -= 1;
        }
        m_this.next_item();
      }).promise(defer);
      m_this.next_item();
      return defer;
    };

    /**
     * Add an item to the queue.  If batches are being used, add it at after
     * other items in the same batch.
     * @param {Deferred} defer Deferred object to add to the queue.
     * @param {boolean} atEnd if false, add the item to the front of the queue
     *  if batching is turned off or at the end of the current batch if it is
     *  turned on.  If true, always add the item to the end of the queue.
     */
    this._addToQueue = function (defer, atEnd) {
      defer.__fetchQueue._batch = this._batch;
      if (atEnd) {
        this._queue.push(defer);
      } else if (!this._batch) {
        this._queue.unshift(defer);
      } else {
        for (var i = 0; i < this._queue.length; i += 1) {
          if (this._queue[i].__fetchQueue._batch !== this._batch) {
            break;
          }
        }
        this._queue.splice(i, 0, defer);
      }
    };

    /**
     * Get the position of a deferred object in the queue.
     * @param {Deferred} defer Deferred object to get the position of.
     * @returns {number} -1 if not in the queue, or the position in the queue.
     */
    this.get = function (defer) {
      return $.inArray(defer, this._queue);
    };

    /**
     * Remove a Deferred object from the queue.
     * @param {Deferred} defer Deferred object to add to the queue.
     * @returns {bool} true if the object was removed
     */
    this.remove = function (defer) {
      var pos = $.inArray(defer, this._queue);
      if (pos >= 0) {
        this._queue.splice(pos, 1);
        return true;
      }
      return false;
    };

    /**
     * Start a new batch or clear using batches.
     * @param {boolean} start true to start a new batch, false to turn off
     *                        using batches.  Undefined to return the current
     *                        state of batches.
     * @return {Number|boolean|Object} the current batch state or this object.
     */
    this.batch = function (start) {
      if (start === undefined) {
        return this._batch;
      }
      if (!start) {
        this._batch = false;
      } else {
        this._batch = m_next_batch;
        m_next_batch += 1;
      }
      return this;
    };

    /**
     * Check if any items are queued and if there if there are not too many
     * deferred objects being processed.  If so, process more items.
     */
    this.next_item = function () {
      if (m_this._innextitem) {
        return;
      }
      m_this._innextitem = true;
      /* if the queue is greater than the track size, check each item to see
       * if it is still needed. */
      if (m_this._queue.length > m_this._track && this._needed) {
        for (var i = m_this._queue.length - 1; i >= 0; i -= 1) {
          if (!m_this._needed(m_this._queue[i])) {
            var discard = m_this._queue.splice(i, 1)[0];
            m_this._processing += 1;
            discard.__fetchQueue.reject();
            delete discard.__fetchQueue;
          }
        }
      }
      while (m_this._processing < m_this._size && m_this._queue.length) {
        var defer = m_this._queue.shift();
        if (defer.__fetchQueue) {
          m_this._processing += 1;
          var needed = m_this._needed ? m_this._needed(defer) : true;
          if (needed) {
            defer.__fetchQueue.resolve();
          } else {
            defer.__fetchQueue.reject();
          }
          delete defer.__fetchQueue;
        }
      }
      m_this._innextitem = false;
    };

    this.clear();
    return this;
  };

  return fetchQueue;
})();
