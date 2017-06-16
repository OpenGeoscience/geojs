var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var graphFeature = require('../graphFeature');

/**
 * @class geo.d3.graphFeature
 * @extends geo.graphFeature
 */
var d3_graphFeature = function (arg) {
  'use strict';

  var m_this = this;

  if (!(this instanceof d3_graphFeature)) {
    return new d3_graphFeature(arg);
  }
  graphFeature.call(this, arg);

  /**
  *  Returns a d3 selection for the graph elements
  */
  this.select = function () {
    var renderer = m_this.renderer(),
        selection = {},
        node = m_this.nodeFeature(),
        links = m_this.linkFeatures();
    selection.nodes = renderer.select(node._d3id());
    selection.links = links.map(function (link) {
      return renderer.select(link._d3id());
    });
    return selection;
  };

  return this;
};

inherit(d3_graphFeature, graphFeature);

registerFeature('d3', 'graph', d3_graphFeature);

module.exports = d3_graphFeature;
