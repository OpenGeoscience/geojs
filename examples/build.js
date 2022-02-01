var path = require('path');
var fs = require('fs-extra');
var docco = require('docco').document;
var pug = require('pug');

var buildUtils = require('./build-utils');

// generate the examples
fs.ensureDirSync('dist/examples');
var examples = buildUtils.getList('examples', 'example', 'dist');

examples.forEach(function (json) {
  // make docco documentation in:
  //   dist/examples/<name>/docs/
  if (json.exampleJs.length) {
    const options = {
      args: [json.main],
      opts: () => ({
        output: path.resolve(json.output, 'docs'),
        layout: 'classic'
      })
    };
    docco(options, buildUtils.fixupDocco(options.args[0], json.output));
  }
  (json.docJs || []).forEach(function (name) {
    const options = {
      args: [path.resolve(json.dir, name)],
      opts: () => ({
        output: path.resolve(json.output, 'docs'),
        layout: 'classic'
      })
    };
    docco(options, buildUtils.fixupDocco(options.args[0], json.output));
  });
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
