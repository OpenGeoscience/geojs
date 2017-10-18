var path = require('path');
var fs = require('fs-extra');
var docco = require('docco').document;
var pug = require('pug');

var buildUtils = require('./build-utils');

// generate the examples
fs.ensureDirSync('dist/examples');
var examples = buildUtils.getList('examples', 'example', 'dist');

examples.map(function (json) {
  // make docco documentation in:
  //   dist/examples/<name>/docs/
  if (json.exampleJs.length) {
    docco({
      args: [json.main],
      output: path.resolve(json.output, 'docs'),
      layout: 'classic'
    }, function () {
      // simplify the docco output to reduce the output size by
      // removing the unnecessary public/ directory
      fs.removeSync(path.resolve(json.output, 'docs', 'public'));
    });
  }
  json.docHTML = 'docs/' + path.basename(json.main).replace(/js$/, 'html');

  var pugFile = path.relative('.', path.resolve(json.dir, 'index.pug'));
  if (!fs.existsSync(path.resolve(json.dir, 'index.pug'))) {
    pugFile = path.relative('.', path.resolve(json.dir, '../common/index.pug'));
  }
  var fn = pug.compileFile(pugFile, {pretty: true});
  fs.writeFileSync(path.resolve(json.output, 'index.html'), fn(json));
});

// copy common files
fs.copySync('examples/common', 'dist/examples/common');

// create the main example page
var data = {
  hideNavbar: false,
  exampleCss: ['main.css'],
  exampleJs: ['main.js'],
  examples: examples,
  bundle: './bundle.js',
  about: {hidden: true},
  title: 'GeoJS'
};

// copy assets for the main page
fs.copySync('examples/main.js', 'dist/examples/main.js');
fs.copySync('examples/main.css', 'dist/examples/main.css');

var fn = pug.compileFile('./examples/index.pug', {pretty: true});
fs.writeFileSync(
  path.resolve('dist', 'examples', 'index.html'),
  fn(data)
);
