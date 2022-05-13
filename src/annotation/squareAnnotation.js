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
  args = $.extend({}, args, {constraint: 1});
  if (!(this instanceof squareAnnotation)) {
    return new squareAnnotation(args, annotationName);
  }
  rectangleAnnotation.call(this, args, annotationName || 'square');
};
inherit(squareAnnotation, rectangleAnnotation);
var squareRequiredFeatures = {};
squareRequiredFeatures[polygonFeature.capabilities.feature] = true;
registerAnnotation('square', squareAnnotation, squareRequiredFeatures);

module.exports = squareAnnotation;
