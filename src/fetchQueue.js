var $ = require('jquery');

/**
 * @typedef {object} geo.fetchQueue.spec
 * @property {number} [size=6] The maximum number of concurrent deferred
 *   objects.
 * @property {number} [track=600] The number of objects that are tracked that
 *   trigger checking if any of them have been abandoned.  The fetch queue can
 *   grow to the greater of this size and the number of items that are still
 *   needed.  Setting this to a low number will increase processing time, to a
 *   high number can increase memory.  Ideally, it should reflect the number of
 *   items that are kept in memory elsewhere.  If `needed` is `null`, this is
 *   ignored.
 * @property {function} [needed=null] If set, this function is passed a
 *   Deferred object and must return a truthy value if the object is still
 *   needed.
 */

/**
 * This class implements a queue for Deferred objects.  Whenever one of the
 * objects in the queue completes (resolved or rejected), another item in the
 * queue is processed.  The number of concurrently processing items can be
 * adjusted.
 *
 * At this time (2018-11-02) most major browsers support 6 concurrent requests
 * from any given server, so, when using the queue for tile images, the number
 * of concurrent requests should be 6 * (number of subdomains serving tiles).
 *
 * @class
 * @alias geo.fetchQueue
 * @param {geo.fetchQueue.spec} [options] A configuration object for the queue.
 * @returns {geo.fetchQueue}
 */
var fetchQueue = function (options) {
  if (!(this instanceof fetchQueue)) {
    return new fetchQueue(options);
  }

  options = options || {};
  this._size = options.size || 6;
  this._initialSize = options.initialSize || 0;
  this._track = options.track || 600;
  this._initialTrack = this._track;
  this._needed = options.needed || null;
  this._batch = false;

  var m_this = this,
      m_next_batch = 1;

  /**
   * Get/set the maximum concurrent deferred object size.
   * @property {number} size The maximum number of deferred objects.
   * @name geo.fetchQueue#size
   */
  Object.defineProperty(this, 'size', {
    get: function () { return m_this._size; },
    set: function (n) {
      m_this._size = n;
      if (m_this._initialSize > 1 && n < m_this._initialSize) {
        m_this._initialSize = n;
      }
      m_this.next_item();
    }
  });

  /**
   * Get/set the initial maximum concurrent deferred object size.
   * @property {number} initialSize The initial maximum number of deferred
   *    objects.  `0` to use `size`.
   * @name geo.fetchQueue#initialSize
   */
  Object.defineProperty(this, 'initialSize', {
    get: function () { return m_this._initialSize; },
    set: function (n) {
      m_this._initialSize = n;
      m_this.next_item();
    }
  });

  /**
   * Get/set the track size.  This is used to determine when to check if
   * entries can be discarded.
   * @property {number} track The number of entries to track without checking
   *    for discards.
   * @name geo.fetchQueue#track
   */
  Object.defineProperty(this, 'track', {
    get: function () { return m_this._track; },
    set: function (n) { m_this._track = n; }
  });

  /**
   * Get/set the initial track size.  Unless changed, this is the value used
   * for track on class initialization.
   * @property {number} initialTrack The number of entries to track without
   *    checking for discards.
   * @name geo.fetchQueue#intitialTrack
   */
  Object.defineProperty(this, 'initialTrack', {
    get: function () { return m_this._initialTrack; },
    set: function (n) { m_this._initialTrack = n; }
  });

  /**
   * Get the current queue size.  Read only.
   * @property {number} length The current queue size.
   * @name geo.fetchQueue#length
   */
  Object.defineProperty(this, 'length', {
    get: function () { return m_this._queue.length; }
  });

  /**
   * Get the current number of processing items.  Read only.
   * @property {number} processing The current number of processing items.
   * @name geo.fetchQueue#processing
   */
  Object.defineProperty(this, 'processing', {
    get: function () { return m_this._processing; }
  });

  /**
   * Remove all items from the queue.
   *
   * @returns {this}
   */
  this.clear = function () {
    m_this._queue = [];
    m_this._processing = 0;
    return m_this;
  };

  /**
   * Add a Deferred object to the queue.
   *
   * @param {jQuery.Deferred} defer Deferred object to add to the queue.
   * @param {function} callback A function to call when the item's turn is
   *  granted.
   * @param {boolean} atEnd If falsy, add the item to the front of the queue
   *  if batching is turned off or at the end of the current batch if it is
   *  turned on.  If truthy, always add the item to the end of the queue.
   * @returns {jQuery.Deferred} The deferred object that was passed to the
   *  function.
   */
  this.add = function (defer, callback, atEnd) {
    if (defer.__fetchQueue) {
      var pos = m_this._queue.indexOf(defer);
      if (pos >= 0) {
        // m_this._queue.splice(pos, 1);
        m_this._addToQueue(defer, atEnd, pos);
        return defer;
      }
    }
    var wait = $.Deferred();
    var process = $.Deferred();
    wait.done(function () {
      $.when(callback.call(defer)).always(process.resolve);
    }).fail(process.resolve);
    defer.__fetchQueue = wait;
    m_this._addToQueue(defer, atEnd);
    $.when(wait, process).always(function () {
      if (m_this._processing > 0) {
        m_this._processing -= 1;
      }
      m_this._initialSize = 0;
      m_this.next_item();
    }).promise(defer);
    m_this.next_item();
    return defer;
  };

  /**
   * Add an item to the queue.  If batches are being used, add it at after
   * other items in the same batch.
   *
   * @param {jQuery.Deferred} defer Deferred object to add to the queue.
   * @param {boolean} atEnd If falsy, add the item to the front of the queue
   *  if batching is turned off or at the end of the current batch if it is
   *  turned on.  If truthy, always add the item to the end of the queue.
   * @param {number} [pos] If specified, the current location in the queue of
   *   the object being added.  This avoids having to splice, push, or unshift
   *   the queue.
   */
  this._addToQueue = function (defer, atEnd, pos) {
    let move = atEnd ? m_this._queue.length - 1 : 0;
    defer.__fetchQueue._batch = m_this._batch;
    if (!atEnd && m_this._batch) {
      for (move = 0; move < m_this._queue.length - (pos === undefined ? 0 : 1); move += 1) {
        if (m_this._queue[move].__fetchQueue._batch !== m_this._batch) {
          break;
        }
      }
    }
    if (pos === undefined) {
      if (atEnd) {
        m_this._queue.push(defer);
      } else if (!move) {
        m_this._queue.unshift(defer);
      } else {
        m_this._queue.splice(move, 0, defer);
      }
    } else if (pos !== move) {
      const dir = pos < move ? 1 : -1;
      for (let i = pos; i !== move; i += dir) {
        m_this._queue[i] = m_this._queue[i + dir];
      }
      m_this._queue[move] = defer;
    }
  };

  /**
   * Get the position of a deferred object in the queue.
   *
   * @param {jQuery.Deferred} defer Deferred object to get the position of.
   * @returns {number} -1 if not in the queue, or the position in the queue.
   */
  this.get = function (defer) {
    return m_this._queue.indexOf(defer);
  };

  /**
   * Remove a Deferred object from the queue.
   *
   * @param {jQuery.Deferred} defer Deferred object to add to the queue.
   * @returns {boolean} `true` if the object was removed.
   */
  this.remove = function (defer) {
    var pos = m_this._queue.indexOf(defer);
    if (pos >= 0) {
      m_this._queue.splice(pos, 1);
      return true;
    }
    return false;
  };

  /**
   * Start a new batch or clear using batches.
   *
   * @param {boolean} start Truthy to start a new batch, falsy to turn off
   *   using batches.  `undefined` to return the current state of batches.
   * @returns {number|boolean|this} `false` if batches are turned off, the
   *   batch number if turned on, or `this` if setting the batch.
   */
  this.batch = function (start) {
    if (start === undefined) {
      return m_this._batch;
    }
    if (!start) {
      m_this._batch = false;
    } else {
      m_this._batch = m_next_batch;
      m_next_batch += 1;
    }
    return m_this;
  };

  /**
   * Check if any items are queued and if the processing allotment is not
   * full.  If so, process more items.
   */
  this.next_item = function () {
    if (m_this._innextitem) {
      return;
    }
    m_this._innextitem = true;
    /* if the queue is greater than the track size, check each item to see
     * if it is still needed. */
    if (m_this._queue.length > m_this._track && m_this._needed) {
      for (var i = m_this._queue.length - 1; i >= 0; i -= 1) {
        if (!m_this._needed(m_this._queue[i])) {
          var discard = m_this._queue.splice(i, 1)[0];
          m_this._processing += 1;
          discard.__fetchQueue.reject();
          delete discard.__fetchQueue;
        }
      }
    }
    while (m_this._processing < (m_this._initialSize || m_this._size) && m_this._queue.length) {
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

module.exports = fetchQueue;
