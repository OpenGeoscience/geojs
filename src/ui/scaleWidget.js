var $ = require('jquery');
var inherit = require('../inherit');
var svgWidget = require('./svgWidget');
var registerWidget = require('../registry').registerWidget;

require('./scaleWidget.styl');

/**
 * Scale widget specification.
 *
 * @typedef {object} geo.gui.scaleWidget.spec
 * @property {number} [scale=1] A scale applied to the map gcs units to convert
 *   to the scale units.
 * @property {number} [maxWidth=200] The maximum width of the scale in pixels.
 *   For horizontal scales (orientation is `top` or `bottom`) this is the
 *   maximum length of the scale bar.  For vertical scales, this is the width
 *   available for the scale text.
 * @property {number} [maxHeight] The maximum height of the scale in pixels.
 *   For vertical scales (orientation is `left` or `right`) this is the
 *   maximum length of the scale bar.  For horizontal scales, this is the
 *   height available for the scale text.  Default is 200 for vertical scales,
 *   20 for horizontal scales.
 * @property {string} [orientation='bottom'] One of `left`, `right`, `top`, or
 *   `bottom`.  The scale text is placed in that location relative to the scale
 *   bar.
 * @property {number} [strokeWidth=2] The width of the ticks and scale bar in
 *   pixels.
 * @property {number} [tickLength=10] The length of the end ticks in pixels.
 * @property {string|geo.gui.scaleWidget.unit[]} [units='si'] One of either
 *   `'si'` or `'miles'` or an array of units in ascending order.  See the
 *   `UnitsTable` for examples.
 * @property {function} [distance] The function used to compute the length of
 *   the scale bar.  This defaults to `transform.sphericalDistance` for all
 *   maps except those with a gcs of `'+proj=longlat +axis=enu'`, where
 *   `math.sqrt(util.distance2dSquared(pt1, pt2))` is used instead.
 */

/**
 * Scale widget unit specification.
 *
 * @typedef {object} geo.gui.scaleWidget.unit
 * @property {string} unit Display name for the unit.
 * @property {number} scale Scale for 1 unit in the current system.
 * @property {number} [minimum=1] Minimum value where this applies after
 *   scaling.  This can be used to handle singular and plural words (e.g.,
 *   `[{units: 'meter', scale: 1}, {units: 'meters', scale: 1, minimum: 1.5}]`)
 * @property {number} [basis=10] The basis for the multiples value.
 * @property {object[]} [multiples] A list of objects in ascending value order
 *   that determine what round values are displayed.
 * @property {number} multiples.multiple The value that is selected for display.
 * @property {number} multiples.digit The number of significant digits in
 *   `multiple`.
 */

/**
 * For a unit table, the records are ordered smallest scale to largest scale.
 * The smallest unit can be repeated to have different rounding behavior for
 * values less than 1 and values greater than or equal to 1.
 *
 * @typedef {object} geo.gui.scaleWidget.unitTableRecord
 * @property {string} unit The display name of the unit.
 * @property {number} scale The size of the unit in base unit.
 * @property {number} [basis=10] The number of units in the next greater unit
 *    if not a power of 10.
 * @property {object[]} [multiples] A list of multiplier values to round to
 *    when rounding is used.  The list should probably include a multiple of 1.
 *    Default is 1, 1.5, 2, 3, 5, 8.
 * @property {number} multiples.multiple A factor to round to.
 * @property {number} multiples.digit The number of digits to preserve when
 *    rounding.
 */

/**
 * Create a new instance of class geo.gui.scaleWidget.
 *
 * @class
 * @alias geo.gui.scaleWidget
 * @extends {geo.gui.svgWidget}
 * @param {geo.gui.scaleWidget.spec} arg
 * @returns {geo.gui.scaleWidget}
 */
var scaleWidget = function (arg) {
  'use strict';
  if (!(this instanceof scaleWidget)) {
    return new scaleWidget(arg);
  }
  svgWidget.call(this, arg);

  var geo_event = require('../event');
  var transform = require('../transform');
  var util = require('../util');
  var d3 = require('../svg/svgRenderer').d3;

  var m_this = this,
      s_exit = this._exit,
      m_options = Object.assign({}, {
        scale: 1,
        maxWidth: 200,
        maxHeight: arg.orientation === 'left' || arg.orientation === 'right' ? 200 : 20,
        orientation: 'bottom',
        strokeWidth: 2,
        tickLength: 10,
        units: 'si',
        distance: function (pt1, pt2, gcs) {
          if (gcs === '+proj=longlat +axis=enu') {
            return Math.sqrt(util.distance2dSquared(pt1, pt2));
          }
          /* We can use either the spherical distance or the Vincenty distance
           * here in much the same way.
          return transform.vincentyDistance(pt1, pt2, gcs).distance;
           */
          return transform.sphericalDistance(pt1, pt2, gcs);
        }
      }, arg);

  /**
   * Initialize the scale widget.
   *
   * @returns {this}
   */
  this._init = function () {
    m_this._createCanvas();
    m_this._appendCanvasToParent();
    m_this.reposition();

    d3.select(m_this.canvas()).attr('width', m_options.maxWidth).attr('height', m_options.maxHeight);
    // Update the scale on pan
    m_this.geoOn(geo_event.pan, m_this._update);
    m_this._render();
    return m_this;
  };

  /**
   * Clean up after the widget.
   */
  this._exit = function () {
    m_this.geoOff(geo_event.pan, m_this._update);
    s_exit();
  };

  /**
   * Return true if the scale is vertically oriented.
   *
   * @returns {boolean} `true` if the scale is vertical, `false` if horizontal.
   */
  this._vertical = function () {
    return m_options.orientation === 'left' || m_options.orientation === 'right';
  };

  /**
   * Given a maximum value, return a value that is no larger than it but at a
   * round number of a set of units.
   *
   * @param {number} maxValue The maximum value to return.  The returned value
   *    will never be smaller than 3/5 of this value.
   * @param {number} pixels A number that is scaled by the ratio of the
   *    returned value to `maxValue`.
   * @param {string|geo.gui.scaleWidget.unit[]} [units] The units to use.  If
   *    not specified, the instance's option units value is used.
   * @returns {object} An object with `html`, `value`, and `pixels` values
   *    representing the calculated value.
   */
  this._scaleValue = function (maxValue, pixels, units) {
    units = (scaleWidget.unitsTable[units] || units ||
             scaleWidget.unitsTable[m_options.units] || m_options.units);
    var multiples = [
      {multiple: 1, digits: 1},
      {multiple: 1.5, digits: 2},
      {multiple: 2, digits: 1},
      {multiple: 3, digits: 1},
      {multiple: 5, digits: 1},
      {multiple: 8, digits: 1}];
    var unit = units[0],
        multiple, power, value;
    units.forEach(function (unitEntry) {
      if (maxValue >= unitEntry.scale * (unitEntry.minimum || 1)) {
        unit = unitEntry;
      }
    });
    power = Math.floor(Math.log(maxValue / unit.scale) / Math.log(unit.basis || 10));
    multiples = unit.multiples || multiples;
    multiples.forEach(function (mul) {
      var mulValue = unit.scale * mul.multiple * Math.pow(10, power);
      if (mulValue <= maxValue) {
        multiple = mul;
        value = mulValue;
      }
    });
    return {
      html: (multiple.multiple * Math.pow(10, power)).toFixed(
        Math.max(0, -power + multiple.digits - 1)) + ' ' + unit.unit,
      value: value,
      pixels: value / maxValue * pixels,
      power: power,
      multiple: multiple,
      unitRecord: unit,
      originalValue: maxValue,
      originalPixels: pixels
    };
  };

  /**
   * Create and draw the scale based on the current display distance at the
   * location of the scale.
   */
  this._render = function () {
    var svg = d3.select(m_this.canvas()),
        map = m_this.layer().map(),
        width = m_options.maxWidth,
        height = m_options.maxHeight,
        sw = m_options.strokeWidth,
        sw2 = sw * 0.5,
        tl = m_options.tickLength,
        vert = m_this._vertical(),
        pixels, pt1, pt2, dist, value, pts;

    pixels = (vert ? m_options.maxHeight : m_options.maxWidth) - sw;
    /* Calculate the distance that the maximum length scale bar can occupy at
     * the location that the scale bar will be drawn. */
    pt1 = $(svg.node()).offset();
    pt1 = {
      x: pt1.left + (m_options.orientation === 'left' ? width - sw2 : sw2),
      y: pt1.top + (m_options.orientation === 'top' ? height - sw2 : sw2)
    };
    pt2 = {x: pt1.x + (vert ? 0 : pixels), y: pt1.y + (vert ? pixels : 0)};
    dist = m_options.distance(map.displayToGcs(pt1, null), map.displayToGcs(pt2, null), map.gcs()) * m_options.scale;
    if (dist <= 0 || !isFinite(dist)) {
      console.warn('The distance calculated for the scale is invalid: ' + dist);
      return;
    }
    value = m_this._scaleValue(dist, pixels);
    if (vert) {
      height = value.pixels + sw;
    } else {
      width = value.pixels + sw;
    }
    svg.attr('width', width).attr('height', height);
    if (svg.select('polyline').empty()) {
      svg.append('polyline').classed('geojs-scale-widget-bar', true).attr('fill', 'none').attr('stroke-width', sw);
    }
    if (svg.select('text').empty()) {
      svg.append('text').classed('geojs-scale-widget-text', true);
    }
    switch (m_options.orientation) {
      case 'bottom':
        pts = [[sw2, tl], [sw2, sw2], [width - sw2, sw2], [width - sw2, tl]];
        svg.select('text')
          .attr('x', width / 2)
          .attr('y', sw * 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging');
        break;
      case 'top':
        pts = [[sw2, height - tl], [sw2, height - sw2], [width - sw2, height - sw2], [width - sw2, height - tl]];
        svg.select('text')
          .attr('x', width / 2)
          .attr('y', height - sw * 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'alphabetic');
        break;
      case 'left':
        pts = [[width - tl, sw2], [width - sw2, sw2], [width - sw2, height - sw2], [width - tl, height - sw2]];
        svg.select('text')
          .attr('x', width - sw * 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle');
        break;
      case 'right':
        pts = [[tl, sw2], [sw2, sw2], [sw2, height - sw2], [tl, height - sw2]];
        svg.select('text')
          .attr('x', sw * 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'middle');
        break;
    }
    svg.select('polyline').attr('points', pts.map(function (pt) { return pt.join(','); }).join(' '));
    svg.select('text').html(value.html);
  };

  /**
   * Update the widget upon panning.
   */
  this._update = function () {
    m_this._render();
  };

  /**
   * Get or set options.
   *
   * @param {string|object} [arg1] If `undefined`, return the options object.
   *    If a string, either set or return the option of that name.  If an
   *    object, update the options with the object's values.
   * @param {object} [arg2] If `arg1` is a string and this is defined, set
   *    the option to this value.
   * @returns {object|this} If options are set, return the annotation,
   *    otherwise return the requested option or the set of options.
   */
  this.options = function (arg1, arg2) {
    if (arg1 === undefined) {
      var result = Object.assign({}, m_options);
      result.position = m_this.position(undefined, true);
      return result;
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return arg1 === 'position' ? m_this.position(undefined, true) : m_options[arg1];
    }
    if (arg2 === undefined) {
      m_options = util.deepMerge(m_options, arg1);
    } else {
      m_options[arg1] = arg2;
    }
    if (arg1.position || arg1 === 'position') {
      m_this.position(arg1.position || arg2);
    }
    m_this._render();
    return m_this;
  };
};

inherit(scaleWidget, svgWidget);

/**
 * The unitsTable has predefined unit sets for a base unit of one meter.  Each
 * entry is an array that must be in ascending order.  Use unicode in strings,
 * not html entities.  It makes it more reusable.
 * @name unitsTable
 * @property {object} unitsTable The key names are the names of unit systems,
 *    such as `si`.
 * @property {geo.gui.scaleWidget.unitTableRecord[]} unitsTable.unit A list of
 *    units within the unit system from smallest to largest.
 * @memberof geo.gui.scaleWidget
 */
scaleWidget.unitsTable = {
  si: [
    {unit: 'nm', scale: 1e-9},
    {unit: '\u03BCm', scale: 1e-6},
    {unit: 'mm', scale: 0.001},
    {unit: 'm', scale: 1},
    {unit: 'km', scale: 1000}
  ],
  miles: [
    {unit: 'in', scale: 0.0254}, // applies to < 1 in
    {
      /* By specifying inches a second time, the first entry will apply to
       * values less than 1 inch, and those will be rounded by powers of 10
       * using the default rules.  This entry will round values differently,
       * so one will see 1, 1.5, 2, 3, 6, 9 rather than the default which would
       * be 1, 1.5, 2, 3, 5, 8, 10. */
      unit: 'in',
      scale: 0.0254,
      basis: 12,
      multiples: [
        {multiple: 1, digits: 1},
        {multiple: 1.5, digits: 2},
        {multiple: 2, digits: 1},
        {multiple: 3, digits: 1},
        {multiple: 6, digits: 1},
        {multiple: 9, digits: 1}
      ]
    },
    {unit: 'ft', scale: 0.3048},
    {unit: 'mi', scale: 1609.344}
  ],
  decmiles: [ // decimal miles
    {unit: 'mi', scale: 1609.344}
  ]
};

/**
 * The areaUnitsTable has predefined unit sets for a base unit of one square
 * meter.  Each entry is an array that must be in ascending order.  This table
 * can be passed to formatUnit.
 * @name areaUnitsTable
 * @property {object} areaUnitsTable The key names are the names of unit
 *    systems, such as `si`.
 * @property {geo.gui.scaleWidget.unitTableRecord[]} areaUnitsTable.unit A list
 *    of units within the unit system from smallest to largest.
 * @memberof geo.gui.scaleWidget
 */
scaleWidget.areaUnitsTable = {
  si: [
    {unit: 'nm\xB2', scale: 1e-18},
    {unit: '\u03BCm\xB2', scale: 1e-12},
    {unit: 'mm\xB2', scale: 1e-6},
    {unit: 'm\xB2', scale: 1},
    {unit: 'km\xB2', scale: 1e6}
  ],
  hectares: [
    {unit: 'ha', scale: 1e4}
  ],
  decmiles: [ // decimal square miles
    {unit: 'mi\xB2', scale: 1609.344 * 1609.344}
  ],
  miles: [
    {unit: 'in\xB2', scale: 0.0254 * 0.0254},
    {unit: 'ft\xB2', scale: 0.3048 * 0.3048},
    {unit: 'mi\xB2', scale: 1609.344 * 1609.344}
  ],
  acres: [
    {unit: 'pl', scale: 0.3048 * 0.3048 * 16.5 * 16.5},
    {unit: 'rd', scale: 1609.344 * 1609.344 / 640 / 4},
    {unit: 'ac', scale: 1609.344 * 1609.344 / 640}
  ]
};

/**
 * Format a unit with a specified number of significant figures.  Given a value
 * in base units, such as meters, this will return a string with appropriate
 * units.  For instance, `formatUnit(0.345)` will return `345 mm`.
 *
 * @param {number} val The value.  A length or area in base units.  With the
 *    default unit table, this is in meters.  With the `areaUnitsTable`, this
 *    is square meters.
 * @param {string|object[]} [unit] The name of the unit system or a unit
 *    table.
 * @param {object} [table] The table of the unit system.  Ignored if
 *    `unit` is a unit table.
 * @param {number} [digits] The minimum number of significant figures.
 * @returns {string?} A formatted string or `undefined`.
 */
scaleWidget.formatUnit = function (val, unit, table, digits) {
  if (val === undefined || val === null) {
    return undefined;
  }
  if (!Array.isArray(unit)) {
    table = table || scaleWidget.unitsTable;
    if (!table || !table[unit || 'si']) {
      return undefined;
    }
    unit = table[unit || 'si'];
  }
  let pos;
  for (pos = 0; pos < unit.length - 1; pos += 1) {
    if (val < unit[pos + 1].scale) {
      break;
    }
  }
  unit = unit[pos];
  val /= unit.scale;
  digits = Math.max(0, -Math.ceil(Math.log10(val)) + (digits === undefined || digits < 0 ? 3 : digits));
  if (digits > 10) {
    return undefined;
  }
  let result = val.toFixed(digits);
  if (digits) {
    while (result.substr(result.length - 1) === '0') {
      result = result.substr(0, result.length - 1);
    }
    if (result.substr(result.length - 1) === '.') {
      result = result.substr(0, result.length - 1);
    }
  }
  return result + ' ' + unit.unit;
};

registerWidget('dom', 'scale', scaleWidget);
module.exports = scaleWidget;
