/* global module, require, process */

module.exports = function (grunt) {
  'use strict';

  var port;

  port = Number(grunt.option('port') || '8082');

  /* Pass a "--env=<value>" argument to grunt. Default value is "production"
   * --env=dev enables making source maps. */
  var environment = grunt.option('env') || 'production';

  grunt.config.init({
    env: grunt.option('env') || process.env.GRUNT_ENV || 'development',

    copy: {
      plugins: {
        files: [
          {
            cwd: 'src/',
            src: ['plugin/*.js'],
            dest: 'dist/',
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
      },
      redirect: {
        files: [{
          src: 'index.html',
          dest: 'dist/index.html'
        }]
      },
      bootstrap: {
        files: [
          {
            src: ['**'],
            dest: 'dist/examples/common/',
            expand: true,
            cwd: 'bower_components/bootstrap/dist/',
            filter: function (src) {
              return !src.match(/.*\.css$/);
            }
          },
          {
            src: ['*'],
            dest: 'dist/examples/common/css/',
            expand: true,
            cwd: 'bower_components/bootswatch/flatly'
          }
        ]
      },
      codemirror: {
        files: [
          {
            src: ['codemirror.css'],
            dest: 'dist/examples/common/css/',
            cwd: 'bower_components/codemirror/lib/',
            expand: true
          },
          {
            src: ['lint.css'],
            dest: 'dist/examples/common/css/',
            cwd: 'bower_components/codemirror/addon/lint/',
            expand: true
          },
          {
            src: ['foldgutter.css'],
            dest: 'dist/examples/common/css/',
            cwd: 'bower_components/codemirror/addon/fold/',
            expand: true
          }
        ]
      },
      jqueryui: {
        files: [
          {
            src: ['jquery-ui.min.js'],
            dest: 'dist/examples/common/js',
            cwd: 'bower_components/jquery-ui/',
            expand: true
          }
        ]
      }
    },

    uglify: {
      options: {
        sourceMap: environment === 'dev',
        sourceMapIncludeSources: true,
        report: 'min',
        beautify: {
          ascii_only: true,
          beautify: false
        },
        mangle: false
      },

      codemirror: {
        files: {
          'dist/examples/common/js/codemirror.js': [
            'bower_components/jsonlint/lib/jsonlint.js',
            'bower_components/codemirror/lib/codemirror.js',
            'bower_components/codemirror/mode/javascript/javascript.js',
            'bower_components/codemirror/mode/javascript/javascript.js',
            'bower_components/codemirror/addon/lint/lint.js',
            'bower_components/codemirror/addon/lint/json-lint.js',
            'bower_components/codemirror/addon/fold/brace-fold.js',
            'bower_components/codemirror/addon/fold/foldcode.js',
            'bower_components/codemirror/addon/fold/foldgutter.js',
            'bower_components/codemirror/addon/edit/matchbrackets.js'
          ]
        }
      }
    },

    express: {
      server: {
        options: {
          port: port,
          server: 'testing/test-runners/server.js',
          bases: ['dist']
        }
      }
    },

    jade: {
      options: {
        pretty: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-docco');

  var findExamples = function () {
    // create tasks for examples
    var examples = grunt.file.expand('examples/*/example.json');
    var exlist = examples.map(function (ex) {
      var path = require('path');
      var dir = path.dirname(ex);
      var exname = path.basename(dir);
      var data = grunt.file.readJSON(ex);

      // Use geo.js unless using the production environment.
      var geolib = '../../built/geo.js';
      if (grunt.config('env') === 'production') {
        geolib = '../../built/geo.min.js';
      }

      if (data.exampleJs.length) {
        data.docHTML = path.join(
          'doc',
          path.basename(data.exampleJs[0].replace('.js', '.html'))
        );
      }
      var target = {
        files: [
            {
              src: [
                path.join(dir, 'index.jade')
              ],
              dest: path.join('dist', dir, 'index.html'),
              expand: false
            }
        ],
        options: {
          data: function () {
            data.defaultCss = [
              '../common/css/bootstrap.min.css',
              '../common/css/examples.css'
            ];
            data.defaultJs = [
                {
                  src: '../../built/geo.ext.min.js',
                  charset: 'UTF-8',
                  type: 'text/javascript'
                },
              geolib,
              '../common/js/bootstrap.min.js',
              '../common/js/examples.js'
            ];
            return data;
          }
        }
      };
      grunt.config(['jade', exname], target);

      if (data.docHTML) {
        grunt.config(['docco', exname], {
          src: data.exampleJs.map(function (p) {
            return 'examples/' + exname + '/' + p;
          }),
          options: {
            output: path.join('dist', dir, 'doc'),
            layout: 'classic'
          }
        });
      }

      return data;
    });

    // configure the main examples page
    grunt.config(['jade', 'examples'], {
      files: [
          {
            src: ['examples/index.jade'],
            dest: 'dist/examples/index.html'
          }
      ],
      options: {
        data: {
          hideNavbar: false,
          defaultCss: [
            'common/css/bootstrap.min.css',
            'common/css/examples.css'
          ],
          defaultJs: [
            {src: '../built/geo.ext.min.js', charset: 'UTF-8', type: 'text/javascript'},
            'common/js/bootstrap.min.js',
            'common/js/examples.js'
          ],
          exampleCss: ['main.css'],
          exampleJs: ['main.js'],
          examples: exlist,
          title: 'GeoJS',
          about: {
            hidden: true
          }
        }
      }
    });
  };

  grunt.registerTask('docs', 'Build documentation', function () {
    var done = this.async();

    grunt.util.spawn({
      cmd: './node_modules/.bin/jsdoc',
      args: [
        '--pedantic',
        '-d',
        'dist/apidocs',
        '-r',
        'src'
      ]
    }, function (error, result, code) {
      if (error) {
        grunt.fail.warn('Could not build documentation:\n' + result.stderr);
      }

      done(code === 0);
    });
  });

  findExamples();
  grunt.registerTask('examples', [
    'copy:redirect',
    'copy:bootstrap',
    'copy:codemirror',
    'copy:examples',
    'copy:jqueryui',
    'uglify:codemirror',
    'jade',
    'docco'
  ]);

  grunt.registerTask('default', [
    'copy:plugins',
    'examples'
  ]);

  grunt.registerTask(
    'serve',
    'Serve the content at http://localhost:8082, ' +
    'use the --port option to override the default port',
    ['express', 'express-keepalive']
  );

  grunt.registerTask(
    'serve-test',
    'Serve the content for testing.  This starts on port 30100 by ' +
    'default and does not rebuild sources automatically.',
    function () {
      grunt.config.set('express.server.options.hostname', '0.0.0.0');
      if (!grunt.option('port')) {
        grunt.config.set('express.server.options.port', 30100);
      }
      // make sure express doesn't change the port
      var test_port = grunt.config.get('express.server.options.port');
      grunt.event.on('express:server:started', function () {
        if (grunt.config.get('express.server.options.port') !== test_port) {
          grunt.fail.fatal('Port ' + test_port + ' unavailable.');
        }
      });

      grunt.task.run(['express', 'express-keepalive']);
    }
  );
};
