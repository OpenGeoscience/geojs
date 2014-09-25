/* global module */

module.exports = function (grunt) {
  'use strict';

  var sources, geojsVersion, vgl, geo, port;

  geojsVersion = '0.1.0';
  sources = grunt.file.readJSON('sources.json');
  port = Number(grunt.option('port') || '8082');

  function moduleFiles(module) {
    var obj, files;

    obj = sources.modules[module];

    files = (obj.files || []).map(function (f) {
      if (obj.prefix) {
        f = obj.prefix + '/' + f;
      }
      return f;
    });

    return files;
  }

  vgl = moduleFiles('vgl');
  geo = {
    core: moduleFiles('geo.core'),
    gl: moduleFiles('geo.gl'),
    d3: moduleFiles('geo.d3')
  };

  grunt.config.init({
    pkg: grunt.file.readJSON('package.json'),

    template: {
      version: {
        options: {
          data: { GEOJS_VERSION: geojsVersion }
        },
        files: { 'src/core/version.js': 'src/core/version.js.in' }
      }
    },

    copy: {
      geo: {
        files: [
          {
            src: Array.prototype.concat(geo.core, geo.gl, geo.d3),
            dest: 'dist/',
            filter: 'isFile',
            flatten: false
          }
        ]
      },
      vgl: {
        files: [
          {
            src: vgl,
            dest: 'dist/src/vgl/',
            filter: 'isFile',
            flatten: true
          }
        ]
      }
    },

    uglify: {
      options: {
        sourceMap: true,
        sourceMapIncludeSources: true,
        report: 'min',
        beautify: true,
        mangle: false
      },

      geojs: {
        files: {
          'dist/built/geojs.min.js': Array.prototype.concat(
            vgl.map(function (f) { return 'src/vgl/' + f; }),
            geo.core,
            geo.gl,
            geo.d3
          ).map(function (f) {
            return 'dist/' + f;
          })
        }
      },

      ext: {
        files: {
          'dist/built/geojs.ext.min.js': [
            'node_modules/jquery-browser/lib/jquery.js',
            'node_modules/gl-matrix/dist/gl-matrix.js',
            'node_modules/d3-browser/lib/d3.js'
          ]
        }
      }
    },

    watch: {
      uglify: {
        files: [
          'src/**/*.js',
          'vgl/src/**/*.js',
          'src/core/version.js.in',
          'Gruntfile.js'
        ],
        tasks: ['clean:source', 'version', 'copy', 'uglify:geojs']
      }
    },

    clean: {
      source: [ 'dist/src', 'src/core/version.js' ],
      all: [ 'dist', 'src/core/version.js' ]
    },

    express: {
      server: {
        options: {
          port: port,
          bases: ['dist']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-template');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-express');

  grunt.registerTask('version', [
    'template:version'
  ]);

  grunt.registerTask('build', [
    'version',
    'copy',
    'uglify'
  ]);

  grunt.registerTask(
      'serve',
      'Serve the content at http://localhost:8082, ' +
      'use the --port option to override the default port',
      ['express', 'watch']
  );
};
