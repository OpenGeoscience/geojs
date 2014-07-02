//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.d3
 */
//////////////////////////////////////////////////////////////////////////////
gd3 = ogs.namespace('geo.d3'); // jshint ignore: line

//////////////////////////////////////////////////////////////////////////////
/**
 * Get a random string to use as a div ID
 */
//////////////////////////////////////////////////////////////////////////////
(function (gd3) {
  'use strict';

  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz',
    strLength = 8;

  gd3.uniqueID = function () {
    var strArray = [],
        i;
    strArray.length = strLength;
    for (i = 0; i < strLength; i += 1) {
      strArray[i] = chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return strArray.join('');
  };

  // event propagated when the d3 renderer rescales its group element
  geo.event.d3Rescale = 'geo.d3.rescale';
}(gd3));
