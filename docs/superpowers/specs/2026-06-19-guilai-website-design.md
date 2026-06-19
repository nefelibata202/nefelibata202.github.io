# 「归来」(Guī Lái) 个人网站 — 设计文档

- **日期**: 2026-06-19
- **状态**: 已定稿,待实现
- **作者**: Evan + Claude

## 1. 定位与目标

个人**写作博客 + 数字花园**。内容来自 Evan 的 Obsidian PKM 库管道(`compose` skill 产出 Markdown 草稿),手动拷入本仓库发布。

核心目标:
- 一个长期生长的个人内容空间,博客(时间线)与花园(网络化笔记)并存。
- 极简、内容为王、加载快、可长期维护。
- 后期可平滑加入动效与交互,不被架构锁死。

## 2. 技术架构

- **Astro**(轻量 SSG) + Content Collections。
- 纯 `.astro` 组件,不引入前端框架;**零客户端 JS 起步**,纯静态输出。
- Markdown 由 Astro 内置渲染(不再用 marked.js 客户端渲染)。
- 集成(纳入 MVP,成本低收益高):
  - `@astrojs/sitemap` — SEO 站点地图
  - `@astrojs/rss` — 博客订阅 `/rss.xml`
- **暂不做**(留到后期):站内搜索、评论、图谱视图、深浅色切换。

### 关于"静态"与未来动态能力(设计依据)

"静态输出"指 HTML 构建期生成,**不限制浏览器端的交互与动效**:
- 客户端动效/交互:在 `.astro` 中写 `<script>` / CSS 即可。
- 复杂交互组件:Astro Islands,局部嵌入 React/Vue/Svelte + `client:*` 指令。
- 页面过渡:Astro View Transitions(内置)。
- 静态友好功能:Pagefind 搜索(构建期索引)、第三方评论服务。
- 唯一边界:真正的服务端动态(按请求查库/登录/表单后端)需 SSR。Astro 可切 SSR/混合模式而不重写,但 GitHub Pages 只托静态——届时换托管(Vercel/Cloudflare)即可。

## 3. 内容模型

三类内容:

### 3.1 博客文章 — `src/content/articles/*.md`
frontmatter:
```yaml
title: string
date: date           # 发布日期
tags: string[]
summary: string      # 列表/SEO 摘要
draft: boolean       # 默认 false;true 不发布
```

### 3.2 花园笔记 — `src/content/garden/*.md`
frontmatter:
```yaml
title: string
updated: date        # 最近更新日期(花园重"生长"而非首发)
tags: string[]
```
正文中保留 `[[wikilink]]` 双向链接语法。

### 3.3 收藏/资源 — `src/data/favorites.json`
书籍与影视两组。条目字段:
```yaml
type: "book" | "movie"
title: string
creator: string      # 作者 / 导演
rating: number       # ★ 评分(如 1-5)
date: string         # 读/看完日期
note: string         # 一句话感想(可选)
```

## 4. 页面与路由

| 路由 | 内容 |
|---|---|
| `/` | 首页:一句话介绍 + 最近文章 + 最近花园更新 |
| `/articles` | 文章列表(按时间,可按 tag/年份筛) |
| `/articles/[slug]` | 文章全文 |
| `/garden` | 花园笔记集(按 tag/主题组织) |
| `/garden/[slug]` | 笔记全文,**页底显示反向链接** |
| `/tags/[tag]` | 标签聚合页 |
| `/about` | 关于(你是谁、联系方式) |
| `/collections` | 收藏:书籍 + 影视,带 ★ 评分,可按类型切 |
| `/rss.xml` | 博客订阅 |

URL slug 一律用**英文**(如 `/articles/on-focus`),更稳定。

## 5. 双向链接实现

- **remark 插件**(构建期):把正文中的 `[[笔记标题]]` 解析为站内链接,resolver 把标题映射到对应 slug。
- **反链表**(构建期工具):扫描全部 garden(及文章)正文的内部链接,建「slug → 谁链接了我」映射,注入每篇页底的 backlinks 区。
- 纯构建期计算,**运行时零开销**;不引入图谱视图(留后期)。

## 6. 设计(方案 A · 极简文字优先)

- 系统无衬线字体,黑白为主基调。
- 单栏阅读列,正文宽约 680px,大留白。
- 标签为细描边小 chip;列表项用细下边框分隔。
- 门面克制,内容为王。
- 排版细节待 Evan 提供参考站后迭代。

## 7. 部署

- **GitHub Pages + GitHub Actions**:push 自动构建发布。
- 仓库用普通命名(如 `my-website`)。
- **绑定自定义域名**(后期):域名下站点在根路径 `/`,故 Astro **无需配 `base`**;`site` 设为自定义域名(配置先留占位,Evan 填入)。通过 `CNAME` 文件绑定。

## 8. 发布流程(MVP)

1. Evan 在 Obsidian 库内 review 好草稿(`compose` 产出于 `12-Resource/drafts/`)。
2. 手动把 `.md` 拷入本仓库对应 content 目录(`articles/` 或 `garden/`)。
3. 调好 frontmatter。
4. 提交并 push → GitHub Actions 自动构建发布。

## 9. 范围之外(YAGNI / 后期)

- 站内搜索、评论、图谱视图、深浅色切换
- 自动同步脚本 / compose 直写本仓库(MVP 用手动拷)
- SSR / 服务端动态能力
