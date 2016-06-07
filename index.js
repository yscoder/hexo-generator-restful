'use strict';

var pagination = require('hexo-pagination');


hexo.extend.generator.register('restful', function(site) {
    var cfg = hexo.config,
        posts = site.posts.sort('-date').filter(function(post) {
            return post.published;
        }),
        postMap = function(post) {
            return {
                title: post.title,
                slug: post.slug,
                date: post.date,
                updated: post.updated,
                comments: post.comments,
                path: post.path,
                excerpt: post.excerpt,
                keywords: cfg.keywords,
                content: post.content,
                categories: post.categories.map(function(cat) {
                    return {
                        name: cat.name,
                        slug: cat.slug,
                        path: cat.permalink
                    };
                }),
                tags: post.tags.map(function(tag) {
                    return {
                        name: tag.name,
                        slug: tag.slug,
                        path: tag.permalink
                    };
                })
            };
        },
        cateReduce = function(cates, name) {
            return cates.reduce(function(result, item) {
                if (!item.length) return result;

                return result.concat(pagination(item.path, posts, {
                    perPage: 0,
                    data: {
                        name: item.name,
                        postlist: item.posts.map(postMap)
                    }

                }).map(function(item) {
                    var itemData = item.data;
                    return {
                        path: name + '/' + itemData.name + '.json',
                        data: JSON.stringify({
                            name: itemData.name,
                            postlist: itemData.postlist
                        })
                    };
                }));
            }, []);
        },
        postlist = posts.map(postMap),
        categories = cateReduce(site.categories, 'categories'),
        tags = cateReduce(site.tags, 'tags');

    return [{
        path: 'site.json',
        data: JSON.stringify(cfg)
    }, {
        path: 'posts.json',
        data: JSON.stringify(postlist)
    }].concat(categories).concat(tags);
});
