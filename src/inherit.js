function newfunc() {
  return function () {};
}

/**
 * Convenient function to define JS inheritance.
 *
 * @param {object} C Child class instance.
 * @param {object} P Parent class instance.
 */
module.exports = function (C, P) {
  var F = newfunc();
  F.prototype = P.prototype;
  C.prototype = new F();
  C.prototype.constructor = C;
};
