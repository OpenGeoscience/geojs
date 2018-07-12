// Add a polyfill for window.requestAnimationFrame.
if (!window.requestAnimationFrame) {
  var _animationFrameFunc = [];
  if (!window.performance || !window.performance.now) {
    window.performance = {now: function () { return new Date().getTime(); }};
  }
  window.requestAnimationFrame = function (func) {
    'use strict';

    if (!_animationFrameFunc.length) {
      var time = window.performance.now();
      window.setTimeout(function () {
        var funcs = _animationFrameFunc;
        _animationFrameFunc = [];
        var curtime = window.performance.now();
        for (var i = 0; i < funcs.length; i += 1) {
          funcs[i].call(window, curtime);
        }
      }, 15 - (parseInt(time, 10) % 15));
    }
    _animationFrameFunc.push(func);
  };
}

// Add a polyfill for Math.log2
if (!('log2' in Math)) {
  Math.log2 = function () {
    return Math.log.apply(Math, arguments) / Math.LN2;
  };
}

// Add a polyfill for Math.log10
if (!('log10' in Math)) {
  Math.log10 = function () {
    return Math.log.apply(Math, arguments) / Math.LN10;
  };
  Math.log10.polyfilled = true;
}
