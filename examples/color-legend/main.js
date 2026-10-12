/* global colorbrewer */

// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    zoom: 3
  });

  // Add the default osm layer
  map.createLayer('osm');

  // Create a ui layer
  var ui = map.createLayer('ui');

  // Create a legend widget
  var legend = ui.createWidget('colorLegend', {
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
      name: 'Discrete ordinal',
      type: 'discrete',
      scale: 'ordinal',
      domain: ['beijing', 'new york', 'london', 'paris'],
      colors: ['red', 'green', 'blue', 'orange']
    },
    {
      name: 'Discrete linear',
      type: 'discrete',
      scale: 'linear',
      domain: [100, 1000],
      colors: colorbrewer.YlGnBu['9']
    },
    {
      name: 'Discrete sqrt',
      type: 'discrete',
      scale: 'sqrt',
      domain: [10000, 1000000],
      colors: colorbrewer.PRGn['11']
    },
    {
      name: 'Discrete quantile',
      type: 'discrete',
      scale: 'quantile',
      domain: [96, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 148, 152, 156, 160, 164, 168, 172, 176, 180, 184, 188, 192, 196, 200],
      colors: colorbrewer.Greens['8']
    },
    {
      name: 'Discrete linear 2',
      type: 'discrete',
      scale: 'linear',
      domain: [0.1, 0.001],
      colors: colorbrewer.RdBu['8'],
      endAxisLabelOnly: true
    },
    {
      name: 'Continuous pow',
      type: 'continuous',
      scale: 'pow',
      exponent: 1.1,
      domain: [100, 10000],
      colors: ['red', 'blue']
    },
    {
      name: 'Continuous sqrt',
      type: 'continuous',
      scale: 'sqrt',
      domain: [100, 1000],
      colors: ['purple', 'orange']
    },
    {
      name: 'Continuous log',
      type: 'continuous',
      scale: 'log',
      base: Math.E,
      domain: [100, 10000],
      colors: ['blue', 'olive']
    },
    {
      name: 'Continuous multicolor',
      type: 'continuous',
      scale: 'linear',
      domain: [100, 1000],
      colors: ['red', 'blue', 'green', 'orange']
    },
    {
      name: 'Continuous piecewise function',
      type: 'continuous',
      scale: 'sqrt',
      domain: [1000, 2000, 4000, 8000],
      colors: ['blue', 'orange', 'red', 'black'],
      endAxisLabelOnly: true
    }
  ]);

});
