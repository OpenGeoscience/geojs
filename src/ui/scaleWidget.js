var $ = require('jquery');
var inherit = require('../inherit');
var svgWidget = require('./svgWidget');
var registerWidget = require('../registry').registerWidget;

require('./scaleWidget.styl');

/**
 * Scale widget specification.
 *
 * @typedef {object} geo.gui.scaleWidget.spec
 * @param {number} [scale=1] A scale applied to the map gcs units to convert to
 *   the scale units.
 * @param {number} [maxWidth=200] The maximum width of the scale in pixels.
 *   For horizontal scales (orientation is `top` or `bottom`) this is the
 *   maximum length of the scale bar.  For vertical scales, this is the width
 *   available for the scale text.
 * @param {number} [maxHeight] The maximum height of the scale in pixels.
 *   For vertical scales (orientation is `left` or `right`) this is the
 *   maximum length of the scale bar.  For horizontal scales, this is the
 *   height available for the scale text.  Default is 200 for vertical scales,
 *   20 for horizontal scales.
 * @param {string} [orientation='bottom'] One of `left`, `right`, `top`, or
 *   `bottom`.  The scale text is placed in that location relative to the scale
 *   bar.
 * @param {number} [strokeWidth=2] The width of the ticks and scale bar in
 *   pixels.
 * @param {number} [tickLength=10] The length of the end ticks in pixels.
 * @param {string|geo.gui.scaleWidget.unit[]} [units='si'] One of either 'si'
 *   or 'miles' or an array of units in ascending order.  See the `UnitsTable`
 *   for examples.
 * @param {Function} [distance] The function used to compute the length of the
 *   scale bar.  This defaults to `transform.sphericalDistance` for all maps
 *   except those with a gcs of `'+proj=longlat +axis=enu'`, where
 *   `math.sqrt(util.distance2dSquared(pt1, pt2))` is used instead.
 */

/**
 * Scale widget unit specification.
 *
 * @typedef {object} geo.gui.scaleWidget.unit
 * @param {string} unit Display name for the unit.
 * @param {number} scale Scale for 1 unit in the current system.
 * @param {number} [minimum=1] Minimum value where this applies after scaling.
 *   This can be used to handle singular and plural words (e.g., `[{units:
 *   'meter', scale: 1}, {units: 'meters', scale: 1, minimum: 1.5}]`)
 * @param {number} [basis=10] The basis for the multiples value.
 * @param {object[]} [multiples] A list of objects in ascending value order that
 *   determine what round values are displayed.
 * @param {number} multiples.multiple The value that is selected for display.
 * @param {number} multiples.digit The number of significant digits in
 *   `mutliple`.
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
  var d3 = require('../d3/d3Renderer').d3;

  var m_this = this,
      s_exit = this._exit,
      m_options = $.extend({}, {
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

    d3.select(m_this.canvas()).attr({
      width: m_options.maxWidth,
      height: m_options.maxHeight
    });
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
    // svg.attr({width: width, height: height});
    pt1 = $(svg[0][0]).offset();
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
    svg.attr({width: width, height: height});
    if (svg.select('polyline').empty()) {
      svg.append('polyline').classed('geojs-scale-widget-bar', true).attr({
        fill: 'none',
        'stroke-width': sw
      });
    }
    if (svg.select('text').empty()) {
      svg.append('text').classed('geojs-scale-widget-text', true);
    }
    switch (m_options.orientation) {
      case 'bottom':
        pts = [[sw2, tl], [sw2, sw2], [width - sw2, sw2], [width - sw2, tl]];
        svg.select('text').attr({
          x: width / 2,
          y: sw * 2,
          'text-anchor': 'middle',
          'alignment-baseline': 'hanging'
        });
        break;
      case 'top':
        pts = [[sw2, height - tl], [sw2, height - sw2], [width - sw2, height - sw2], [width - sw2, height - tl]];
        svg.select('text').attr({
          x: width / 2,
          y: height - sw * 2,
          'text-anchor': 'middle',
          'alignment-baseline': 'baseline'
        });
        break;
      case 'left':
        pts = [[width - tl, sw2], [width - sw2, sw2], [width - sw2, height - sw2], [width - tl, height - sw2]];
        svg.select('text').attr({
          x: width - sw * 2,
          y: height / 2,
          'text-anchor': 'end',
          'alignment-baseline': 'middle'
        });
        break;
      case 'right':
        pts = [[tl, sw2], [sw2, sw2], [sw2, height - sw2], [tl, height - sw2]];
        svg.select('text').attr({
          x: sw * 2,
          y: height / 2,
          'text-anchor': 'start',
          'alignment-baseline': 'middle'
        });
        break;
    }
    svg.select('polyline').attr('points', pts.map(function (pt) { return pt.join(','); }).join(' '));
    svg.select('text').html(value.html);
  };

  /**
   * Update the widget upon panning.
   */
  this._update = function () {
    this._render();
  };

  /**
   * Set or get options.
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
      var result = $.extend({}, m_options);
      result.position = m_this.position(undefined, true);
      return result;
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return arg1 === 'position' ? m_this.position(undefined, true) : m_options[arg1];
    }
    if (arg2 === undefined) {
      m_options = $.extend(true, m_options, arg1);
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

/* The unitsTable has predefined unit sets.  Each entry is an array that must
 * be in ascending order. */
scaleWidget.unitsTable = {
  si: [
    {unit: 'nm', scale: 1e-9},
    {unit: '&mu;m', scale: 1e-6},
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
  ]
};

registerWidget('dom', 'scale', scaleWidget);
module.exports = scaleWidget;
