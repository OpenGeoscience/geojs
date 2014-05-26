gd3.graphFeature = function (arg) {
  'use strict';

  if (!(this instanceof gd3.graphFeature)) {
    return new gd3.graphFeature(arg);
  }
  geo.graphFeature.call(this, arg);

  return this;
};

inherit(gd3.graphFeature, geo.graphFeature);

geo.registerFeature('d3', 'graphFeature', gd3.graphFeature);
