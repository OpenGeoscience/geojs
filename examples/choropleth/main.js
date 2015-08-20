// Run after the DOM loads
$(function () {
	'use strict';
	
	// Define a function we will use to generate contours.
	function makeChoropleth(data, layer) {
		/* There are two example data sets.  One has a position array which
		 * consists of objects each with x, y, z values.  The other has a values
		 * array which just has our contour values. */
		var choropleth = layer.createFeature('choropleth')
			.data(data)
			.style({
				opacity: 0.75
			})
			.choropleth({
				/* The color range doesn't have to be linear:
				   rangeValues: [0, 25, 50, 75, 100, 125, 250, 500, 750, 2000],
				*/
				/* Or, you could plot iso-contour lines using a varying opacity:
				   rangeValues: [100, 100, 200, 200, 300, 300, 400, 400, 500, 500],
				   opacityRange: [1, 0, 1, 0, 1, 0, 1, 0, 1],
				*/
				/* You can make smooth contours instead of stepped contours:
				   stepped: false,
				*/
				min: 0
			});

		console.log(choropleth, "hey");

		return choropleth;
	}

	// Create a map object with the OpenStreetMaps base layer.
	var map = geo.map({
		node: '#map',
		center: {
			x: -65.965,
			y: 39.482
		},
		zoom: 4
	});

	// Add the osm layer
	map.createLayer(
		'osm'
	);

	// Create a gl feature layer
	var vglLayer = map.createLayer(
		'feature',
		{
			renderer: 'vgl'
		}
	);

	// Load the data
	$.ajax({
		url: '50states.json',
		dataType: "json",
		success: function (data) {

			console.log(data);
			
			// var data = JSON.parse(_data.resonseText);

			data.features.forEach(function(feature){
				feature.properties.value = Math.random()*10;
			});

			makeChoropleth(data, vglLayer);
			// Draw the map
			map.draw();
		}
	});
});
