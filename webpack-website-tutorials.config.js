var path = require('path');

var config = require('./webpack-tutorials.config.js');

config.entry.bundle = './tutorials/index-website.js';
config.output.path = path.join(__dirname, 'website', 'source', 'tutorials');

module.exports = config;
