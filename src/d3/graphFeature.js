geo.d3.graphFeature = function (arg) {
  'use strict';

  var m_this = this;

  if (!(this instanceof geo.d3.graphFeature)) {
    return new geo.d3.graphFeature(arg);
  }
  geo.graphFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Returns a d3 selection for the graph elements
  */
  ////////////////////////////////////////////////////////////////////////////
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

inherit(geo.d3.graphFeature, geo.graphFeature);

geo.registerFeature('d3', 'graph', geo.d3.graphFeature);
