/**
 * Based on the following jquery throttle / debounce plugin:
 *
 * jQuery throttle / debounce - v1.1 - 3/7/2010
 * http://benalman.com/projects/jquery-throttle-debounce-plugin/
 *
 * @copyright 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 *
 * The implementation included here is modified to support a callback
 * method that can accumulate values between actual invocations of
 * the throttled method.
 */

/**
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll. If you want to
 * rate-limit execution of a function to a single time see
 * {@link geo.util.debounce}.
 *
 * In this visualization, | is a throttled-function call and X is the actual
 * callback execution:
 *
 * ```
 * Throttled with `no_trailing` specified as false or unspecified:
 * ||||||||||||||||||||||||| (pause) |||||||||||||||||||||||||
 * X    X    X    X    X    X        X    X    X    X    X    X
 *
 * Throttled with `no_trailing` specified as true:
 * ||||||||||||||||||||||||| (pause) |||||||||||||||||||||||||
 * X    X    X    X    X             X    X    X    X    X
 * ```
 *
 * This is also used to handle debouncing a function.
 *
 * @alias geo.util.throttle
 * @param {number} delay A zero-or-greater delay in milliseconds. For event
 *    callbacks, values around 100 or 250 (or even higher) are most useful.
 * @param {boolean} [no_trailing=false] If no_trailing is
 *    true, callback will only execute every `delay` milliseconds while the
 *    throttled-function is being called. If no_trailing is false or
 *    unspecified, callback will be executed one final time after the last
 *    throttled-function call. (After the throttled-function has not been
 *    called for `delay` milliseconds, the internal counter is reset)
 * @param {function} callback A function to be executed after `delay`
 *    milliseconds. The `this` context and all arguments are passed through,
 *    as-is, to `callback` when the throttled-function is executed.
 * @param {function} [accumulator] A function to be executed (synchronously)
 *    during **each** call to the wrapped function.  Typically, this
 *    this method is used to accumulate values that the callback uses
 *    when it finally executes.
 * @param {boolean} [debounce_mode] See the `at_begin` parameter of the
 *    `geo.util.debounce` function.
 * @returns {function} The throttled version of `callback`.
 *
 * @example
 * var throttled = geo.util.throttle( delay, [ no_trailing, ] callback );
 * $('selector').bind( 'someevent', throttled );
 * $('selector').unbind( 'someevent', throttled );
 */
var throttle = function (delay, no_trailing, callback, accumulator, debounce_mode) {
  // After wrapper has stopped being called, this timeout ensures that
  // `callback` is executed at the proper times in `throttle` and `end`
  // debounce modes.
  var timeout_id,

    // Keep track of the last time `callback` was executed.
      last_exec = 0;

  // `no_trailing` defaults to falsy.
  if (typeof no_trailing !== 'boolean') {
    debounce_mode = accumulator;
    accumulator = callback;
    callback = no_trailing;
    no_trailing = undefined;
  }

  // accumulator defaults to no-op
  if (typeof accumulator !== 'function') {
    debounce_mode = accumulator;
    accumulator = function () {};
  }

  // The `wrapper` function encapsulates all of the throttling / debouncing
  // functionality and when executed will limit the rate at which `callback`
  // is executed.
  function wrapper() {
    var that = this,
        elapsed = +new Date() - last_exec,
        args = arguments;

    // Execute `callback` and update the `last_exec` timestamp.
    function exec() {
      last_exec = +new Date();
      callback.apply(that, args);
    }

    // If `debounce_mode` is true (at_begin) this is used to clear the flag
    // to allow future `callback` executions.
    function clear() {
      timeout_id = undefined;
    }

    // always call the accumulator first
    accumulator.apply(that, args);

    if (debounce_mode && !timeout_id) {
      // Since `wrapper` is being called for the first time and
      // `debounce_mode` is true (at_begin), execute `callback`.
      exec();
    }

    // Clear any existing timeout.
    void (
      timeout_id && clearTimeout(timeout_id)
    );

    if (debounce_mode === undefined && elapsed > delay) {
      // In throttle mode, if `delay` time has been exceeded, execute
      // `callback`.
      exec();

    } else if (no_trailing !== true) {
      /*
       * In trailing throttle mode, since `delay` time has not been
       * exceeded, schedule `callback` to execute `delay` ms after most
       * recent execution.
       *
       * If `debounce_mode` is true (at_begin), schedule `clear` to execute
       * after `delay` ms.
       *
       * If `debounce_mode` is false (at end), schedule `callback` to
       * execute after `delay` ms.
       */
      timeout_id = setTimeout(
        debounce_mode ?
          clear :
          exec,
        debounce_mode === undefined ?
          delay - elapsed :
          delay
      );
    }
  }

  // Return the wrapper function.
  return wrapper;
};

/**
 * Debounce execution of a function. Debouncing, unlike throttling,
 * guarantees that a function is only executed a single time, either at the
 * very beginning of a series of calls, or at the very end. If you want to
 * simply rate-limit execution of a function, see the <jQuery.throttle>
 * method.
 *
 * In this visualization, | is a debounced-function call and X is the actual
 * callback execution:
 *
 * ::
 *
 *   Debounced with `at_begin` specified as false or unspecified:
 *   ||||||||||||||||||||||||| (pause) |||||||||||||||||||||||||
 *                            X                                 X
 *
 *   Debounced with `at_begin` specified as true:
 *   ||||||||||||||||||||||||| (pause) |||||||||||||||||||||||||
 *   X                                 X
 *
 * The bulk of the work is handled by the `geo.util.throttle` function.
 *
 * @param {number} delay A zero-or-greater delay in milliseconds. For event
 *    callbacks, values around 100 or 250 (or even higher) are most useful.
 * @param {boolean} [at_begin=false] If at_begin is false or
 *    unspecified, callback will only be executed `delay` milliseconds after
 *    the last debounced-function call. If at_begin is true, callback will be
 *    executed only at the first debounced-function call. (After the
 *    throttled-function has not been called for `delay` milliseconds, the
 *    internal counter is reset)
 * @param {function} callback A function to be executed after delay milliseconds.
 *    The `this` context and all arguments are passed through, as-is, to
 *    `callback` when the debounced-function is executed.
 * @param {function} [accumulator] A function to be executed (synchronously)
 *    during **each** call to the wrapped function.  Typically, this
 *    this method is used to accumulate values that the callback uses
 *    when it finally executes.
 *
 * @returns {function} A new, debounced, function.
 *
 * @example
 * var debounced = geo.util.debounce( delay, [ at_begin, ] callback );
 * $('selector').bind( 'someevent', debounced );
 * $('selector').unbind( 'someevent', debounced );
 *
 */
var debounce = function (delay, at_begin, callback, accumulator) {
  if (typeof at_begin !== 'boolean') {
    accumulator = callback;
    callback = at_begin;
    at_begin = false;
  }
  accumulator = accumulator || function () {};
  return throttle(delay, false, callback, accumulator, !!at_begin);
};

module.exports = {
  throttle: throttle,
  debounce: debounce
};
