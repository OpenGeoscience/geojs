var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Choropleth feature specification.
 *
 * @typedef {geo.feature.spec} geo.choroplethFeature.spec
 * @extends geo.feature.spec
 * @property {geo.colorObject[]} [colorRange] Color lookup table.  Default is
 *   9-step color table.
 * @property {Function} [scale] A scale converts a input domain into the
 *   the colorRange.  Default is `d3.scaleQuantize()`.
 * @property {Function} [geoId] Given a geometry feature, return an identifier.
 * @property {Function} [scalarId] Given a scalar element, return an
 *   identifier.
 * @property {Function} [scalarValue] Given a scalar element, return a numeric
 *   values.
 */

/**
 * Create a new instance of class choroplethFeature.
 *
 * @class
 * @alias geo.choroplethFeature
 * @param {geo.choroplethFeature.spec} arg Feature specification.
 * @extends geo.feature
 * @returns {geo.choroplethFeature}
 */
var choroplethFeature = function (arg) {
  'use strict';
  if (!(this instanceof choroplethFeature)) {
    return new choroplethFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  var ensureFunction = require('./util').ensureFunction;

  delete arg.layer;
  delete arg.renderer;
  /**
   * @private
   */
  var d3 = require('./svg/svgRenderer').d3,
      m_this = this,
      s_init = this._init,
      m_choropleth = Object.assign(
        {},
        {
          colorRange: [
            {r: 0.07514311, g: 0.468049805, b: 1},
            {r: 0.468487184, g: 0.588057293, b: 1},
            {r: 0.656658579, g: 0.707001303, b: 1},
            {r: 0.821573924, g: 0.837809045, b: 1},
            {r: 0.943467973, g: 0.943498599, b: 0.943398095},
            {r: 1, g: 0.788626485, b: 0.750707739},
            {r: 1, g: 0.6289553, b: 0.568237474},
            {r: 1, g: 0.472800903, b: 0.404551679},
            {r: 0.916482116, g: 0.236630659, b: 0.209939162}
          ],
          scale: d3.scaleQuantize(),
          //accessor for ID on geodata feature
          geoId: function (geoFeature) {
            return geoFeature.properties.GEO_ID;
          },
          //accessor for ID on scalar element
          scalarId: function (scalarElement) {
            return scalarElement.id;
          },
          //accessor for value on scalar element
          scalarValue: function (scalarElement) {
            return scalarElement.value;
          }
        },
        arg);

  this.featureType = 'choropleth';

  /**
   * Get/Set choropleth scalar data.
   *
   * @param {object[]} [data] An array of objects that are passed to the
   *   `scalarId` and `scalarValue` functions to get the associated information
   *   for each scalar.
   * @param {Function} [aggregator] The aggregator aggregates the scalar when
   *   there are multiple values with the same id. The default is `d3.mean`.
   * @returns {object[]|this} Either the current scalar data or the feature
   *   instance.
   */
  this.scalar = function (data, aggregator) {
    var scalarId, scalarValue;

    if (data === undefined) {
      return m_this.choropleth.get('scalar')() || [];
    } else {
      scalarId = m_this.choropleth.get('scalarId');
      scalarValue = m_this.choropleth.get('scalarValue');
      m_choropleth.scalar = data;
      m_choropleth.scalarAggregator = aggregator || d3.mean;
      // we make internal dictionary from array for faster lookup
      // when matching geojson features to scalar values,
      // note that we also allow for multiple scalar elements
      // for the same geo feature
      m_choropleth.scalar._dictionary = data
        .reduce(function (accumeDictionary, scalarElement) {
          var id, value;

          id = scalarId(scalarElement);
          value = scalarValue(scalarElement);

          accumeDictionary[id] =
            accumeDictionary[id] ?
              accumeDictionary[id].push(value) : [value];

          return accumeDictionary;
        }, {});
      m_this.dataTime().modified();
    }
    return m_this;
  };

  /**
   * Get/Set choropleth accessor.
   *
   * @param {string|geo.choroplethFeature.spec} [arg1] If `undefined`,
   *    return the current choropleth specification.  If a string is specified,
   *    either get or set the named property.  If an object is given, set
   *    or update the specification with the specified parameters.
   * @param {object} [arg2] If `arg1` is a string, set that property to `arg2`.
   *    If `undefined`, return the current value of the named  property.
   * @returns {geo.choroplethFeature.spec|object|this} The current choropleth
   *    specification, the value of a named property, or this object.
   */
  this.choropleth = function (arg1, arg2) {
    var choropleth;

    if (arg1 === undefined) {
      return m_choropleth;
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return m_choropleth[arg1];
    }
    if (arg2 === undefined) {
      choropleth = Object.assign(
        {},
        m_choropleth,
        arg1
      );
      m_choropleth = choropleth;
    } else {
      m_choropleth[arg1] = arg2; //if you pass in accessor for prop
    }
    m_this.modified();
    return m_this;
  };

  /**
   * A uniform getter that always returns a function even for constant
   * choropleth properties.  This can also return all defined properties as
   * functions in a single object.
   *
   * @function choropleth_DOT_get
   * @memberof geo.choroplethFeature
   * @instance
   * @param {string} [key] If defined, return a function for the named
   *    property.  Otherwise, return an object with a function for all defined
   *    properties.
   * @returns {Function|object} Either a function for the named property or an
   *    object with functions for all defined properties.
   */
  this.choropleth.get = function (key) {
    var all = {}, k;
    if (key === undefined) {
      for (k in m_choropleth) {
        if (m_choropleth.hasOwnProperty(k)) {
          all[k] = m_this.choropleth.get(k);
        }
      }
      return all;
    }
    return ensureFunction(m_choropleth[key]);
  };

  /**
   * Add a geojson polygon feature to the current layer.
   *
   * @param {geo.geojsonFeature} feature A geojson parsed feature.
   * @param {geo.geoColor} fillColor The fill color for the feature.
   * @returns {geo.polygonFeature}
   */
  this._featureToPolygons = function (feature, fillColor) {
    var newFeature = m_this.layer().createFeature('polygon', {});

    if (feature.geometry.type === 'Polygon') {
      newFeature.data([{
        type: 'Polygon',
        coordinates: feature.geometry.coordinates
      }]);
    } else if (feature.geometry.type === 'MultiPolygon') {
      newFeature.data(feature.geometry.coordinates.map(function (coordinateMap) {
        return {
          type: 'Polygon',
          coordinates: coordinateMap
        };
      }));
    }

    newFeature
      .polygon(function (d) {
        return {
          outer: d.coordinates[0],
          inner: d.coordinates[1] // undefined but ok
        };
      })
      .position(function (d) {
        return {
          x: d[0],
          y: d[1]
        };
      })
      .style({
        fillColor: fillColor
      });

    return newFeature;
  };

  /**
   * Set a choropleth scale's domain and range.
   *
   * @param {Function} valueAccessor A function that can be passed to
   *    `d3.extent`.
   * @returns {this}
   */
  this._generateScale = function (valueAccessor) {
    var extent = d3.extent(m_this.scalar(), valueAccessor || undefined);

    m_this.choropleth()
      .scale
      .domain(extent)
      .range(m_this.choropleth().colorRange);

    return m_this;
  };

  /**
   * Generate scale for choropleth.data(), make polygons from features.
   *
   * @returns {geo.featurePolygon[]}
   */
  this.createChoropleth = function () {
    var choropleth = m_this.choropleth,
        data = m_this.data(),
        scalars = m_this.scalar(),
        valueFunc = choropleth.get('scalarValue'),
        getFeatureId = choropleth.get('geoId');

    m_this._generateScale(valueFunc);

    return data.map(function (feature) {
      var id = getFeatureId(feature);
      var valueArray = scalars._dictionary[id];
      var accumulatedScalarValue = choropleth().scalarAggregator(valueArray);
      // take average of this array of values
      // which allows for non-bijective correspondence
      // between geo data and scalar data
      var fillColor = m_this.choropleth().scale(accumulatedScalarValue);

      return m_this._featureToPolygons(feature, fillColor);
    });
  };

  /**
   * Initialize.
   *
   * @param {geo.choroplethFeature} arg
   * @returns {this}
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    if (m_choropleth) {
      m_this.dataTime().modified();
    }
    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(choroplethFeature, feature);
module.exports = choroplethFeature;
