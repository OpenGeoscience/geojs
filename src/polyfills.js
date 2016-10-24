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
if (!Math.log2) {
  Math.log2 = function () {
    return Math.log.apply(Math, arguments) / Math.LN2;
  };
}

// Add a polyfill for Math.sinh
Math.sinh = Math.sinh || function (x) {
  var y = Math.exp(x);
  return (y - 1 / y) / 2;
};
