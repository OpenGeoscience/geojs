(function () {
	"use strict";

	//Scale prototype: set domain and range
	geo.util.Scale = function (arg) {
		'use strict';
		if (!(this instanceof geo.util.Scale)) {
			return new geo.util.Scale(arg);
		}
		arg = arg || {};

		////////////////////////////////////////////////////////////////////////////
		/**
		 * @private
		 */
		////////////////////////////////////////////////////////////////////////////
		var m_this = this,
			m_domain = arg.domain || [0,1],
			m_range = arg.range || [0,1];

		this.domain = function (arg) {
			if (!arg) {
				return m_domain;
			} else if (Array.isArray(arg)){
				m_domain = arg;
				return m_this;
			} 
		}

		this.range = function (arg) {
			if (!arg) {
				return m_range;
			} else if (Array.isArray(arg)){
				m_range = arg;
				return m_this;
			} 
		};

		return this;
	}
	
	//quantize scale: continuous domain finite range
	geo.util.Scale.quantize = function (arg) {
		'use strict';
		if (!(this instanceof geo.util.Scale.quantize)) {
			return new geo.util.Scale.quantize(arg);
		}
		arg = arg || {};

		geo.util.Scale.call(this, arg);
		
		////////////////////////////////////////////////////////////////////////////
		/**
		 * @private
		 */
		////////////////////////////////////////////////////////////////////////////
		var m_this = this,
			s_domain = this.domain,
			m_max = arg.max || 1,
			m_min = arg.min || 0;

		this.domain = function (bounds) {
			if (bounds) {
				m_min = bounds[0];
				m_max = bounds[1];
			}
			return s_domain(bounds);
		}
			
		this._scaleInput = function (input) {
			var percentile = (input/m_max);
			var index = Math.floor(percentile*(buckets.length));
			return m_this.range()[index];
		};
		
		//d3-esque
		return function (inputValue) {
			if (!inputValue) {
				return m_this;
			} else {
				return m_this._scaleInput(inputValue);
			}
		};
	}

	geo.inherit(geo.util.Scale.quantize, geo.util.Scale);
	
})();
