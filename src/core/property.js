(function () {
  "use strict";

  /**
   * Global definitions of possible property types that can be returned from
   * accessor methods.  These are used internally by feature subclasses to
   * generate property API methods.  Subclasses can add new property
   * types to this object, but should take care not to override base
   * types.
   *
   * Property definitions are objects containing the following methods and
   * members:
   * <ul>
   *   <li><code>[normalize]{@link geo.property.normalize}</code></li>
   * </ul>
   * @namespace
   */
  geo.property = {
    /**
     * Handles colors provided in any of the following forms:
     * <ul>
     *   <li>RGB object</li>
     *   <li>RGB array</li>
     *   <li>CSS color name</li>
     *   <li>Hex value string</li>
     *   <li>Hex value number</li>
     * </ul>
     */
    color: {
      normalize: function (value) {
        // To check if a value a number and is in the range [0, 255].
        function rangeValid(v) {
          return Number.isFinite(v) && v >= 0 && v <= 255;
        }

        // convert from a number to rgb object
        function valueToObject(v) {
          // jshint -W016
          return {
            r: (v & 0xff0000) >> 16,
            g: (v & 0xff00) >> 8,
            b: (v & 0xff)
          };
          // jshint +W016
        }

        var valid = false, norm = null, tmp;

        if (Array.isArray(value) && value.length === 3) {

          // an array of numbers
          value.forEach(function (v) {
            valid = valid && rangeValid(v);
          });
          if (valid) {
            norm = {
              r: value[0],
              g: value[1],
              b: value[2]
            };
          }

        } else if (typeof value === "string") {

          if (value[0] === "#") {

            // a hex string
            tmp = parseInt(value.slice(1));
            valid = tmp >= 0 && tmp <= 0xffffff;
            if (valid) {
              norm = valueToObject(tmp);
            }

          } else {

            // a css name
            valid = geo.util.cssColors.hasOwnProperty(value);
            if (valid) {
              norm = valueToObject(geo.util.cssColors[value]);
            }

          }
        } else if (Number.isFinite(value)) {

          // 24 bit value as a number
          valid = value >= 0 && value <= 0xffffff;
          if (valid) {
            norm = valueToObject(value);
          }

        } else {

          // a bare object with rgb components
          valid = rangeValid(value.r) &&
            rangeValid(value.g) &&
            rangeValid(value.b);
          if (valid) {
            norm = value;
          }

        }
        return norm;
      }
    },
    /**
     * Handles opacity values as numbers in [0, 1].
     */
    opacity: {
      normalize: function (value) {
        if (Number.isFinite(value) && value >= 0 && value <= 255) {
          return value;
        }
        return null;
      }
    },
    /**
     * Handles boolean values.  All objects except
     * <code>undefined</code> are treated as boolean.
     */
    bool: {
      normalize: function (value) {
        // for a boolean, just accept the truthiness of anything
        // but undefined
        if (value !== undefined) {
          return !!value;
        }
        return null;
      }
    },
    /**
     * Handles generic container values usually defining subfeatures.  These
     * are accessors that return objects defining properties of various
     * subfeatures.  For example, a line feature contains an array of vertices
     * each of which have properties of their own.
     *
     */
    container: {
      normalize: function (value) {
        if (typeof value === "object") {
          return value;
        }
        return null;
      }
    },
    /**
     * Handles a position expressed in world coordinates with an optional
     * z component.  Accepts any coordinate handled by
     * {@link geo.util.normalizeCoordinates}.
     *
     */
    position: {
      normalize: function (value) {
        var c = geo.util.normalizeCoordinates(value);
        var x = c.x, y = c.y;
        var valid = Number.isFinite(x) && // Allow for periodic longitudes
                    Number.isFinite(y) && Math.abs(y) <= 90;
        if (valid) {
          return c;
        }
        return null;
      }
    },
    /**
     * Handles a size value (non-negative number).
     *
     */
    size: {
      normalize: function (value) {
        if (Number.isFinite(value) && value >= 0) {
          return value;
        }
        return null;
      }
    },

    /**
     * Handles a size value (non-negative number).
     *
     */
    image: {
      normalize: function (value) {
        return value;
      }
    }
  };

  /**
   * Put a property value into normalized form.  For example,
   * a position may be given as <code>{lat: 10, lon: -50}</code>, but
   * internal methods expect <code>{x: -50, y: 10}</code>.  This
   * method provides a unified interface for this kind of conversion.
   * When the value passed is invalid, this method will return null.
   * @method geo.property.normalize
   * @param {*} value A value type
   * @returns {geo.geoPosition|null}
   * @example
   * geo.property.color.normalize(-1)      // null
   * geo.property.color.normalize('black') // {r: 0, g: 0, b: 0}
   *
   * geo.property.boolean.normalize()     // null
   * geo.property.boolean.normalize({})   // true
   * geo.property.boolean.normalize(null) // false
   */
})();
