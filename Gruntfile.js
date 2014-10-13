/* global module */

module.exports = function (grunt) {
  'use strict';

  var sources, geojsVersion, vgl, geo, port, sourceList, templateData, pkg;

  pkg = grunt.file.readJSON('package.json');
  geojsVersion = pkg.version;
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

  vgl = sources.modules.vgl;
  geo = {
    core: moduleFiles('geo.core'),
    gl: moduleFiles('geo.gl'),
    d3: moduleFiles('geo.d3')
  };

  sourceList = Array.prototype.concat(
    vgl.files.map(function (f) { return 'src/vgl/' + f; }),
    geo.core,
    geo.gl,
    geo.d3
  );

  templateData = {
    GEOJS_VERSION: geojsVersion,
    SOURCES_JSON: JSON.stringify(sourceList),
    SOURCES_ROOT: '/',
    BUNDLE_EXT: 'built/geo.ext.min.js',
    BUNDLE_GEO: 'built/geo.min.js'
  };

  grunt.config.init({
    pkg: pkg,

    template: {
      version: {
        options: {
          data: templateData
        },
        files: { 'src/core/version.js': 'src/core/version.js.in' }
      },
      loadDev: {
        options: {
          data: templateData
        },
        files: { 'dist/built/geo.all.dev.js': 'src/geo.all.dev.js.in' }
      },
      loadAll: {
        options: {
          data: templateData
        },
        files: { 'dist/built/geo.all.js': 'src/geo.all.js.in' }
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
            src: vgl.files,
            dest: 'dist/src/vgl/',
            filter: 'isFile',
            cwd: 'vgl/src/',
            expand: true
          }
        ]
      }
    },

    uglify: {
      options: {
        sourceMap: true,
        sourceMapIncludeSources: true,
        report: 'min',
        beautify: {
          ascii_only: true,
          beautify: true
        },
        mangle: false
      },

      geojs: {
        files: {
          'dist/built/geo.min.js': sourceList.map(function (f) {
            return 'dist/' + f;
          })
        }
      },

      ext: {
        files: {
          'dist/built/geo.ext.min.js': [
            'node_modules/jquery-browser/lib/jquery.js',
            'node_modules/jquery-mousewheel/jquery.mousewheel.js',
            'node_modules/gl-matrix/dist/gl-matrix.js',
            'node_modules/proj4/dist/proj4-src.js',
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
          'Gruntfile.js',
          'sources.json'
        ],
        tasks: ['clean:source', 'template', 'copy', 'uglify:geojs']
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

  grunt.registerTask('default', [
    'template',
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
