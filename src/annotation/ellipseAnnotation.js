const $ = require('jquery');
const inherit = require('../inherit');
const registerAnnotation = require('../registry').registerAnnotation;
const markerFeature = require('../markerFeature');

const annotationState = require('./annotation').state;
const rectangleAnnotation = require('./rectangleAnnotation');

/**
 * Ellipse annotation class.
 *
 * Ellipses are always rendered as markers.
 *
 * @class
 * @alias geo.ellipseAnnotation
 * @extends geo.annotation
 *
 * @param {geo.ellipseAnnotation.spec?} [args] Options for the annotation.
 * @param {string} [annotationName='ellipse'] Override the annotation name.
 */
var ellipseAnnotation = function (args, annotationName) {
  'use strict';
  if (!(this instanceof ellipseAnnotation)) {
    return new ellipseAnnotation(args, annotationName);
  }

  rectangleAnnotation.call(this, args, annotationName || 'ellipse');

  var m_this = this;

  /**
   * Get a list of renderable features for this annotation.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    var opt = m_this.options(),
        state = m_this.state(),
        features;
    features = [];
    if (opt.corners && opt.corners.length >= 4) {
      const style = m_this.styleForState(state);
      const w = ((opt.corners[0].x - opt.corners[1].x) ** 2 + (opt.corners[0].y - opt.corners[1].y) ** 2) ** 0.5;
      const h = ((opt.corners[0].x - opt.corners[3].x) ** 2 + (opt.corners[0].y - opt.corners[3].y) ** 2) ** 0.5;
      const radius = Math.max(w, h) / 2 / m_this.layer().map().unitsPerPixel(0);
      const aspect = w ? h / w : 1e20;
      const rotation = -Math.atan2(opt.corners[1].y - opt.corners[0].y, opt.corners[1].x - opt.corners[0].x);
      features = [{
        marker: {
          x: (opt.corners[0].x + opt.corners[1].x + opt.corners[2].x + opt.corners[3].x) / 4,
          y: (opt.corners[0].y + opt.corners[1].y + opt.corners[2].y + opt.corners[3].y) / 4,
          style: $.extend(
            {}, style,
            {
              radius: radius,
              symbolValue: aspect,
              rotation: rotation,
              strokeOffset: 0,
              radiusIncludesStroke: false,
              scaleWithZoom: markerFeature.scaleMode.fill,
              rotateWithMap: true,
              strokeOpacity: style.stroke === false ? 0 : style.strokeOpacity,
              fillOpacity: style.fill === false ? 0 : style.fillOpacity
            })
        }
      }];
    }
    if (state === annotationState.edit) {
      m_this._addEditHandles(features, opt.corners);
    }
    return features;
  };
};
inherit(ellipseAnnotation, rectangleAnnotation);

var ellipseRequiredFeatures = {};
ellipseRequiredFeatures[markerFeature.capabilities.feature] = true;
registerAnnotation('ellipse', ellipseAnnotation, ellipseRequiredFeatures);

module.exports = ellipseAnnotation;
