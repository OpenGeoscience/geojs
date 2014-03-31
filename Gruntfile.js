
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      files: ['src/**/*.js', 'package.json', 'Gruntfile.js'],
      tasks: ['shell']
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
    }
  });
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['watch']);
};
