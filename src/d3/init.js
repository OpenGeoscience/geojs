/**
 * @module geo.d3
 */

/*global ogs, geo, gd3:true*/
gd3 = ogs.namespace('geo.d3');

//////////////////////////////////////////////////////////////////////////////
/**
 * Get a random string to use as a div ID
 */
//////////////////////////////////////////////////////////////////////////////
(function (gd3) {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
    strLength = 8;

  gd3.uniqueID = function () {
    var strArray = [],
        i;
    strArray.length = strLength;
    for( i = 0; i < strLength; i++) {
      strArray[i] = chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return strArray.join('');
  };
}(gd3));
