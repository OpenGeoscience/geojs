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
		m_choropleth = {},
		s_init = this._init,
		s_data = this.data;

	if (arg.choropleth === undefined) {
		m_choropleth = function (d) {
			return d;
		};
	} else {
		m_choropleth = arg.choropleth;
	}

	////////////////////////////////////////////////////////////////////////////
	/**
	 * Override the parent data method to keep track of changes to the
	 * internal coordinates.
	 */
	////////////////////////////////////////////////////////////////////////////
	this.data = function (arg) {
		var ret = s_data(arg);
		return ret;
	};

	////////////////////////////////////////////////////////////////////////////
	/**
	 * Get/Set choropleth accessor
	 *
	 * @returns {geo.pointFeature}
	 */
	////////////////////////////////////////////////////////////////////////////
	this.choropleth = function (arg1, arg2) {
		if (arg1 === undefined) {
			return m_choropleth;
		}
		if (typeof arg1 === 'string' && arg2 === undefined) {
			return m_choropleth[arg1];
		}
		if (arg2 === undefined) {
			var choropleth = $.extend(
				{},
				{
					minColor: 'black',
					minOpacity: 0,
					maxColor: 'white',
					maxOpacity: 1,
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
					]
				},
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
		if (key === undefined) {
			var all = {}, k;
			for (k in m_choropleth) {
				if (m_choropleth.hasOwnProperty(k)) {
					all[k] = m_this.choropleth.get(k);
				}
			}
			return all;
		}
		return geo.util.ensureFunction(m_choropleth[key]);
	};


	this._addPolygonFeature = function(coordinateArray){
		return m_this.layer()
			.createFeature('polygon', {
			})
			.data([{
				type: "Polygon",
				coordinates: coordinateArray
			}])
			.polygon(function (d) {
				return {
					'outer': d.coordinates[0],
					'inner': d.coordinates[1] // undefined but ok
				};				
			})
			.position(function(d){
				return {
					x: d[0],
					y: d[1]
				};
			});
	};
	
	this._featureToPolygons = function (feature) {
		if (feature.geometry.type === "Polygon"){
			return m_this._addPolygonFeature(feature.geometry.coordinates);
		} else if (feature.geometry.type === "MultiPolygon") {
			return feature.geometry.coordinates.map(function(polygonCoordinates){
				return m_this._addPolygonFeature(polygonCoordinates);
			});
		}
	};

	this._generateScale = function () {
		
	};
	
	////////////////////////////////////////////////////////////////////////////
	/**
	 * Create a set of vertices, values at the vertices, and opacities at the
	 * vertices.  Create a set of triangles of indices into the vertex array.
	 * Create a color and opacity map corresponding to the values.
	 *
	 * @returns: an object with pos, value, opacity, elements, minValue,
	 *           maxValue, minColor, maxColor, colorMap, factor.  If there is no
	 *           choropleth data that can be used, only elements is guaranteed to
	 *           exist, and it will be a zero-length array.
	 */
	////////////////////////////////////////////////////////////////////////////
	this.createChoropleth = function () {
		var val, minval, maxval, range, result,
			choropleth = m_this.choropleth,
			data = m_this.data(),
			opacityRange = choropleth.get('opacityRange')(),
			rangeValues = choropleth.get('rangeValues')(),
			valueFunc = m_this.style.get('value'), values = [],
			stepped = choropleth.get('stepped')();

		return data.features.map(function(feature){
			return m_this
				._featureToPolygons(feature, valueFunc(feature));
		});

	};

	////////////////////////////////////////////////////////////////////////////
	/**
	 * Initialize
	 */
	////////////////////////////////////////////////////////////////////////////
	this._init = function (arg) {
		s_init.call(m_this, arg);

		var defaultStyle = $.extend(
			{},
			{
				opacity: 1.0,
				value: function (geoJsonPolygon) {
					return geoJsonPolygon.properties.value;
				}
			},
			arg.style === undefined ? {} : arg.style
		);

		m_this.style(defaultStyle);

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
