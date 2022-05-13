const annotation = require('./annotation');

/**
 * @namespace geo.annotation
 */
module.exports = {
  state: annotation.state,
  actionOwner: annotation.actionOwner,
  annotation: annotation.annotation,
  _editHandleFeatureLevel: annotation._editHandleFeatureLevel,
  defaultEditHandleStyle: annotation.defaultEditHandleStyle,
  constrainAspectRatio: annotation.constrainAspectRatio,
  baseAnnotation: annotation,
  circleAnnotation: require('./circleAnnotation'),
  ellipseAnnotation: require('./ellipseAnnotation'),
  lineAnnotation: require('./lineAnnotation'),
  pointAnnotation: require('./pointAnnotation'),
  polygonAnnotation: require('./polygonAnnotation'),
  rectangleAnnotation: require('./rectangleAnnotation'),
  squareAnnotation: require('./squareAnnotation')
};
