/*global window*/

(function ($, geo) {
  var defaultOptions = {
    mapOpts: {
      center: [0, 0],
      zoom: 3
    },
    baseLayer: 'openStreetMaps'
  };
  $.fn.geojsMap = function (options) {
    this.each(function () {
      var m_this = $(this),
          geodata,
          opts,
          baseLayer,
          map;

      opts = $.extend(true, {}, defaultOptions, options);
      map = new geo.map($.extend({}, opts.mapOpts, {
        node: this
      }));
      if (opts.baseLayer === 'openStreetMaps') {
        baseLayer = new geo.osmLayer({'renderer': 'vglRenderer'}).referenceLayer(true);
      } else {
        throw "Invalid base layer " + opts.baseLayer;
      }
      map.addLayer(baseLayer);
      function resize() {
        var width = m_this.width(),
            height = m_this.height();
        map.resize(0, 0, width, height);
      }
      resize(); 
      
      geodata = {
        options: opts,
        map: map,
        baseLayer: baseLayer
      };

      $(window).resize(resize);
      $(this).data('geojs', geodata);
    });
  };
}(window.$, window.geo));
