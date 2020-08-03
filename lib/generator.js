'use strict';

var pagination = require('hexo-pagination');
var _pick = require('lodash.pick');

function filterHTMLTags(str) {
    return str ? str
            .replace(/\<(?!img|br).*?\>/g, "")
            .replace(/\r?\n|\r/g, '')
            .replace(/<img(.*)>/g, ' [Figure] ') : null
}
function fetchCovers(str) {
    var temp,
        imgURLs = [],
        rex = /<img[^>]+src="?([^"\s]+)"(.*)>/g;
    while ( temp = rex.exec( str ) ) {
        imgURLs.push( temp[1] );
    }
    return imgURLs.length > 0 ? imgURLs : null;
}
function fetchCover(str) {
    var covers = fetchCovers(str)
    return covers ? covers[0] : null; 
}
/*
* Return
*    true: <RelativePath> found in <config.restful.pages_exclude>
*   false: <RelativePath> not found in <config.restful.pages_exclude>
*/ 
function isExclude(RelativePath, config) {
  if (!config.pages_exclude) return false;
  const P_exclude = config.pages_exclude;
  const exclude = P_exclude;  
  if (P_exclude && !Array.isArray(P_exclude)) {
    exclude = [P_exclude];
  }
  // 404/index.md =>  ["404","index.md"]
  const RPArr = RelativePath.split("/");
  const RPStr = RPArr[0];

  if (exclude && exclude.length) {
    for (const i of exclude) {
      if (RPStr.toLowerCase() === i.toLowerCase()) return true;
    }
  }
  return false;
}

module.exports = function (cfg, site) {

    var restful = cfg.hasOwnProperty('restful') ? cfg.restful :
        {
            site: true,
            posts_size: 10,
            posts_props: {
                title: true,
                slug: true,
                date: true,
                updated: true,
                comments: true,
                cover: true,
                path: true,
                raw: false,
                excerpt: false,
                content: false,
                categories: true,
                tags: true
            },
            categories: true,
            use_category_slug: false,
            tags: true,
            use_tag_slug: false,
            post: true,
            pages: false,
        },

        posts = site.posts.sort('-date').filter(function (post) {
            return post.published;
        }),

        posts_props = (function () {
            var props = restful.posts_props;

            return function (name, val) {
                return props[name] ? (typeof val === 'function' ? val() : val) : null;
            }
        })(),

        postMap = function (post) {
            return {
                title: posts_props('title', post.title),
                slug: posts_props('slug', post.slug),
                date: posts_props('date', post.date),
                updated: posts_props('updated', post.updated),
                comments: posts_props('comments', post.comments),
                path: posts_props('path', 'api/articles/' + post.slug + '.json'),
                excerpt: posts_props('excerpt', filterHTMLTags(post.excerpt)),
                keywords: posts_props('keywords', cfg.keywords),
                // cover: posts_props('cover',  fetchCover(post.content)),
                cover: posts_props('cover', post.cover || fetchCover(post.content)),
                content: posts_props('content', post.content),
                raw: posts_props('raw', post.raw),
                categories: posts_props('categories', function () {
                    return post.categories.map(function (cat) {
                        const name = (
                            cfg.restful.use_category_slug && cat.slug
                        ) ? cat.slug : cat.name;
                        return {
                            name: name,
                            path: 'api/categories/' + name + '.json'
                        };
                    });
                }),
                tags: posts_props('tags', function () {
                    return post.tags.map(function (tag) {
                        const name = (
                            cfg.restful.use_tag_slug && tag.slug
                        ) ? tag.slug : tag.name;
                        return {
                            name: name,
                            path: 'api/tags/' + name + '.json'
                        };
                    });
                })
            };
        },

        cateReduce = function (cates, kind) {
            return cates.reduce(function (result, item) {
                if (!item.length) return result;

                let use_slug = null;
                switch (kind) {
                    case 'categories':
                        use_slug = cfg.restful.use_category_slug;
                        break;
                    case 'tags':
                        use_slug = cfg.restful.use_tag_slug;
                        break;
                }

                const name = (use_slug && item.slug) ? item.slug : item.name;

                return result.concat(pagination(item.path, posts, {
                    perPage: 0,
                    data: {
                        name: name,
                        path: 'api/' + kind + '/' + name + '.json',
                        postlist: item.posts.map(postMap)
                    }

                }));
            }, []);
        },

        catesMap = function (item) {
            return {
                name: item.data.name,
                path: item.data.path,
                count: item.data.postlist.length
            };
        },

        cateMap = function (item) {
            var itemData = item.data;
            return {
                path: itemData.path,
                data: JSON.stringify({
                    name: itemData.name,
                    postlist: itemData.postlist
                })
            };
        },

        apiData = [];


    if (restful.site) {
        apiData.push({
            path: 'api/site.json',
            data: JSON.stringify(restful.site instanceof Array ? _pick(cfg, restful.site) : cfg)
        });
    }

    if (restful.categories) {

        var cates = cateReduce(site.categories, 'categories');

        if (!!cates.length) {
            apiData.push({
                path: 'api/categories.json',
                data: JSON.stringify(cates.map(catesMap))
            });

            apiData = apiData.concat(cates.map(cateMap));
        }

    }

    if (restful.tags) {
        var tags = cateReduce(site.tags, 'tags');

        if (tags.length) {
            apiData.push({
                path: 'api/tags.json',
                data: JSON.stringify(tags.map(catesMap))
            });

            apiData = apiData.concat(tags.map(cateMap));
        }

    }

    var postlist = posts.map(postMap);

    if (restful.posts_size > 0) {

        var page_posts = [],
            i = 0,
            len = postlist.length,
            ps = restful.posts_size,
            pc = Math.ceil(len / ps);

        for (; i < len; i += ps) {
            page_posts.push({
                path: 'api/posts/' + Math.ceil((i + 1) / ps) + '.json',
                data: JSON.stringify({
                    total: len,
                    pageSize: ps,
                    pageCount: pc,
                    data: postlist.slice(i, i + ps)
                })
            });
        }

        apiData.push({
            path: 'api/posts.json',
            data: page_posts[0].data
        });

        apiData = apiData.concat(page_posts);

    } else {

        apiData.push({
            path: 'api/posts.json',
            data: JSON.stringify(postlist)
        });
    }

    if (restful.post) {
        apiData = apiData.concat(posts.map(function (post) {
            var path = 'api/articles/' + post.slug + '.json';
            return {
                path: path,
                data: JSON.stringify({
                    title: post.title,
                    slug: post.slug,
                    date: post.date,
                    updated: post.updated,
                    comments: post.comments,
                    path: path,
                    excerpt: filterHTMLTags(post.excerpt),
                    covers: fetchCovers(post.content),
                    keywords: cfg.keyword,
                    content: post.content,
                    more: post.more,
                    categories: post.categories.map(function (cat) {
                        return {
                            name: cat.name,
                            path: 'api/categories/' + cat.name + '.json'
                        };
                    }),
                    tags: post.tags.map(function (tag) {
                        return {
                            name: tag.name,
                            path: 'api/tags/' + tag.name + '.json'
                        };
                    })
                })
            };
        }));
    }

    if (restful.pages) {
        apiData = apiData.concat(site.pages.data.map(function (page) {
            if (!isExclude(page.source, restful)) {				
				/* <page.source> not found in <config.restful.pages_exclude> */
				//console.log('INFO  Path:' + page.source);    //404/index.md 
				//var safe_title = page.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()            
				var page_filename = page.source.replace(/\/index.md/gi, '').toLowerCase();
				var path = 'api/pages/' + page_filename + '.json';

				return {
					path: path,
					data: JSON.stringify({
						title: page.title,
						date: page.date,
						updated: page.updated,
						comments: page.comments,
						path: path,
						covers: fetchCovers(page.content),
						excerpt: filterHTMLTags(page.excerpt),
						content: page.content
					})
				};
			}
        }));
    }

    return apiData;
};
