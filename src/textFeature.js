var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Object specification for a text feature.
 *
 * @typedef {geo.feature.spec} geo.textFeature.spec
 * @property {geo.geoPosition[]|function} [position] The position of each data
 *   element.  Defaults to the `x`, `y`, and `z` properties of the data
 *   element.
 * @property {string[]|function} [text] The text of each data element.
 *   Defaults to the `text` property of the data element.
 * @property {geo.textFeature.styleSpec} [style] The style to apply to each
 *   data element.
 */

/**
 * Style specification for a text feature.
 *
 * @typedef {geo.feature.styleSpec} geo.textFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @property {boolean|function} [visible=true] If falsy, don't show this data
 *    element.
 * @property {string|function} [font] A css font specification.  This is of the
 *    form `[style] [variant] [weight] [stretch] size[/line-height] family`.
 *    Individual font styles override this value if a style is specified in
 *    each.  See the individual font styles for details.
 * @property {string|function} [fontStyle='normal'] The font style.  One of
 *    `normal`, `italic`, or `oblique`.
 * @property {string|function} [fontVariant='normal'] The font variant.  This
 *    can have values such as `small-caps` or `slashed-zero`.
 * @property {string|function} [fontWeight='normal'] The font weight.  This may
 *    be a numeric value where 400 is normal and 700 is bold, or a string such
 *    as `bold` or `lighter`.
 * @property {string|function} [fontStretch='normal'] The font stretch, such as
 *    `condensed`.
 * @property {string|function} [fontSize='medium'] The font size.
 * @property {string|function} [lineHeight='normal'] The font line height.
 * @property {string|function} [fontFamily] The font family.
 * @property {string|function} [textAlign='center'] The horizontal text
 *    alignment.  One of `start`, `end`, `left`, `right`, or `center`.
 * @property {string|function} [textBaseline='middle'] The vertical text
 *    alignment.  One of `top`, `hanging`, `middle`, `alphabetic`,
 *    `ideographic`, or `bottom`.
 * @property {geo.geoColor|function} [color='black'] Text color.  May include
 *    opacity.
 * @property {number|function} [textOpacity=1] The opacity of the text.  If the
 *    color includes opacity, this is combined with that value.
 * @property {number|function} [rotation=0] Text rotation in radians.
 * @property {boolean|function} [rotateWithMap=false] If truthy, rotate the
 *    text when the map rotates.  Otherwise, the text is always in the same
 *    orientation.
 * @property {number|function} [textScaled] If defined, the text is scaled when
 *    the map zooms and this is the basis zoom for the fontSize.
 * @property {geo.screenPosition|function} [offset] Offset from the default
 *    position for the text.  This is applied before rotation.
 * @property {geo.geoColor|function} [shadowColor='black'] Text shadow color.
 *    May include opacity.
 * @property {geo.screenPosition|function} [shadowOffset] Offset for a text
 *    shadow.  This is applied before rotation.
 * @property {number|null|function} [shadowBlur] If not null, add a text shadow
 *    with this much blur.
 * @property {boolean|function} [shadowRotate=false] If truthy, rotate the
 *    shadow offset based on the text rotation (the `shadowOffset` is the
 *    offset if the text has a 0 rotation).
 * @property {geo.geoColor|function} [textStrokeColor='transparent'] Text
 *    stroke color.  May include opacity.
 * @property {geo.geoColor|function} [textStrokeWidth=0] Text stroke width in
 *    pixels.
 * @property {number|function} [renderThreshold] If this is a positive number,
 *    text elements may not be rendered if their base position (before offset
 *    and font effects are applied) is more than this distance in pixels
 *    outside of the current viewport.  If it is known that such text elements
 *    cannot affect the current viewport, setting this can speed up rendering.
 *    This is computed once for the whole feature.
 */

/**
 * Create a new instance of class textFeature.
 *
 * @class
 * @alias geo.textFeature
 * @extends geo.feature
 *
 * @param {geo.textFeature.spec} [arg] Options for the feature.
 * @returns {geo.textFeature} The created feature.
 */
var textFeature = function (arg) {
  'use strict';
  if (!(this instanceof textFeature)) {
    return new textFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  var $ = require('jquery');

  /**
   * @private
   */
  var m_this = this,
      s_init = this._init;

  this.featureType = 'text';

  /**
   * Get/Set position.
   *
   * @param {array|function} [val] If `undefined`, return the current position
   *    setting.  Otherwise, modify the current position setting.
   * @returns {array|function|this} The current position or this feature.
   */
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    } else if (val !== m_this.style('position')) {
      m_this.style('position', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Get/Set text.
   *
   * @param {array|function} [val] If `undefined`, return the current text
   *    setting.  Otherwise, modify the current text setting.
   * @returns {array|function|this} The current text or this feature.
   */
  this.text = function (val) {
    if (val === undefined) {
      return m_this.style('text');
    } else if (val !== m_this.style('text')) {
      m_this.style('text', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Initialize.
   *
   * @param {geo.textFeature.spec} [arg] The feature specification.
   */
  this._init = function (arg) {
    arg = arg || {};
    s_init.call(m_this, arg);

    var style = $.extend(
      {},
      {
        font: 'bold 16px sans-serif',
        textAlign: 'center',
        textBaseline: 'middle',
        color: { r: 0, g: 0, b: 0 },
        rotation: 0,  /* in radians */
        rotateWithMap: false,
        textScaled: false,
        position: function (d) { return d; },
        text: function (d) { return d.text; }
      },
      arg.style === undefined ? {} : arg.style
    );

    if (arg.position !== undefined) {
      style.position = arg.position;
    }
    if (arg.text !== undefined) {
      style.text = arg.text;
    }

    m_this.style(style);
    if (style.position) {
      m_this.position(style.position);
    }
    if (style.text) {
      m_this.text(style.text);
    }
    m_this.dataTime().modified();
  };

  this._init(arg);
  return m_this;
};

textFeature.usedStyles = [
  'visible', 'font', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch',
  'fontSize', 'lineHeight', 'fontFamily', 'textAlign', 'textBaseline', 'color',
  'textOpacity', 'rotation', 'rotateWithMap', 'textScaled', 'offset',
  'shadowColor', 'shadowOffset', 'shadowBlur', 'shadowRotate',
  'textStrokeColor', 'textStrokeWidth'
];

/**
 * Create a textFeature from an object.
 * @see {@link geo.feature.create}
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.textFeature.spec} spec The object specification
 * @returns {geo.textFeature|null}
 */
textFeature.create = function (layer, spec) {
  'use strict';

  spec = spec || {};
  spec.type = 'text';
  return feature.create(layer, spec);
};

textFeature.capabilities = {
  /* core feature name -- support in any manner */
  feature: 'text'
};

inherit(textFeature, feature);
module.exports = textFeature;
