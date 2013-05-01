/**
 * @module ogs.vgl
 */

/**
 * Returns the first parameter if not undefined,
 * otherwise the second parameter.
 *
 * @class
 * @returns {vglModule.defaultValue}
 */
vglModule.defaultValue = function(a, b) {
  if (!(this instanceof vglModule.defaultValue)) {
    return new vglModule.defaultValue(a, b);
  }

  if (typeof a !== 'undefined') {
    return a;
  }
  return b;
};

vglModule.defaultValue.EMPTY_OBJECT = vglModule.freezeObject({});
