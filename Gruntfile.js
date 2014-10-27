/* global module, require */

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
    init: moduleFiles('geo.init'),
    util: moduleFiles('geo.util'),
    core: moduleFiles('geo.core'),
    gl: moduleFiles('geo.gl'),
    d3: moduleFiles('geo.d3'),
    ui: moduleFiles('geo.ui')
  };

  sourceList = Array.prototype.concat(
    vgl.files.map(function (f) { return 'src/vgl/' + f; }),
    geo.init,
    geo.util,
    geo.core,
    geo.gl,
    geo.d3,
    geo.ui
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
            src: Array.prototype.concat(
              geo.init,
              geo.util,
              geo.core,
              geo.gl,
              geo.d3,
              geo.ui
            ),
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
      },
      examples: {
        files: [
          {
            src: ['examples/**/*'],
            dest: 'dist/',
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
            'bower_components/jquery/dist/jquery.js',
            'bower_components/jquery-mousewheel/jquery.mousewheel.js',
            'bower_components/gl-matrix/dist/gl-matrix.js',
            'bower_components/proj4/dist/proj4-src.js',
            'bower_components/d3/d3.js'
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
      },
      examples: {
        files: [
          'examples/**/*'
        ],
        tasks: ['examples']
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
    },

    jade: {
      options: {
        pretty: true,
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-template');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-express');

  // create tasks for examples
  var examples = grunt.file.expand('examples/*/example.json');
  examples.forEach(function (ex) {
    var path = require('path');
    var dir = path.dirname(ex);
    var exname = path.basename(dir);
    var target = {
      files: [
        {
          src: [
            'examples/common/templates/index.jade',
            path.join(dir, 'index.jade')
          ],
          dest: path.join('dist', dir, 'index.html'),
          expand: false
        }
      ],
      options: {
        data: function () {
          var data = grunt.file.readJSON(ex);
          data.defaultCss = [
            '//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css',
            '//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap-theme.min.css'
          ];
          data.defaultJs = [
            '/built/geo.ext.min.js',
            '/built/geo.min.js',
            '//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js'
          ];
          return data;
        }
      }
    };
    grunt.config(['jade', exname], target);
  });

  grunt.registerTask('examples', [
    'copy:examples',
    'jade'
  ]);

  grunt.registerTask('library', [
    'template',
    'uglify:geojs'
  ]);

  grunt.registerTask('init', [
    'uglify:ext'
  ]);

  grunt.registerTask('dev', [
    'copy:geo',
    'copy:vgl'
  ]);

  grunt.registerTask('default', [
    'init',
    'library',
    'dev',
    'examples'
  ]);

  grunt.registerTask(
      'serve',
      'Serve the content at http://localhost:8082, ' +
      'use the --port option to override the default port',
      ['express', 'watch']
  );
};
