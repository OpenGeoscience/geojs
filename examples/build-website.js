var path = require('path');
var fs = require('fs-extra');
var docco = require('docco').document;
var pug = require('pug');

var buildUtils = require('./build-utils');

// generate the examples
fs.ensureDirSync('website/source/examples');
var examples = buildUtils.getList('examples', 'example', path.resolve('website', 'source'));
examples.forEach(function (json) {
  // make docco documentation in:
  //   dist/examples/<name>/docs/
  if (json.main) {
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

  var pugTemplate = '';
  var pugFile = path.relative('.', path.resolve(json.dir, 'index.pug'));
  if (fs.existsSync(path.resolve(json.dir, 'index.pug'))) {
    pugTemplate = fs.readFileSync(pugFile, 'utf8');
    pugTemplate = pugTemplate.replace('extends ../common/index.pug', '');
    pugTemplate = pugTemplate.replace('block append mainContent', '');
  }
  pugTemplate = 'div' + pugTemplate;

  var fn = pug.compile(pugTemplate, { pretty: false });
  var html = fn(json);
  html = `---
layout: example
title: ${json.title}
about: ${json.about.text}
exampleCss: ${JSON.stringify(json.exampleCss)}
exampleJs: ${JSON.stringify(json.exampleJs)}
---
` + html;
  fs.writeFileSync(path.resolve(json.output, 'index.html'), html);
});

// copy common files
fs.copySync('examples/common', 'website/source/examples/common');

buildUtils.writeYamlList(path.resolve('website', 'source', '_data'), 'examples.yml', examples);
