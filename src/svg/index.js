var geo_event = require('../event.js');
geo_event.svg = {
  rescale: require('./rescale')
};

/**
 * @namespace geo.svg
 */
module.exports = {
  graphFeature: require('./graphFeature'),
  lineFeature: require('./lineFeature'),
  object: require('./object'),
  pathFeature: require('./pathFeature'),
  pointFeature: require('./pointFeature'),
  quadFeature: require('./quadFeature'),
  renderer: require('./svgRenderer'),
  tileLayer: require('./tileLayer'),
  trackFeature: require('./trackFeature'),
  uniqueID: require('./uniqueID'),
  vectorFeature: require('./vectorFeature')
};
