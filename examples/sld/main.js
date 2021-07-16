/* global colorbrewer */

var layer = {
  // Default values
  palette: 'YlGn',
  selectedNum: '3',
  type: 'continuous',
  min: '0',
  max: '300',
  name: 'usgs:ned',
  sld: '',
  projection: 'EPSG:3785'
};

var baseUrl = 'https://demo.boundlessgeo.com/geoserver/ows';

var layerViewer = {
  renderPalettes: function () {
    var paletteArray = Object.keys(colorbrewer);
    utility.populateDropdown('#palette', paletteArray);
  },
  renderWidget: function (layer) {
    // Populates the number of colors dropdown
    $('#color-count').empty();
    var numberArray = Object.keys(colorbrewer[layer.palette]);
    utility.populateDropdown('#color-count', numberArray);
    // Sets the count
    $('#color-count').val(layer.selectedNum);
    // Sets the type
    $('#palette-type').val(layer.type);
    // Sets the min and max values
    $('#min').val(layer.min);
    $('#max').val(layer.max);

    $('#name').val(layer.name);
    $('#projection').val(layer.projection);
    $('#baseurl').val(baseUrl);
  }
};

var layerController = {
  syncLayer: function (layer) {
    // Sync the model with UI
    layer.palette = $('#palette').val();

    var items = Object.keys(colorbrewer[layer.palette]);
    var maxNumber = parseInt(items[items.length - 1]);

    if (parseInt($('#color-count').val()) <= maxNumber) {
      layer.selectedNum = $('#color-count').val();
    } else {
      layer.selectedNum = String(maxNumber);
    }

    layer.type = $('#palette-type').val();
    layer.min = $('#min').val();
    layer.max = $('#max').val();
    layer.sld = this.generateSld(layer);

    layer.name = $('#name').val();
    layer.projection = $('#projection').val();
    baseUrl = $('#baseurl').val();
  },
  generateSld: function (layer) {
    // Orchestrates the sld generation
    var sequence = utility.generateSequence(layer.min, layer.max, layer.selectedNum);
    var palette_array = utility.getPalette(layer.palette, layer.selectedNum);
    var xml = utility.generateXml(
      layer.name, layer.selectedNum, sequence, palette_array, layer.type);
    return xml;
  }
};

// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    zoom: 9,
    center: {
      x: -77.0,
      y: 39
    }
  });
  // Add an OSM layer
  map.createLayer('osm');

  // Populate the palette dropdown
  layerViewer.renderPalettes();

  // Render the widget
  layerViewer.renderWidget(layer);

  // Generate sld
  layer.sld = layerController.generateSld(layer);

  // Add the wms layer
  var wms = utility.createWMSLayer(map, layer.sld, layer.projection, layer.name);

  // If any of the input boxes changes regenerate sld again
  $('#palette, #color-count, #min, #max, #palette-type, #baseurl, #projection, #name')
    .change(function () {
      layerController.syncLayer(layer);
      layerViewer.renderWidget(layer);

      map.deleteLayer(wms);

      wms = utility.createWMSLayer(map, layer.sld, layer.projection, layer.name);
    });

});

var utility = {
  // Some utility functions

  populateDropdown: function (dropdown, array) {
    // Populates the dropdown based on the array given
    $.each(array, function () {
      var option = document.createElement('option');
      $(dropdown)
        .append($(option)
          .attr('value', this)
          .html(this));
    });
  },
  generateSequence: function (start, stop, count) {
    // Generates a sequence of numbers with the given start,
    // stop and count variables
    var sequence = [];
    var step = (stop - start) / (count - 1.0);
    for (var i = 0; i < count; i++) {
      sequence.push(parseFloat(start + i * step));
    }
    return sequence;
  },
  getPalette: function (name, count) {
    // Gets the palette array with the given name and count parameters
    return colorbrewer[name][count];
  },
  createMapEntry: function (xml, color, value, opacity) {
    // Adds a color-quantity-opacity entry to the sld
    $(xml)
      .find('ColorMap')
      .append($('<ColorMapEntry>', xml)
        .attr({
          color: color,
          quantity: value,
          opacity: opacity
        }));
  },
  generateXml: function (name, count, values, palette, type) {
    // Generates the xml (sld) file with the given parameters
    var xml = $($.parseXML(
      '<?xml version="1.0" encoding="utf-8" ?><StyledLayerDescriptor />'
    ));
    $('StyledLayerDescriptor', xml)
      .attr({
        'version': '1.0.0',
        'xsi:schemaLocation': 'http://www.opengis.net/sld StyledLayerDescriptor.xsd',
        'xmlns': 'http://www.opengis.net/sld',
        'xmlns:ogc': 'http://www.opengis.net/ogc',
        'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
      });
    $('StyledLayerDescriptor', xml)
      .append($('<NamedLayer>', xml));
    $(xml)
      .find('NamedLayer')
      .append($('<Name>', xml))
      .append($(
        '<UserStyle>', xml));
    $(xml)
      .find('Name')
      .text(name);
    $(xml)
      .find('UserStyle')
      .append($('<Title>', xml))
      .append($(
        '<IsDefault>', xml))
      .append($('<FeatureTypeStyle>', xml));
    $(xml)
      .find('Title')
      .text('Custom Visualization');
    $(xml)
      .find('IsDefault')
      .text(1);
    $(xml)
      .find('FeatureTypeStyle')
      .append($('<Rule>', xml));
    $(xml)
      .find('Rule')
      .append($('<RasterSymbolizer>', xml));
    $(xml)
      .find('RasterSymbolizer')
      .append($('<ColorMap>', xml));

    if (type === 'discrete') {
      $(xml)
        .find('ColorMap')
        .attr({
          'type': 'intervals'
        });
    }

    for (var i = 0; i < count; i++) {
      this.createMapEntry(xml, palette[i], values[i], 1);
    }
    var xmlString = new XMLSerializer().serializeToString(xml[0]);

    return xmlString;
  },
  createWMSLayer: function (map, sld, projection, layer_name) {

    // Add an OSM layer with a WMS server as the source of its titles
    var wms = map.createLayer('osm', {
      keepLower: false,
      attribution: null
    });

    wms.url(function (x, y, zoom) {
      // Compute the bounding box
      var bb = wms.gcsTileBounds({
        x: x,
        y: y,
        level: zoom
      }, projection);
      var bbox_mercator = bb.left + ',' + bb.bottom + ',' +
        bb.right + ',' + bb.top;
      // Set the WMS server parameters
      var params = {
        'SERVICE': 'WMS',
        'VERSION': '1.3.0',
        'REQUEST': 'GetMap',
        'LAYERS': layer_name, // US Elevation
        'STYLES': '',
        'BBOX': bbox_mercator,
        'WIDTH': 256, //Use 256x256 tiles
        'HEIGHT': 256,
        'FORMAT': 'image/png',
        'TRANSPARENT': true,
        'SRS': projection,
        'TILED': true,
        'SLD_BODY': sld
      };
      // OpenGeo Demo Web Map Service
      return baseUrl + (baseUrl.indexOf('?') >= 0 ? '&' : '?') + $.param(params);
    });

    return wms;
  }
};
