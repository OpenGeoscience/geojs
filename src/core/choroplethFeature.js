//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class choroplethFeature
 *
 * @class
 * @extends geo.feature
 * @returns {geo.choroplethFeature}
 *
 */
//////////////////////////////////////////////////////////////////////////////
geo.choroplethFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.choroplethFeature)) {
    return new geo.choroplethFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      m_choropleth = $
      .extend({},
          {
                /* 9-step based on paraview bwr colortable */
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
            scale: d3.scale.quantize(),
            accessors: {
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
            }
          },
              arg.choropleth);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set choropleth scalar data
   *
   * @returns {geo.feature.choropleth}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.scalar = function (data, aggregator) {
    var scalarId, scalarValue;

    if (data === undefined) {
      return m_this.choropleth.get('scalar')();
    } else {
      scalarId = m_this.choropleth.get('accessors')().scalarId;
      scalarValue = m_this.choropleth.get('accessors')().scalarValue;
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set choropleth accessor
   *
   * @returns {geo.feature.choropleth}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.choropleth = function (arg1, arg2) {
    var choropleth;

    if (arg1 === undefined) {
      return m_choropleth;
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return m_choropleth[arg1];
    }
    if (arg2 === undefined) {
      choropleth = $.extend(
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * A uniform getter that always returns a function even for constant values.
   * If undefined input, return all the choropleth values as an object.
   *
   * @param {string|undefined} key
   * @return {function}
   */
  ////////////////////////////////////////////////////////////////////////////
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
    return geo.util.ensureFunction(m_choropleth[key]);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * A method that adds a polygon feature to the current layer.
   *
   * @param {array} coordinateArray
   * @param {geo.color} fillColor
   * @return {geo.feature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._addPolygonFeature = function (feature, fillColor) {
    var newFeature = m_this.layer()
        .createFeature('polygon', {});

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
          'outer': d.coordinates[0],
          'inner': d.coordinates[1] // undefined but ok
        };
      })
      .position(function (d) {
        return {
          x: d[0],
          y: d[1]
        };
      })
      .style({
        'fillColor': fillColor
      });

    return newFeature;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * A method that adds polygons from a given feature to the current layer.
   *
   * @param {} geoJsonFeature
   * @param geo.color
   * @return [{geo.feature}]
   */
  ////////////////////////////////////////////////////////////////////////////
  this._featureToPolygons = function (feature, fillValue) {
    return m_this
      ._addPolygonFeature(feature, fillValue);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * A method that sets a choropleth scale's domain and range.
   *
   * @param {undefined | function({})} valueAccessor
   * @return {geo.feature.choropleth}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._generateScale = function (valueAccessor) {
    var extent =
        d3.extent(m_this.scalar(), valueAccessor || undefined);

    m_this.choropleth()
      .scale
      .domain(extent)
      .range(m_this.choropleth().colorRange);

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**sr
   * Generate scale for choropleth.data(), make polygons from features.
   * @returns: [ [geo.feature.polygon, ...] , ... ]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createChoropleth = function () {
    var choropleth = m_this.choropleth,
        data = m_this.data(),
        scalars = m_this.scalar(),
        valueFunc = choropleth.get('accessors')().scalarValue,
        getFeatureId = choropleth.get('accessors')().geoId;

    m_this._generateScale(valueFunc);

    return data
      .map(function (feature) {
        var id = getFeatureId(feature);
        var valueArray = scalars._dictionary[id];
        var accumulatedScalarValue = choropleth().scalarAggregator(valueArray);
        // take average of this array of values
        // which allows for non-bijective correspondance
        // between geo data and scalar data
        var fillColor =
            m_this
            .choropleth()
            .scale(accumulatedScalarValue);

        return m_this
          ._featureToPolygons(feature, fillColor);
      });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);

    if (m_choropleth) {
      m_this.dataTime().modified();
    }
  };

  this._init(arg);
  return this;
};

inherit(geo.choroplethFeature, geo.feature);

/* Example:
 */
