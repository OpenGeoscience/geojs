/*global window*/
/*jshint -W015, -W098*/
/*jscs:disable validateIndentation*/
(function ($, geo, d3) {
  'use strict';

  var load = function () {

  // This requires jquery ui, which we don't want to make a
  // hard requirement, so bail out here if the widget factory
  // is not available and throw a helpful message when the
  // tries to use it.
  if (!$.widget) {
    $.fn.geojsMap = function () {
      throw new Error(
        'The geojs jquery plugin requires jquery ui to be available.'
      );
    };
    return;
  }

  // for multiple initialization detection
  var initialized = false;

  /**
   * Takes an option key and returns true if it should
   * return a color accessor.
   * @private
   */
  function isColorKey(key) {
    return key.slice(key.length - 5, key.length)
      .toLowerCase() === 'color';
  }

  /**
   * Take an array of data and an accessor for a color property
   * and return a wrapped accessor mapping to actual color
   * values.  This allows users to pass arbitrary strings
   * or numbers as any color property and this will wrap
   * a categorical scale or linear scale.
   *
   * Requires d3
   * @private
   * @param {Object[]} data A data array
   * @param {(string|number|function)} acc A color accessor
   * @return {function}
   */
  function makeColorScale(data, acc) {
    if (!d3) {
      console.warn('d3 is unavailable, cannot apply color scales.');
      return acc;
    }
    var domain;
    var cannotHandle = false;
    var doNotHandle = true;
    var categorical = false;
    var min = Number.POSITIVE_INFINITY;
    var max = Number.NEGATIVE_INFINITY;

    function wrap(func) {
      if (geo.util.isFunction(func)) {
        return function () {
          return func(acc.apply(this, arguments));
        };
      } else {
        return func(acc);
      }
    }

    if (geo.util.isFunction(acc)) {
      domain = d3.set(data.map(acc)).values();
    } else {
      domain = [acc];
    }
    domain.forEach(function (v) {
      if (!(typeof v === 'string' &&
            typeof geo.util.convertColor(v) === 'object')) {
        // This is to handle cases when values are css names or
        // hex strings.  We don't want to apply a categorical
        // scale.
        doNotHandle = false;
      }
      if (typeof v === 'string') {
        categorical = true;
      } else if (!isFinite(v)) {
        cannotHandle = true;
      } else if (+v > max) {
        max = +v;
      } else if (+v < min) {
        min = +v;
      }
    });
    if (cannotHandle) {
      // At least one value is not a string or a numeric value.
      // Pass the bare accessor back to geojs to handle it.
      return acc;
    }
    if (doNotHandle) {
      return acc;
    }
    if (categorical) {
      if (domain.length <= 10) {
        return wrap(d3.scale.category10().domain(domain));
      } else if (domain.length <= 20) {
        return wrap(d3.scale.category20().domain(domain));
      } else {
        // TODO: sort domain by most used and make an "other" category
        return wrap(d3.scale.category20().domain(domain));
      }
    }
    // http://colorbrewer2.org/?type=diverging&scheme=RdYlBu&n=3
    return wrap(d3.scale.linear()
      .range([
        'rgb(252,141,89)',
        'rgb(255,255,191)',
        'rgb(145,191,219)'
      ])
      .domain([
        min,
        (min + max) / 2,
        max
      ]));
  }

  /**
   * @class geojsMap
   * @memberOf jQuery.fn
   *
   * @description Generates a geojs map inside an element.
   *
   *
   * Due to current limitations in geojs, only a single map can be instantiated
   * on a page.  Trying to create a second map will throw an error
   * (see issue
   * <a href="https://github.com/OpenGeoscience/geojs/issues/154">#154</a>).
   *
   * @example <caption>Create a map with the default options.</caption>
   * $("#map").geojsMap();
   * @example <caption>Create a map with a given initial center and zoom</caption>
   * $("#map").geojsMap({
   *    longitude: -125,
   *    latitude: 35,
   *    zoom: 5
   * });
   * @example <caption>Create a map with points</caption>
   * $("#map").geojsMap({
   *   data: [...],
   *   layers: [{
   *     renderer: 'vgl',
   *     features: [{
   *       type: 'point',
   *       size: 5,
   *       position: function (d) { return {x: d.geometry.x, y: d.geometry.y} },
   *       fillColor: function (d, i) { return i < 5 ? 'red' : 'blue },
   *       stroke: false
   *     }]
   *   }]
   * };
   */
  $.widget('geojs.geojsMap', /** @lends jQuery.fn.geojsMap */{
    /**
     * A coordinate object as accepted by geojs to express positions in an
     * arbitrary coordinate system (geographic, screen, etc).  Coordinates returned by
     * geojs methods are always expressed with "x" and "y" properties, but
     * it will accept any of the aliased properties.
     * @typedef coordinate
     * @type {object}
     * @property {number} longitude Alias: "x", "lng", or "lon"
     * @property {number} latitude Alias: "y" or "lat"
     * @property {number} [elevation=0] Alias: "z", "elev", or "height"
     */

    /**
     * Colors can be expressed in multiple ways:
     * <ul>
     *   <li>css name (<code>"steelblue"</code>)</li>
     *   <li>24 bit hex value (<code>0xff0051</code>)</li>
     *   <li>25 bit hex string (<code>"#ff0051"</code>)</li>
     *   <li>rgb object (values from 0-1, <code>{r: 1, g: 0.5, b: 0}</code>)</li>
     * </ul>
     * @typedef color
     * @type {*}
     */

    /**
     * Point feature options object.  All styles can be
     * given as accessor functions or constants.  Accessor
     * functions are called with the following signature:
     * <pre>
     *     function func(d, i) {
     *         // d    - data object
     *         // i    - index of d in the data array
     *         // this - geo.pointFeature
     *     }
     * </pre>
     * Pass null to remove saved options from previous calls.
     * @typedef pointOptions
     * @type {Object}
     * @property {Object[]} data Data array
     * @property {coordinate} position Location of the point center
     * @property {number} radius
     *  Radius of the circle in pixels (ignored when <code>size</code>
     *  is present)
     * @property {number} size
     *   A numerical value mapped affinely to a radius in the range [5,20]
     * @property {boolean} fill Presence or absence of the fill
     * @property {color} fillColor Interior color
     * @property {float} fillOpacity Opacity of the interior <code>[0,1]</code>
     * @property {boolean} stroke Presence or absence of the stroke
     * @property {color} strokeColor Stroke color
     * @property {float} strokeOpacity Opacity of the stroke <code>[0,1]</code>
     */

    /**
     * @instance
     * @description
     * Map options (not fully implemented).
     * @example <caption>Get the current map center</caption>
     * var center=$("#map").geojsMap("center");
     * @example <caption>Pan the map to a new center</caption>
     * $("#map").geojsMap("center", {lat: 10, lng: -100});
     * @property {coordinate} [center={lat: 0, lng: 0}] The map center
     * @property {number} [zoom=0] The zoom level (floating point >= 0)
     * @property {(number|null)} [width=null]
     *   The width of the map in pixels or null for 100%
     * @property {(number|null)} [height=null]
     *   The height of the map in pixels or null for 100%
     * @property {geo.layer.spec[]} [layers=[]]
     *   Describes layers added to the map
     * @property {boolean} [autoresize=true]
     *   Resize the map on <code>window.resize</code> (initialization only)
     */
    options: {
      center: {latitude: 0, longitude: 0},
      zoom: 0,
      width: null,
      height: null,
      layers: [],

      // These options are for future use, but shouldn't
      // be changed at the moment, so they aren't documented.
      baseLayer: 'osm',
      baseRenderer: 'vgl'
    },

    /**
     * Internal constructor
     * @instance
     * @protected
     */
    _create: function () {
      var m_this = this;
      if (this._map || !this.element.length) {
        // when called multiple times on a single element, do nothing
        return;
      }
      if (initialized) {
        // when called multiple times on different elements, die
        throw new Error(
          'Only one map per page is allowed.'
        );
      }
      // set global initialization state
      initialized = true;

      // create the map
      this._map = geo.map({
        width: this.options.width,
        height: this.options.height,
        zoom: this.options.zoom,
        center: this.options.center,
        node: this.element.get(0)
      });

      // create the base layer
      this._baseLayer = this._map.createLayer(
        this.options.baseLayer,
        {
          renderer: this.options.baseRenderer
        }
      );

      // Trigger a resize to a valid size before adding
      // the feature layer to handle some of the bugs that
      // occur when initializing onto a node of size 0.
      this._resize({width: 800, height: 600});

      // store the renderer, because it can't be changed
      this._renderer = this.options.renderer;

      this._layers = this.options.layers.map(function (layer) {
        layer.data = layer.data || m_this.options.data;
        return geo.layer.create(m_this._map, layer);
      });

      // trigger an initial draw
      this.redraw();
    },

    /**
     * Resize the map canvas.
     * @instance
     * @protected
     * @param {object?} size Explicit size or use this.options.
     */
    _resize: function (size) {
      var width = this.options.width,
          height = this.options.height;
      if (size) {
        width = size.width;
        height = size.height;
      }
      if (!width) {
        width = this.element.width();
      }
      if (!height) {
        height = this.element.height();
      }
      this._map.resize(0, 0, width, height);
    },

    /**
     * Do a full redraw of the map.  In general, users shouldn't need to
     * call this method, but it could be useful when accessing lower
     * level features of the mapping api.
     * @instance
     */
    redraw: function () {
      this._resize();
    }
  });

  // Some argument type definitions used only by this plugin:
  /**
   * A geojs renderer is one of the following:
   * <ul>
   *   <li><code>"vgl"</code>: Uses webGL</li>
   *   <li><code>"d3"</code>: Uses svg</li>
   * </ul>
   * @typedef renderer
   * @type {string}
   */


  };

  $(load);
})($ || window.$, geo || window.geo, d3 || window.d3);
