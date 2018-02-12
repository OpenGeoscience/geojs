
var $ = require('jquery');
var geo = require('../test-utils').geo;

/**
 * @class
 * A helper class for testing async behavior of throttling.
 */
var Helper = function () {
  'use strict';

  var accum_calls = [],
      delay_calls = [];

  return $.extend(this, {
    accum: function () {
      var args = [].splice.call(arguments, 0);
      accum_calls.push([this].concat(args));
    },
    delay: function () {
      var args = [].splice.call(arguments, 0);
      delay_calls.push([this].concat(args));
    },
    _get: function (callback) {
      if (callback === 'accum') {
        callback = accum_calls;
      } else if (callback === 'delay') {
        callback = delay_calls;
      } else {
        throw new Error('Invalid callback');
      }
      return callback;
    },
    _expect: function (callback, icall, obj) {
      (this._get(callback)[icall] || []).forEach(function (arg, i) {
        expect(arg).toBe(obj[i]);
      });
    }.bind(this),
    expect: function (callback, arr) {
      arr = arr || [];
      expect(this._get(callback).length).toBe(arr.length);
      arr.forEach(function (obj, icall) {
        this._expect(callback, icall, obj);
      }.bind(this));
    }.bind(this)
  });
};

describe('geo.util.debounce', function () {
  'use strict';

  var clock;
  beforeEach(function () {
    clock = sinon.useFakeTimers();
  });
  afterEach(function () {
    clock.restore();
  });

  it('at_begin=false, accumulator=undefined', function (done) {
    var helper = new Helper();
    var wrapped = geo.util.debounce(100, helper.delay);
    var that = {}, arg1 = {}, args = [];

    helper.expect('delay');
    helper.expect('accum');

    function exec() {
      wrapped.call(that);
      args.push([that]);
    }

    function exec_arg() {
      wrapped.call(that, arg1);
      args.push([that, arg1]);
    }

    exec();
    window.setTimeout(exec_arg, 0);

    exec();
    window.setTimeout(exec, 5);
    window.setTimeout(exec_arg, 5);

    window.setTimeout(exec_arg, 15);
    window.setTimeout(exec, 250);

    helper.expect('delay');
    helper.expect('accum');

    window.setTimeout(function () {
      helper.expect('delay', [[that, arg1]]);
      helper.expect('accum');
    }, 200);

    window.setTimeout(function () {
      helper.expect('delay', [[that, arg1], [that]]);
      helper.expect('accum');
      done();
    }, 600);
    clock.tick(1);   //   1
    clock.tick(4);   //   5
    clock.tick(10);  //  15
    clock.tick(185); // 200
    clock.tick(50);  // 250
    clock.tick(350); // 600
  });

  it('at_begin=false, accumulator=defined', function (done) {
    var helper = new Helper();
    var wrapped = geo.util.debounce(100, helper.delay, helper.accum);
    var that = {}, arg1 = {}, args = [];

    helper.expect('delay');
    helper.expect('accum');

    function exec() {
      wrapped.call(that);
      args.push([that]);
    }

    function exec_arg() {
      wrapped.call(that, arg1);
      args.push([that, arg1]);
    }

    exec();
    window.setTimeout(exec_arg, 0);

    exec();
    window.setTimeout(exec, 5);
    window.setTimeout(exec_arg, 5);

    window.setTimeout(exec_arg, 15);
    window.setTimeout(exec, 250);

    helper.expect('delay');
    helper.expect('accum', args);

    window.setTimeout(function () {
      helper.expect('delay', [[that, arg1]]);
      helper.expect('accum', args);
    }, 200);

    window.setTimeout(function () {
      helper.expect('delay', [[that, arg1], [that]]);
      helper.expect('accum', args);
      done();
    }, 600);
    clock.tick(1);   //   1
    clock.tick(4);   //   5
    clock.tick(10);  //  15
    clock.tick(185); // 200
    clock.tick(50);  // 250
    clock.tick(350); // 600
  });

  it('at_begin=true, accumulator=undefined', function (done) {
    var helper = new Helper();
    var wrapped = geo.util.debounce(100, true, helper.delay);
    var that = {}, arg1 = {}, args = [];

    helper.expect('delay');
    helper.expect('accum');

    function exec() {
      wrapped.call(that);
      args.push([that]);
    }

    function exec_arg() {
      wrapped.call(that, arg1);
      args.push([that, arg1]);
    }

    exec();
    window.setTimeout(exec_arg, 0);

    exec();
    window.setTimeout(exec, 5);
    window.setTimeout(exec_arg, 5);

    window.setTimeout(exec_arg, 15);
    window.setTimeout(exec, 250);

    helper.expect('delay', [[that, arg1]]);
    helper.expect('accum');

    window.setTimeout(function () {
      helper.expect('delay', [[that, arg1]]);
      helper.expect('accum');
    }, 200);

    window.setTimeout(function () {
      helper.expect('delay', [[that, arg1], [that]]);
      helper.expect('accum');
      done();
    }, 600);
    clock.tick(1);   //   1
    clock.tick(4);   //   5
    clock.tick(10);  //  15
    clock.tick(185); // 200
    clock.tick(50);  // 250
    clock.tick(350); // 600
  });

  it('at_begin=true, accumulator=defined', function (done) {
    var helper = new Helper();
    var wrapped = geo.util.debounce(100, true, helper.delay, helper.accum);
    var that = {}, arg1 = {}, args = [];

    helper.expect('delay');
    helper.expect('accum');

    function exec() {
      wrapped.call(that);
      args.push([that]);
    }

    function exec_arg() {
      wrapped.call(that, arg1);
      args.push([that, arg1]);
    }

    exec();
    window.setTimeout(exec_arg, 0);

    exec();
    window.setTimeout(exec, 5);
    window.setTimeout(exec_arg, 5);

    window.setTimeout(exec_arg, 15);
    window.setTimeout(exec, 250);

    helper.expect('delay', [[that, arg1]]);
    helper.expect('accum', args);

    window.setTimeout(function () {
      helper.expect('delay', [[that, arg1]]);
      helper.expect('accum', args);
    }, 200);

    window.setTimeout(function () {
      helper.expect('delay', [[that, arg1], [that]]);
      helper.expect('accum', args);
      done();
    }, 600);
    clock.tick(1);   //   1
    clock.tick(4);   //   5
    clock.tick(10);  //  15
    clock.tick(185); // 200
    clock.tick(50);  // 250
    clock.tick(350); // 600
  });
});

describe('geo.util.throttle', function () {
  'use strict';

  it('accumulator=undefined, no_trailing=false', function (done) {
    var helper = new Helper();
    var wrapped = geo.util.throttle(200, helper.delay);
    var arg1 = {}, arg2 = {}, that = {};

    helper.expect('delay');
    helper.expect('accum');

    wrapped.call(that, arg1, arg1);
    wrapped.call(that, arg2);
    wrapped.call(that);

    helper.expect('delay', [[that, arg1, arg1]]);
    helper.expect('accum');

    setTimeout(function () {
      helper.expect('delay', [
        [that, arg1, arg1],
        [that, arg2]
      ]);
      helper.expect('accum');
      done();
    }, 250);
  });

  it('accumulator=defined, no_trailing=false', function (done) {
    var helper = new Helper();
    var wrapped = geo.util.throttle(200, helper.delay, helper.accum);
    var arg1 = '#1', arg2 = '#2', that = {};

    helper.expect('delay');
    helper.expect('accum');

    wrapped.call(that, arg1, arg1);
    helper.expect('accum', [[that, arg1, arg1]]);

    wrapped.call(that, arg2);
    helper.expect('accum', [
      [that, arg1, arg1],
      [that, arg2]
    ]);

    wrapped.call(that);
    helper.expect('accum', [
      [that, arg1, arg1],
      [that, arg2],
      [that]
    ]);

    wrapped.call(that, arg1, arg2);
    helper.expect('accum', [
      [that, arg1, arg1],
      [that, arg2],
      [that],
      [that, arg1, arg2]
    ]);
    helper.expect('delay', [[that, arg1, arg1]]);

    setTimeout(function () {
      helper.expect('delay', [
        [that, arg1, arg1],
        [that, arg1, arg2]
      ]);
      helper.expect('accum', [
        [that, arg1, arg1],
        [that, arg2],
        [that],
        [that, arg1, arg2]
      ]);
      done();
    }, 250);
  });

  it('accumulator=undefined, no_trailing=true', function (done) {
    var helper = new Helper();
    var wrapped = geo.util.throttle(200, true, helper.delay);
    var arg1 = {}, arg2 = {}, that = {};

    helper.expect('delay');
    helper.expect('accum');

    wrapped.call(that, arg1, arg1);
    wrapped.call(that, arg2);
    wrapped.call(that);

    helper.expect('delay', [[that, arg1, arg1]]);
    helper.expect('accum');

    setTimeout(function () {
      helper.expect('delay', [
        [that, arg1, arg1]
      ]);
      helper.expect('accum');
      done();
    }, 250);
  });

  it('accumulator=defined, no_trailing=tree', function (done) {
    var helper = new Helper();
    var wrapped = geo.util.throttle(200, true, helper.delay, helper.accum);
    var arg1 = '#1', arg2 = '#2', that = {};

    helper.expect('delay');
    helper.expect('accum');

    wrapped.call(that, arg1, arg1);
    helper.expect('accum', [[that, arg1, arg1]]);

    wrapped.call(that, arg2);
    helper.expect('accum', [
      [that, arg1, arg1],
      [that, arg2]
    ]);

    wrapped.call(that);
    helper.expect('accum', [
      [that, arg1, arg1],
      [that, arg2],
      [that]
    ]);

    wrapped.call(that, arg1, arg2);
    helper.expect('accum', [
      [that, arg1, arg1],
      [that, arg2],
      [that],
      [that, arg1, arg2]
    ]);
    helper.expect('delay', [[that, arg1, arg1]]);

    setTimeout(function () {
      helper.expect('delay', [
        [that, arg1, arg1]
      ]);
      helper.expect('accum', [
        [that, arg1, arg1],
        [that, arg2],
        [that],
        [that, arg1, arg2]
      ]);
      done();
    }, 250);
  });
});
