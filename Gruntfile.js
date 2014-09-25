/* global module */

module.exports = function (grunt) {
  'use strict';

  var sources, geojsVersion, srcPath;

  geojsVersion = '0.1.0';

  sources = [
    'core/init.js',
    'core/version/js',
    'core/object.js',
    'core/sceneObject.js',
    'core/timestamp.js',
    'core/ellipsoid.js',
    'core/mercator.js',
    'core/latlng.js',
    'core/layer.js',
    'core/featureLayer.js',
    'core/event.js',
    'core/time.js',
    'core/fileReader.js',
    'core/jsonReader.js',
    'core/map.js',
    'core/feature.js',
    'core/pointFeature.js',
    'core/lineFeature.js',
    'core/pathFeature.js',
    'core/polygonFeature.js',
    'core/planeFeature.js',
    'core/geomFeature.js',
    'core/graphFeature.js',
    'core/transform.js',
    'core/renderer.js',
    'core/osmLayer.js',
    'gl/init.js',
    'gl/renderer.js',
    'gl/lineFeature.js',
    'gl/pointFeature.js',
    'gl/geomFeature.js',
    'gl/planeFeature.js',
    'gl/mapInteractorStyle.js',
    'gl/vglRenderer.js',
    'd3/init.js',
    'd3/object.js',
    'd3/pointFeature.js',
    'd3/lineFeature.js',
    'd3/pathFeature.js',
    'd3/graphFeature.js',
    'd3/d3Renderer.js'
  ];

  srcPath = 'src/';

  grunt.config.init({
    'pkg': grunt.file.readJSON('package.json'),

    'template': {
      'create-version': {
        'options': {
          'data': { 'GEOJS_VERSION': geojsVersion }
        },
        'files': {
          'src/core/version.js': [srcPath + 'core/version.js.in']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-template');

  grunt.registerTask('version', [
    'template:create-version'
  ]);
};
