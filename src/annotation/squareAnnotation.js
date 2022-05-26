const $ = require('jquery');
const inherit = require('../inherit');
const registerAnnotation = require('../registry').registerAnnotation;
const polygonFeature = require('../polygonFeature');

const rectangleAnnotation = require('./rectangleAnnotation');

/**
 * Square annotation class.
 *
 * Squares are a subset of rectangles with a fixed aspect ratio.
 *
 * @class
 * @alias geo.squareAnnotation
 * @extends geo.annotation
 *
 * @param {geo.squareAnnotation.spec?} [args] Options for the annotation.
 * @param {string} [annotationName='square'] Override the annotation name.
 */
var squareAnnotation = function (args, annotationName) {
  'use strict';
  if (!(this instanceof squareAnnotation)) {
    return new squareAnnotation(args, annotationName);
  }
  args = $.extend(true, {}, this.constructor.defaults, args, {constraint: 1});
  rectangleAnnotation.call(this, args, annotationName || 'square');
};
inherit(squareAnnotation, rectangleAnnotation);

/**
 * This object contains the default options to initialize the class.
 */
squareAnnotation.defaults = $.extend({}, rectangleAnnotation.defaults, {
});

var squareRequiredFeatures = {};
squareRequiredFeatures[polygonFeature.capabilities.feature] = true;
registerAnnotation('square', squareAnnotation, squareRequiredFeatures);

module.exports = squareAnnotation;
