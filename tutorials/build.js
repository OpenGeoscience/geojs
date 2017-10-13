var path = require('path');
var fs = require('fs-extra');
var pug = require('pug');

var buildUtils = require('../examples/build-utils');

// generate the tutorials
fs.ensureDirSync('dist/tutorials');
var tutorials = buildUtils.getList('tutorials', 'tutorial', 'dist');

tutorials.map(function (json) {
  var fn = pug.compileFile(path.relative('.', path.resolve(json.dir, 'index.pug')), {pretty: true});
  fs.writeFileSync(path.resolve(json.output, 'index.html'), fn(json));
});

// copy common files
fs.copySync('tutorials/common', 'dist/tutorials/common');

// create the main tutorial page
var data = {
  hideNavbar: false,
  tutorialCss: ['main.css'],
  tutorialJs: ['main.js'],
  tutorials: tutorials,
  bundle: './bundle.js',
  about: {hidden: true},
  title: 'GeoJS'
};

// copy assets for the main page
fs.copySync('tutorials/main.js', 'dist/tutorials/main.js');
fs.copySync('tutorials/main.css', 'dist/tutorials/main.css');

var fn = pug.compileFile('./tutorials/index.pug', {pretty: true});
fs.writeFileSync(
  path.resolve('dist', 'tutorials', 'index.html'),
  fn(data)
);
