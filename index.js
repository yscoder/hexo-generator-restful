'use strict';

var generator = require('./lib/generator');

hexo.extend.generator.register('restful', function(site) {
    return generator(Object.assign({}, hexo.config, hexo.theme.config), site);
});
