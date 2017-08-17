// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    zoom: 3
  });

  // Add the default osm layer
  // map.createLayer('osm');

  // Create a ui layer
  var ui = map.createLayer('ui');

  // Create a legend widget
  var legend = ui.createWidget('legend2d', {
    position: {
      right: 20,
      top: 10
    }
  });

  // Add rows to the legend
  //
  // The categories are displayed in the order passed as
  // a row on the legend.  The category objects should
  // contain the following properties:
  //
  //   * name: (string) The name/description
  //   * style: (object) The feature style object
  //   * type: (string) The feature type ('point', 'line', 'other')
  //
  
  legend.categories([
    {
      name: 'Discrete Ordinal 1',
      type: 'discrete',
      scale: 'ordinal',
      domain: ['beijing', 'new york', 'london', 'paris'],
      colors: ['red', 'green', 'blue', 'orange']
    },
    {
      name: 'Discrete countinous 1',
      type: 'discrete',
      scale: 'linear',
      domain: [100, 1000],
      colors: colorbrewer.YlGnBu['9']
    },
    {
      name: 'Discrete countinous 2',
      type: 'discrete',
      scale: 'sqrt',
      domain: [10000, 1000000],
      colors: colorbrewer.PRGn['11']
    },
    {
      name: 'Discrete countinous 3',
      type: 'discrete',
      scale: 'linear',
      domain: [0.1, 0.001],
      colors: colorbrewer.RdBu['8']
    },
    {
      name: 'Continuous continuous 1',
      type: 'continuous',
      scale: 'pow',
      domain: [100, 10000],
      colors: ['red', 'blue']
    },
    {
      name: 'Continuous continuous 2',
      type: 'continuous',
      scale: 'sqrt',
      domain: [100, 1000],
      colors: ['purple', 'orange']
    },
    {
      name: 'Continuous continuous 3',
      type: 'continuous',
      scale: 'log',
      domain: [100, 10000],
      colors: ['blue', 'olive']
    }
  ]);

});
