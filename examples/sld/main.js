function generateSequence(start, stop, count) {
  // Generates a sequence of numbers with the given start,
  // stop and count variables
  var sequence = [];
  var step = (stop - start) / (count - 1.0);
  for (var i = 0; i < count; i++) {
    sequence.push(parseFloat(start + i * step));
  }
  return sequence;
}

function getPalette(name, count) {
  // Gets the palette array with the given name and count parameters
  return colorbrewer[name][count];
}

function createMapEntry(xml, color, value, opacity) {
  // Adds a color-quantity-opacity entry to the sld
  $(xml)
    .find('ColorMap')
    .append($('<ColorMapEntry>', xml)
      .attr({
        color: color,
        quantity: value,
        opacity: opacity
      }));
}

function generateXml(name, count, values, palette, type) {
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

  if (type.val() === 'discrete') {
    $(xml)
      .find('ColorMap')
      .attr({
        'type': 'intervals'
      });
  }

  for (var i = 0; i < count; i++) {
    createMapEntry(xml, palette[i], values[i], 1);
  }
  var xmlString = (new XMLSerializer())
    .serializeToString(xml.context);

  return xmlString;
}

function generateSld(layer_name, palette_name, count, min, max, type) {
  // Orchestrates the sld generation
  var sequence = generateSequence(min, max, count);
  var palette_array = getPalette(palette_name, count);
  var xml = generateXml(layer_name, count, sequence,
    palette_array, type);
  return xml;
}

function createWMSLayer(map, sld, projection, layer_name) {

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
    var baseUrl =
      'http://demo.boundlessgeo.com/geoserver/ows';
    return baseUrl + '?' + $.param(params);
  });

  return wms;

}

// Run after the DOM loads
$(function () {
  'use strict';
  // Create a map object
  var map = geo.map({
    node: '#map',
    zoom: 8,
    center: {
      x: -76.0,
      y: 39
    }
  });
  // Add an OSM layer
  map.createLayer('osm', {
    baseUrl: 'http://otile1.mqcdn.com/tiles/1.0.0/sat'
  });

  var projection = 'EPSG:3857';

  var palette_name = $('#color-palette')
    .val();
  var count = $('#color-count')
    .val();
  var min = $('#min')
    .val();
  var max = $('#max')
    .val();
  var layer_name = 'usgs:ned';

  var type = $('#palette-type');

  var sld = generateSld(layer_name, palette_name, count, min, max,
    type);

  var wms = createWMSLayer(map, sld, projection, layer_name);

  // If any of the input boxes changes regenerate sld again
  $('#color-palette, #color-count, #min, #max, #palette-type')
    .change(function () {

      palette_name = $('#color-palette')
        .val();
      count = $('#color-count')
        .val();
      min = $('#min')
        .val();
      max = $('#max')
        .val();

      sld = generateSld(layer_name, palette_name, count, min,
        max, type);

      map.deleteLayer(wms);

      wms = createWMSLayer(map, sld, projection, layer_name);

    });

});
