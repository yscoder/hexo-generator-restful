# hexo-generator-restful

Generate restful json data for Hexo plugins.

生成 restful 风格的 json 数据，可以当作 api 接口，开始构建一个 SPA 应用吧。

## Install

```bash
npm install hexo-generator-restful --save
```

## Config

以下为默认配置，属性值为 `false` 表示不生成。

```yml
restful:
  # site 可配置为数组选择性生成某些属性
  # site: ['title', 'subtitle', 'description', 'author', 'since', email', 'favicon', 'avatar']
  site: true        # hexo.config mix theme.config
  posts_size: 10    # 文章列表分页，0 表示不分页
  posts_props:      # 文章列表项的需要生成的属性
    title: true
    slug: true
    date: true
    updated: true
    comments: true
    path: true
    excerpt: false
    cover: true      # 封面图，取文章第一张图片
    content: false
    keywords: false
    categories: true
    tags: true
  categories: true  # 分类数据
  tags: true        # 标签数据
  post: true        # 文章数据
  pages: false      # 额外的 Hexo 页面数据, 如 About
```

## Document

### Get Hexo Config

获取所有 Hexo 配置（站点配置和主题配置）。

###### Request

```
GET /api/site.json
```

###### Response

[/api/site.json](http://www.imys.net/api/site.json)

### Get Posts

如果配置 `posts_size: 0` 则不分页，以下请求会获取全部文章。

###### Request

```
GET /api/posts.json
```

###### Response

示例为分页配置下的数据，会包含分页属性 `total`、`pageSize`、`pageCount`，不分页的数据不包含这三项。

[/api/posts.json](http://www.imys.net/api/posts.json)

### Get Posts By Page

获取分页数据

###### Request

```
GET /api/posts/:PageNum.json
```

###### Response

[/api/posts/1.json](http://www.imys.net/api/posts/1.json)

### Get All Tags

获取所有文章标签，如果文章无标签则不生成。

###### Request

```
GET /api/tags.json
```

###### Response

[/api/tags.json](http://www.imys.net/api/tags.json)

### Get Posts By Tag

获取某一标签下的所有文章

###### Request

```
GET /api/tags/:TagName.json
```

###### Response

[/api/tags/Hexo.json](http://www.imys.net/api/tags/Hexo.json)

### Get All Categories

获取所有文章分类，如果文章无分类则不生成。

###### Request

```
GET /api/categories.json
```

###### Response

数据格式同 Get All Tags

### Get Posts By Categorie

获取某一分类下的所有文章

###### Request

```
GET /api/categories/:CategorieName.json
```

###### Response

数据格式同 Get Posts By Tag

### Get Post By Slug

根据文章别名获取文章详细信息

###### Request

```
GET /api/articles/:Slug.json
```

###### Response

[/api/articles/javascript-advanced-functions.json](http://www.imys.net/api/articles/javascript-advanced-functions.json)

### Get Implecit Pages

获取来自主题的 Hexo 隐式页面内容，如 About 等。因隐式页面（除 About 等导航栏入口页外）一般在 Hexo 不提供直接访问入口，调用此 API 的开发者需要了解其完整路径，此接口默认关闭。

例如: 

###### Request

```
GET /api/pages/about.json
```

###### Response

格式类似于于 Get Post By Slug。