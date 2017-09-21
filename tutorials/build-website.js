var path = require('path');
var glob = require('glob').sync;
var fs = require('fs-extra');
var pug = require('pug');

// generate the tutorials
fs.ensureDirSync('website/source/tutorials');
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
    var output = path.resolve('website', 'source', 'tutorials', json.path);

    // create, empty, and copy the source directory
    fs.emptyDirSync(output);
    fs.copySync(dir, output);

    var pugTemplate = fs.readFileSync(path.relative('.', path.resolve(dir, 'index.pug')), 'utf8');
    pugTemplate = pugTemplate.replace('extends ../common/index.pug', 'extends ../common/index-website.pug');
    
    var fn = pug.compile(pugTemplate, {
      pretty: false,
      filename: path.relative('.', path.resolve(dir, 'index.pug'))
    });
    var html = fn(json);
    html = `---
layout: tutorial
title: ${json.title}
about: ${json.about.text}
tutorialCss: ${JSON.stringify(json.tutorialCss)}
tutorialJs: ${JSON.stringify(json.tutorialJs)}
---
` + html;
    fs.writeFileSync(path.resolve(output, 'index.html'),html);
    return json;
  });

// copy common files
fs.copySync('tutorials/common', 'website/source/tutorials/common');
