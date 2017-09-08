hexo.extend.helper.register('page_url', function(path, options) {
    return this.url_for(path, options).replace(/index\.html$/, '');
});