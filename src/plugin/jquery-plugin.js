/*global window*/

(function ($, geo) {
  'use strict';

  // Default map options that can be over-ridden via plugin options.
  var defaultOptions = {
    mapOpts: {
      center: {latitude: 0, longitude: 0},
      zoom: 0
    },
    baseLayer: 'osm',            // a valid geojs base layer name
    baseRenderer: 'vglRenderer'  // renderer for the base layer
  };

  // polyfill console.warn if necessary
  var warn;
  if (console && console.warn) {
    warn = console.warn;
  } else {
    warn = $.noop;
  }

  // for multiple initialization detection
  var initialized = false;

  $.fn.geojsMap = function (options) {
    return this.each(function () {
      var m_this = $(this),
          geodata,
          opts,
          baseLayer,
          map;

      // geojs limitation:
      //    https://github.com/OpenGeoscience/geojs/issues/154
      if (initialized) {
        throw new Error(
          'Geojs currently limited to one map per page.'
        );
      }
      initialized = true;

      // Get user supplied options
      opts = $.extend(true, {}, defaultOptions, options);

      // Create the map
      map = geo.map($.extend({}, opts.mapOpts, {
        node: this
      }));

      // Set the initial size to something valid just in case
      map.resize(0, 0, 800, 600);

      // Create the baselayer
      baseLayer = map.createLayer(opts.baseLayer);

      // Create a resize method and attach it to window.resize
      function resize() {
        var width = m_this.width(),
            height = m_this.height();

        // Geojs doesn't handle invalid sizes gracefully.
        if (width <= 0 || height <= 0) {
          warn(
            'Attempting to set invalid size: (' + [width, height] + ')'
          );
        } else {
          map.resize(0, 0, width, height);
        }
      }
      resize();
      $(window).resize(resize);

      // Attach map information to the node
      geodata = {
        options: opts,
        map: map,
        baseLayer: baseLayer
      };
      $(this).data('geojs', geodata);
    });
  };
}($ || window.$, geo || window.geo));
