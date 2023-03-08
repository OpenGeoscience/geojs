/*global env: true */

/* This is largely copied from jaguarjs-jsdoc's publish.js file.  The outdir
 * outdir does not have the package name and version appended to it, and we add
 * the git commit sha to the available information.
 */

/* Copy the jaguarjs-jsdoc template, then add in our own files. */
var fse = require('fs-extra');

fse.copySync('node_modules/docdash/tmpl', 'jsdoc/template/tmpl');
fse.copySync('node_modules/docdash/static', 'jsdoc/template/static');

Object.values(fse.readdirSync('jsdoc/template')).forEach(file => {
  if (file.endsWith('.tmpl')) {
    fse.copySync('jsdoc/template/' + file, 'jsdoc/template/tmpl/' + file);
  }
  fse.appendFileSync('jsdoc/template/static/styles/jsdoc.css', fse.readFileSync('jsdoc/template/style.css').toString());
});

/* Also get the git sha, if possible */

var gitsha, version;
try {
  gitsha = require('child_process').execSync('git rev-parse HEAD').toString().trim();
  version = require('child_process').execSync('git describe --tags').toString().trim().substr(1);
} catch (err) { }
env.conf.geojs = {gitsha: gitsha, version: version};

exports.publish = require('docdash/publish.js').publish;
