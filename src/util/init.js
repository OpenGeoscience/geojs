//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.util
 *
 * Contains utility classes and methods used by geojs.
 */
//////////////////////////////////////////////////////////////////////////////

(function () {
  "use strict";

  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  geo.util = {
    isFunction: function (f) {
      return typeof f === "function";
    },

    /**
     * Returns the argument if it is function, otherwise returns a function
     * that returns the argument.
     */
    ensureFunction: function (f) {
      if (geo.util.isFunction(f)) {
        return f;
      } else {
        return function () { return f; };
      }
    },

    // return a random string of length n || 8.
    randomString: function (n) {
      var s, i, r;
      n = n || 8;
      s = "";
      for (i = 0; i < n; i += 1) {
        r = Math.floor(Math.random() * chars.length);
        s += chars.substring(r, r + 1);
      }
      return s;
    }
  };
}());
