var path = require('path');
var glob = require('glob').sync;
var fs = require('fs-extra');
var docco = require('docco').document;
var pug = require('pug');

// generate the examples
fs.ensureDirSync('website/source/examples');
glob('examples/*/example.json')
  .map(function (f) {
    // /path/to/example.json
    f = path.resolve(f);

    // content of example.json
    var json = fs.readJSONSync(path.resolve(f));

    // directory of the example
    var dir = path.dirname(f);

    // by default, assume the path is where the files are located
    json.path = json.path || path.basename(dir);
    json.exampleCss = json.exampleCss || [];
    json.exampleJs = json.exampleJs || [];

    // the main js file for the example
    var main = path.resolve(dir, json.exampleJs[0]);

    // the output directory where the example will be compiled
    var output = path.resolve('website', 'source', 'examples', json.path);

    // create, empty, and copy the source directory
    fs.emptyDirSync(output);
    fs.copySync(dir, output);

    // make docco documentation in:
    //   dist/examples/<name>/docs/
    if (json.exampleJs.length) {
      docco({
        args: [main],
        output: path.resolve(output, 'docs'),
        layout: 'classic'
      }, function () {
        // simplify the docco output to reduce the output size by
        // removing the unnecessary public/ directory
        fs.removeSync(path.resolve(output, 'docs', 'public'));
      });
    }
    json.docHTML = 'docs/' + path.basename(main).replace(/js$/, 'html');

    json.bundle = '../bundle.js';

    var pugTemplate = '';
    var pugFile = path.relative('.', path.resolve(dir, 'index.pug'));
    if (fs.existsSync(path.resolve(dir, 'index.pug'))) {
      pugTemplate = fs.readFileSync(pugFile, 'utf8');
      pugTemplate = pugTemplate.replace('extends ../common/index.pug', '');
      pugTemplate = pugTemplate.replace('block append mainContent', '');
    }
    pugTemplate = `
|---
|layout: example
|title: ${json.title}
|about: ${json.about.text}
|exampleCss: ${JSON.stringify(json.exampleCss)}
|exampleJs: ${JSON.stringify(json.exampleJs)}
|---
|
div` + pugTemplate;

    var fn = pug.compile(pugTemplate, { pretty: false });
    fs.writeFileSync(path.resolve(output, 'index.html'), fn(json));
    return json;
  });

