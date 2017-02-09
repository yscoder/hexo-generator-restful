'use strict';

var generator = require('./lib/generator');

hexo.extend.generator.register('restful', function(site) {
    let {config,theme:{config:themeConfig}} = hexo;
    return generator(Object.assign(config, themeConfig), site);
});
