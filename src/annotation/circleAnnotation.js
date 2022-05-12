const $ = require('jquery');
const inherit = require('../inherit');
const registerAnnotation = require('../registry').registerAnnotation;
const markerFeature = require('../markerFeature');

const ellipseAnnotation = require('./ellipseAnnotation');

/**
 * Circle annotation class.
 *
 * Circles are a subset of rectangles with a fixed aspect ratio.
 *
 * @class
 * @alias geo.circleAnnotation
 * @extends geo.annotation
 *
 * @param {geo.circleAnnotation.spec?} [args] Options for the annotation.
 * @param {string} [annotationName='circle'] Override the annotation name.
 */
var circleAnnotation = function (args, annotationName) {
  'use strict';
  args = $.extend({}, args, {constraint: 1});
  if (!(this instanceof circleAnnotation)) {
    return new circleAnnotation(args, annotationName);
  }
  ellipseAnnotation.call(this, args, annotationName || 'circle');
};
inherit(circleAnnotation, ellipseAnnotation);
var circleRequiredFeatures = {};
circleRequiredFeatures[markerFeature.capabilities.feature] = true;
registerAnnotation('circle', circleAnnotation, circleRequiredFeatures);

module.exports = circleAnnotation;
