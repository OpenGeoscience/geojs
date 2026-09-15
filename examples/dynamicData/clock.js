/**
 * Stores the current time for a map, triggers time keeping events, and
 * handles the animation state and interaction.
 *
 * @class geo.clock
 * @extends geo.object
 * @returns {geo.clock}
 */
geo.clock = function (opts) {
  'use strict';

  if (!(this instanceof geo.clock)) {
    return new geo.clock(opts);
  }
  geo.object.call(this, opts);

  /**
   * @private
   */
  var m_this = this,
      m_now = new Date(0),
      m_start = null,
      m_end = null,
      m_step = null,
      m_rate = null,
      m_loop = Number.POSITIVE_INFINITY,
      m_currentLoop = 0,
      m_state = 'stop',
      m_currentAnimation = null,
      m_object = null;

  /**
   * Get or set the geo.object to trigger events on.
   */
  this.object = function (arg) {
    if (arg === undefined) {
      return m_object;
    }
    m_object = arg;
    return m_this;
  };

  /**
   * Returns true if attached to a valid geo.object.
   * @private
   */
  this._attached = function () {
    return (m_object instanceof geo.object);
  };

  /**
   * Get or set the current time.
   */
  this.now = function (arg) {
    var previous = m_now;
    if (arg === undefined) {
      return m_now;
    }
    m_now = arg;

    if (m_now !== previous &&
        m_this._attached()) {
      m_this.object().geoTrigger(geo.event.clock.change, {
        previous: previous,
        current: m_now,
        clock: m_this
      });
    }
    return m_this;
  };

  /**
   * Get or set the animation start time.
   */
  this.start = function (arg) {
    if (arg === undefined) {
      return m_start;
    }
    m_start = arg;
    return m_this;
  };

  /**
   * Get or set the animation end time.
   */
  this.end = function (arg) {
    if (arg === undefined) {
      return m_end;
    }
    m_end = arg;
    return m_this;
  };

  /**
   * Get or set the animation time step.
   */
  this.step = function (arg) {
    if (arg === undefined) {
      return m_step;
    }
    m_step = arg;
    return m_this;
  };

  /**
   * Get or set looping control of the clock.  This controls how many times the
   * animation will repeat before stopping.  Default
   * ``Number.POSITIVE_INFINITY``, the animation repeats forever.
   */
  this.loop = function (arg) {
    if (arg === undefined) {
      return m_loop;
    }
    m_loop = arg;
    return m_this;
  };

  /**
   * Get or set the animation state.  Valid values are:
   *
   *   * 'stop'
   *   * 'play'
   *   * 'pause'
   *
   * This will also trigger relevant events, but they may be fired
   * asynchronously.
   */
  this.state = function (arg, step) {

    if (arg === undefined) {
      return m_state;
    }
    if (['stop', 'play', 'pause'].indexOf(arg) < 0) {
      console.log('WARNING: Ignored invalid state: ' + arg);
      return m_this;
    }

    if (arg === 'play' && m_state === 'stop') {
      // reset animation parameters
      m_currentLoop = 0;
      m_this.now(m_this.start());
    }

    if (arg === 'play' && m_state !== 'play') {
      // Start a new animation.
      m_state = arg;
      m_this._animate(step || 1);
    }

    m_state = arg;
    return m_this;
  };

  /**
   * Get or set the animation frame rate.  This is approximately the number
   * of frames displayed per second.  A null value will use the browser's
   * native requestAnimationFrame to draw new frames.
   */
  this.framerate = function (arg) {
    if (arg === undefined) {
      return m_rate;
    }
    m_rate = arg;
    return m_this;
  };

  /**
   * Step to the next frame in the animation.  Pauses the animation if it is
   * playing.
   */
  this.stepForward = function () {
    m_this.state('pause');
    m_this._setNextFrame(1);
    return m_this;
  };

  /**
   * Step to the previous frame in the animation.  Pauses the animation if it is
   * playing.
   */
  this.stepBackward = function () {
    m_this.state('pause');
    m_this._setNextFrame(-1);
    return m_this;
  };

  /**
   * Step to the next frame in the animation.  Will set the state to stop
   * if the animation has reached the end and there are no more loops.
   * @private
   */
  this._setNextFrame = function (step) {
    var next = new Date(m_this.now().valueOf() + step * m_this.step());

    if (next >= m_this.end() || next <= m_this.start()) {
      if (m_this.loop() <= m_currentLoop) {
        m_this.state('stop');
        return;
      }
      m_currentLoop += 1;
      if (step >= 0) {
        m_this.now(m_this.start());
      } else {
        m_this.now(m_this.end());
      }
      return;
    }
    m_this.now(next);
  };

  /**
   * Start an animation.
   * @param {integer} step The animation frame step (+1 for forward -1 for
   *                       reverse, etc).
   * @private
   */
  this._animate = function (step) {
    var myAnimation = {};
    m_currentAnimation = myAnimation;

    function frame() {
      if (myAnimation !== m_currentAnimation) {
        // A new animation has started, so kill this one.
        return;
      }
      m_this._setNextFrame(step);
      if (m_this.state() === 'play') {

        // Queue the next frame
        if (!m_this.framerate()) {
          window.requestAnimationFrame(frame);
        } else {
          window.setTimeout(frame, 1000 / m_this.framerate());
        }
      } else if (m_this._attached()) {
        m_this.object().geoTrigger(geo.event.clock[m_this.state()], {
          current: m_this.now(),
          clock: m_this
        });
      }
    }

    // trigger the play event
    if (m_this._attached()) {
      m_this.object().geoTrigger(geo.event.clock.play, {
        current: m_this.now(),
        clock: m_this
      });
    }

    // Queue the first frame
    if (!m_this.framerate()) {
      window.requestAnimationFrame(frame);
    } else {
      window.setTimeout(frame, 1000 / m_this.framerate());
    }
  };

};

geo.inherit(geo.clock, geo.object);
geo.event.clock = {
  play: 'geo_clock_play',
  stop: 'geo_clock_stop',
  pause: 'geo_clock_pause',
  change: 'geo_clock_change'
};
