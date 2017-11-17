var path = require('path');
var fs = require('fs-extra');
var pug = require('pug');

var buildUtils = require('../examples/build-utils');

// generate the tutorials
fs.ensureDirSync('website/source/tutorials');
var tutorials = buildUtils.getList('tutorials', 'tutorial', path.resolve('website', 'source'));

tutorials.map(function (json) {
  var pugTemplate = fs.readFileSync(path.relative('.', path.resolve(json.dir, 'index.pug')), 'utf8');
  pugTemplate = pugTemplate.replace('extends ../common/index.pug', 'extends ../common/index-website.pug');

  var fn = pug.compile(pugTemplate, {
    pretty: false,
    filename: path.relative('.', path.resolve(json.dir, 'index.pug'))
  });
  var html = fn(json);
  html = html.replace(/<=/g, '&lt;=').replace(/>=/g, '&gt;=');
  html = `---
layout: tutorial
title: ${json.title}
about: ${json.about.text}
tutorialCss: ${JSON.stringify(json.tutorialCss)}
tutorialJs: ${JSON.stringify(json.tutorialJs)}
---
` + html;
  fs.writeFileSync(path.resolve(json.output, 'index.html'), html);
});

// copy common files
fs.copySync('tutorials/common', 'website/source/tutorials/common');

buildUtils.writeYamlList(path.resolve('website', 'source', '_data'), 'tutorials.yml', tutorials);
