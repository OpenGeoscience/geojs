hexo.extend.helper.register('page_url', function(path, options) {
    return this.url_for(path, options).replace(/index\.html$/, '');
});

var fs = require('hexo-fs');
hexo.extend.helper.register('fileExists', function(path) {
    return fs.existsSync(path);
});

