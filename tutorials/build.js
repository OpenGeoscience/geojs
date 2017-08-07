var path = require('path');
var glob = require('glob').sync;
var fs = require('fs-extra');
var pug = require('pug');

// generate the tutorials
fs.ensureDirSync('dist/tutorials');
glob('tutorials/*/tutorial.json')
  .map(function (f) {
    // /path/to/tutorial.json
    f = path.resolve(f);

    // content of tutorial.json
    var json = fs.readJSONSync(path.resolve(f));

    // directory of the tutorial
    var dir = path.dirname(f);

    // by default, assume the path is where the files are located.
    json.path = json.path || path.basename(dir);
    json.tutorialCss = json.tutorialCss || [];
    json.tutorialJs = json.tutorialJs || [];
    json.bundle = '../bundle.js';

    // the output directory where the tutorial will be compiled
    var output = path.resolve('dist', 'tutorials', json.path);

    // create, empty, and copy the source directory
    fs.emptyDirSync(output);
    fs.copySync(dir, output);

    var fn = pug.compileFile(path.relative('.', path.resolve(dir, 'index.pug')), {pretty: false});
    fs.writeFileSync(path.resolve(output, 'index.html'), fn(json));
    return json;
  });

  // copy common files
fs.copySync('tutorials/common', 'dist/tutorials/common');
