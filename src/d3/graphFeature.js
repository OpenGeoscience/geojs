gd3.graphFeature = function (arg) {
  'use strict';

  var m_this = this;

  if (!(this instanceof gd3.graphFeature)) {
    return new gd3.graphFeature(arg);
  }
  geo.graphFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Returns a d3 selection for the graph elements
  */
  ////////////////////////////////////////////////////////////////////////////
  this.select = function () {
    var renderer = m_this.renderer(),
        selection = [],
        node = m_this.nodeFeature(),
        links = m_this.linkFeatures();
    selection = selection.concat(renderer.select(node._d3id()));
    links.forEach(function (link) {
      selection = selection.concat(renderer.select(link._d3id()));
    });
    return selection;
  };

  return this;
};

inherit(gd3.graphFeature, geo.graphFeature);

geo.registerFeature('d3', 'graph', gd3.graphFeature);
