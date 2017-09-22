var path = require('path');

var config = require('./webpack-examples.config.js');

config.entry.bundle = './examples/index-website.js';
config.output.path = path.join(__dirname, 'website', 'source', 'examples');

module.exports = config;
