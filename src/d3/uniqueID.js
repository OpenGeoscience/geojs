var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz',
    strLength = 8;

/**
 * Get a random string to use as a div ID
 * @function geo.d3.uniqueID
 * @returns {string}
 */
var uniqueID = function () {
  var strArray = [],
      i;
  strArray.length = strLength;
  for (i = 0; i < strLength; i += 1) {
    strArray[i] = chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return strArray.join('');
};

module.exports = uniqueID;
