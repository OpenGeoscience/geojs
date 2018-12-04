var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var graphFeature = require('../graphFeature');

/**
 * Create a new instance of svg.graphFeature.
 *
 * @class
 * @alias geo.svg.graphFeature
 * @extends geo.graphFeature
 * @param {geo.graphFeature.spec} arg Feature options.
 * @returns {geo.graphFeature}
 */
var svg_graphFeature = function (arg) {
  'use strict';

  var m_this = this;

  if (!(this instanceof svg_graphFeature)) {
    return new svg_graphFeature(arg);
  }
  graphFeature.call(this, arg);

  /**
   * Return a d3 selection for the graph elements.
   *
   * @returns {object} An object with `nodes` and `links`, both d3 selectors
   *    for the graph elements.
   */
  this.select = function () {
    var renderer = m_this.renderer(),
        selection = {},
        node = m_this.nodeFeature(),
        links = m_this.linkFeatures();
    selection.nodes = renderer.select(node._svgid());
    selection.links = links.map(function (link) {
      return renderer.select(link._svgid());
    });
    return selection;
  };

  return this;
};

inherit(svg_graphFeature, graphFeature);

registerFeature('svg', 'graph', svg_graphFeature);

module.exports = svg_graphFeature;
