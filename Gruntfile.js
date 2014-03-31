
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      files: ['src/**/*.js', 'package.json', 'Gruntfile.js', 'testing/spec/*spec.js'],
      tasks: ['shell', 'jasmine']
    },
    
    shell: {
      build: {
        command: [
          'cd build',
          'cmake ..',
          'make'
        ].join('&&'),
        options: {
          stdout: true
        }
      }
    },

    jasmine: {
      unittests: {
        src: [
          'build/deploy/testing/common/js/jquery-1.9.1.js',
          'build/deploy/testing/common/js/gl-matrix.js',
          'build/deploy/testing/common/js/d3.v3.min.js',
          'build/deploy/testing/common/js/proj4.js',
          'build/deploy/web/lib/vgl.min.js',
          'build/deploy/web/lib/geojs.min.js'
        ],
        options: {
          specs: 'testing/spec/*spec.js'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.registerTask('default', ['watch']);
};
