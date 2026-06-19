# 「归来」网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Astro 搭一个极简、纯静态的个人「写作博客 + 数字花园」网站,支持 `[[wikilink]]` 双向链接与反向链,GitHub Pages 部署。

**Architecture:** Astro 5 + Content Collections(`articles` / `garden`)+ 一个 JSON 数据文件(`favorites`)。双向链接由一个构建期 remark 插件把 `[[标题]]` 解析为站内链接;反向链由构建期工具扫描全部正文生成,注入每篇笔记页底。零客户端 JS 起步,纯静态输出。

**Tech Stack:** Astro 5、TypeScript、Vitest(单元测试纯逻辑)、remark/unified(wikilink 插件)、gray-matter + fast-glob(构建期扫盘建链接表)、`@astrojs/sitemap`、`@astrojs/rss`、GitHub Actions。

## Global Constraints

- **Node**: >= 20.3(Astro 5 要求);CI 用 Node 20。
- **包管理**: npm。
- **输出**: 纯静态(`output: 'static'`,Astro 默认),零客户端框架,零客户端 JS 起步。
- **slug**: 一律英文,等于 Markdown 文件名(去扩展名);`title` 用 frontmatter(可中文)。
- **设计**: 方案 A — 系统无衬线字体、黑白为主、单栏正文宽约 680px、大留白、细描边标签 chip、列表细下边框分隔。
- **`site` 配置**: 先用占位 `https://example.com`,Evan 后期换成自定义域名。
- **wikilink 语法**: `[[标题]]` 或 `[[标题|显示文字]]`;目标按 `title` 精确匹配,未命中则渲染为无链接的纯文字(显示文字)。
- **TDD**: 纯逻辑(`src/lib/*`)先写失败测试;`.astro` 页面用 `astro build` + 产物断言验证。
- **提交**: 每个 Task 末尾提交一次。

---

## File Structure

```
my_website/
├── package.json                  # 依赖与脚本
├── astro.config.ts               # Astro 配置 + 接入 wikilink 插件/集成
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── .github/workflows/deploy.yml  # GitHub Pages 部署
├── public/                       # 静态资源(后期放 CNAME)
├── src/
│   ├── content.config.ts         # 内容集合 schema(articles/garden)
│   ├── content/
│   │   ├── articles/             # 博客 .md
│   │   │   └── hello-world.md    # 示例 + 测试夹具
│   │   └── garden/               # 花园笔记 .md
│   │       ├── on-focus.md
│   │       └── deep-work.md
│   ├── data/
│   │   └── favorites.json        # 收藏:书籍 + 影视
│   ├── lib/
│   │   ├── links.ts              # 纯逻辑:提取 wikilink / 建链接表 / 建反链表(可单测)
│   │   ├── linkmap.node.ts       # 构建期:扫盘读 frontmatter 建链接表(Node 专用)
│   │   ├── wikilink.ts           # remark 插件:[[..]] → 站内链接
│   │   └── favorites.ts          # 收藏数据 zod 校验
│   ├── layouts/
│   │   ├── BaseLayout.astro      # <html> 骨架 + Nav + Footer
│   │   └── PostLayout.astro      # 单篇文章/笔记排版
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── PostList.astro        # 文章/笔记列表项
│   │   ├── TagChip.astro
│   │   └── Backlinks.astro       # 页底反向链接区
│   ├── styles/
│   │   └── global.css            # 方案 A 极简样式
│   └── pages/
│       ├── index.astro           # 首页
│       ├── about.astro           # 关于
│       ├── collections.astro     # 收藏/资源
│       ├── articles/index.astro  # 文章列表
│       ├── articles/[slug].astro # 文章全文
│       ├── garden/index.astro    # 花园列表
│       ├── garden/[slug].astro   # 笔记全文 + 反链
│       ├── tags/[tag].astro      # 标签聚合
│       └── rss.xml.ts            # RSS
└── tests/
    ├── links.test.ts
    └── favorites.test.ts
```

---

## Task 1: 项目脚手架 + 测试框架

**Files:**
- Create: `package.json`, `astro.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`
- Create: `src/pages/index.astro`(临时占位,后续 Task 7 覆盖)
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: 可运行的 `npm run dev` / `npm run build` / `npm test`;Astro 项目根。

- [ ] **Step 1: 写脚手架文件**

`package.json`:
```json
{
  "name": "guilai-website",
  "type": "module",
  "version": "0.1.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/rss": "^4.0.0",
    "@astrojs/sitemap": "^3.0.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.5.0",
    "fast-glob": "^3.3.0",
    "gray-matter": "^4.0.3",
    "remark": "^15.0.0",
    "unist-util-visit": "^5.0.0"
  }
}
```

`astro.config.ts`:
```ts
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com', // TODO: 换成自定义域名
  integrations: [sitemap()],
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

`.gitignore`:
```
node_modules/
dist/
.astro/
.superpowers/
.DS_Store
*.log
```

`src/pages/index.astro`(临时占位):
```astro
---
---
<html lang="zh-CN">
  <head><meta charset="utf-8" /><title>归来</title></head>
  <body><h1>归来</h1></body>
</html>
```

- [ ] **Step 2: 装依赖**

Run: `npm install`
Expected: 安装成功,生成 `node_modules/` 与 `package-lock.json`。

- [ ] **Step 3: 写冒烟测试**

`tests/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: 跑测试 + 构建,确认工具链通**

Run: `npm test`
Expected: PASS(1 passed)

Run: `npm run build`
Expected: 构建成功,生成 `dist/index.html`。

- [ ] **Step 5: 提交**

```bash
git init
git add -A
git commit -m "chore: scaffold Astro project with vitest"
```

---

## Task 2: 内容集合 schema + 示例内容

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/articles/hello-world.md`
- Create: `src/content/garden/on-focus.md`, `src/content/garden/deep-work.md`
- Create: `src/data/favorites.json`

**Interfaces:**
- Produces: 集合 `articles`(schema: `title, date, tags[], summary, draft`)与 `garden`(schema: `title, updated, tags[]`);可被 `getCollection('articles' | 'garden')` 读取。示例内容含 `[[wikilink]]` 供后续测试。

- [ ] **Step 1: 写集合 schema**

`src/content.config.ts`:
```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

const garden = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/garden' }),
  schema: z.object({
    title: z.string(),
    updated: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { articles, garden };
```

- [ ] **Step 2: 写示例内容**

`src/content/articles/hello-world.md`:
```markdown
---
title: 你好，归来
date: 2026-06-19
tags: [随笔]
summary: 第一篇文章，关于为什么建这个站。
draft: false
---

这是归来的第一篇文章。我也在花园里写了 [[论专注作为一种稀缺资源]]。
```

`src/content/garden/on-focus.md`:
```markdown
---
title: 论专注作为一种稀缺资源
updated: 2026-06-12
tags: [思考, 效率]
---

专注正变得稀缺。延伸阅读：[[深度工作|深度工作笔记]]。
```

`src/content/garden/deep-work.md`:
```markdown
---
title: 深度工作
updated: 2026-05-28
tags: [效率]
---

深度工作与 [[论专注作为一种稀缺资源]] 互为印证。
```

- [ ] **Step 3: 写收藏数据**

`src/data/favorites.json`:
```json
[
  { "type": "book", "title": "瓦尔登湖", "creator": "梭罗", "rating": 5, "date": "2026-05", "note": "独处与简朴的力量。" },
  { "type": "book", "title": "深度工作", "creator": "Cal Newport", "rating": 4, "date": "2026-04", "note": "" },
  { "type": "movie", "title": "心灵奇旅", "creator": "彼特·道格特", "rating": 5, "date": "2026-03", "note": "关于活着本身。" }
]
```

- [ ] **Step 4: 验证集合可被构建读取**

Run: `npm run build`
Expected: 构建成功,无 schema 校验错误。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add content collections schema and sample content"
```

---

## Task 3: wikilink 提取与链接表(纯逻辑,TDD)

**Files:**
- Create: `src/lib/links.ts`
- Test: `tests/links.test.ts`

**Interfaces:**
- Produces:
  - `type Collection = 'articles' | 'garden'`
  - `interface LinkTarget { title: string; collection: Collection; slug: string; url: string }`
  - `interface Backlink { title: string; url: string }`
  - `interface DocLike { title: string; collection: Collection; slug: string; body: string }`
  - `function toUrl(collection: Collection, slug: string): string`
  - `function extractWikiLinks(markdown: string): string[]` — 返回去重后的目标标题(取 `|` 前部分)
  - `function buildLinkMap(targets: LinkTarget[]): Map<string, LinkTarget>` — 以 `title` 为键
  - `function buildBacklinkIndex(docs: DocLike[]): Map<string, Backlink[]>` — 以目标 `url` 为键

- [ ] **Step 1: 写失败测试**

`tests/links.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  toUrl,
  extractWikiLinks,
  buildLinkMap,
  buildBacklinkIndex,
  type LinkTarget,
  type DocLike,
} from '../src/lib/links';

describe('toUrl', () => {
  it('builds collection-prefixed urls', () => {
    expect(toUrl('garden', 'on-focus')).toBe('/garden/on-focus');
    expect(toUrl('articles', 'hello')).toBe('/articles/hello');
  });
});

describe('extractWikiLinks', () => {
  it('extracts titles and strips display alias', () => {
    const md = '见 [[甲]] 与 [[乙|别名]]，以及重复 [[甲]]。';
    expect(extractWikiLinks(md)).toEqual(['甲', '乙']);
  });
  it('returns empty array when none', () => {
    expect(extractWikiLinks('没有链接')).toEqual([]);
  });
});

describe('buildLinkMap', () => {
  it('maps title to target', () => {
    const targets: LinkTarget[] = [
      { title: '甲', collection: 'garden', slug: 'jia', url: '/garden/jia' },
    ];
    const map = buildLinkMap(targets);
    expect(map.get('甲')?.url).toBe('/garden/jia');
  });
});

describe('buildBacklinkIndex', () => {
  it('indexes referrers by target url', () => {
    const docs: DocLike[] = [
      { title: '甲', collection: 'garden', slug: 'jia', body: '链到 [[乙]]' },
      { title: '乙', collection: 'garden', slug: 'yi', body: '无链接' },
    ];
    const index = buildBacklinkIndex(docs);
    expect(index.get('/garden/yi')).toEqual([{ title: '甲', url: '/garden/jia' }]);
    expect(index.get('/garden/jia')).toBeUndefined();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/links.test.ts`
Expected: FAIL(无法解析 `../src/lib/links`)

- [ ] **Step 3: 写实现**

`src/lib/links.ts`:
```ts
export type Collection = 'articles' | 'garden';

export interface LinkTarget {
  title: string;
  collection: Collection;
  slug: string;
  url: string;
}

export interface Backlink {
  title: string;
  url: string;
}

export interface DocLike {
  title: string;
  collection: Collection;
  slug: string;
  body: string;
}

const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;

export function toUrl(collection: Collection, slug: string): string {
  return `/${collection}/${slug}`;
}

export function extractWikiLinks(markdown: string): string[] {
  const titles: string[] = [];
  for (const match of markdown.matchAll(WIKILINK_RE)) {
    const title = match[1].split('|')[0].trim();
    if (title && !titles.includes(title)) titles.push(title);
  }
  return titles;
}

export function buildLinkMap(targets: LinkTarget[]): Map<string, LinkTarget> {
  const map = new Map<string, LinkTarget>();
  for (const t of targets) map.set(t.title, t);
  return map;
}

export function buildBacklinkIndex(docs: DocLike[]): Map<string, Backlink[]> {
  const linkMap = buildLinkMap(
    docs.map((d) => ({
      title: d.title,
      collection: d.collection,
      slug: d.slug,
      url: toUrl(d.collection, d.slug),
    })),
  );
  const index = new Map<string, Backlink[]>();
  for (const doc of docs) {
    const from: Backlink = { title: doc.title, url: toUrl(doc.collection, doc.slug) };
    for (const title of extractWikiLinks(doc.body)) {
      const target = linkMap.get(title);
      if (!target || target.url === from.url) continue;
      const list = index.get(target.url) ?? [];
      if (!list.some((b) => b.url === from.url)) list.push(from);
      index.set(target.url, list);
    }
  }
  return index;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/links.test.ts`
Expected: PASS(全部通过)

- [ ] **Step 5: 提交**

```bash
git add src/lib/links.ts tests/links.test.ts
git commit -m "feat: add wikilink extraction and backlink index logic"
```

---

## Task 4: 收藏数据校验(纯逻辑,TDD)

**Files:**
- Create: `src/lib/favorites.ts`
- Test: `tests/favorites.test.ts`

**Interfaces:**
- Produces:
  - `interface Favorite { type: 'book' | 'movie'; title: string; creator: string; rating: number; date: string; note: string }`
  - `function loadFavorites(raw: unknown): Favorite[]` — 用 zod 校验数组,`note` 缺省为空串

- [ ] **Step 1: 写失败测试**

`tests/favorites.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { loadFavorites } from '../src/lib/favorites';

describe('loadFavorites', () => {
  it('parses valid entries and defaults note', () => {
    const result = loadFavorites([
      { type: 'book', title: 'A', creator: 'X', rating: 5, date: '2026-01' },
    ]);
    expect(result).toEqual([
      { type: 'book', title: 'A', creator: 'X', rating: 5, date: '2026-01', note: '' },
    ]);
  });
  it('throws on invalid type', () => {
    expect(() => loadFavorites([{ type: 'game', title: 'A', creator: 'X', rating: 5, date: '2026' }])).toThrow();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/favorites.test.ts`
Expected: FAIL(无法解析 `../src/lib/favorites`)

- [ ] **Step 3: 写实现**

`src/lib/favorites.ts`:
```ts
import { z } from 'astro/zod';

export const favoriteSchema = z.object({
  type: z.enum(['book', 'movie']),
  title: z.string(),
  creator: z.string(),
  rating: z.number().min(0).max(5),
  date: z.string(),
  note: z.string().default(''),
});

export type Favorite = z.infer<typeof favoriteSchema>;

export function loadFavorites(raw: unknown): Favorite[] {
  return z.array(favoriteSchema).parse(raw);
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/favorites.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/favorites.ts tests/favorites.test.ts
git commit -m "feat: add favorites data validation"
```

---

## Task 5: wikilink remark 插件 + 接入构建(TDD)

**Files:**
- Create: `src/lib/wikilink.ts`
- Create: `src/lib/linkmap.node.ts`
- Modify: `astro.config.ts`
- Test: `tests/wikilink.test.ts`

**Interfaces:**
- Consumes: `LinkTarget`, `buildLinkMap`, `toUrl`(Task 3)
- Produces:
  - `function remarkWikiLink(linkMap: Map<string, LinkTarget>)` — 返回 remark 插件;把 `[[标题]]`/`[[标题|显示]]` 文本替换为 mdast `link` 节点(url 来自 linkMap);未命中保留为纯文字(显示文字)。
  - `function buildLinkMapFromDisk(): Map<string, LinkTarget>` — 扫 `src/content/{articles,garden}/*.md`,读 frontmatter `title`,文件名作 slug,建链接表。

- [ ] **Step 1: 写失败测试**

`tests/wikilink.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { remark } from 'remark';
import { remarkWikiLink } from '../src/lib/wikilink';
import { buildLinkMap, type LinkTarget } from '../src/lib/links';

const targets: LinkTarget[] = [
  { title: '甲', collection: 'garden', slug: 'jia', url: '/garden/jia' },
];
const map = buildLinkMap(targets);

async function run(md: string): Promise<string> {
  const file = await remark().use(remarkWikiLink(map)).process(md);
  return String(file);
}

describe('remarkWikiLink', () => {
  it('resolves known title to a link', async () => {
    expect(await run('见 [[甲]]。')).toContain('[甲](/garden/jia)');
  });
  it('uses display alias for link text', async () => {
    expect(await run('见 [[甲|别名]]。')).toContain('[别名](/garden/jia)');
  });
  it('renders unknown link as plain text', async () => {
    const out = await run('见 [[未知]]。');
    expect(out).toContain('未知');
    expect(out).not.toContain('[未知](');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/wikilink.test.ts`
Expected: FAIL(无法解析 `../src/lib/wikilink`)

- [ ] **Step 3: 写插件实现**

`src/lib/wikilink.ts`:
```ts
import { visit } from 'unist-util-visit';
import type { Root, Text, PhrasingContent } from 'mdast';
import type { LinkTarget } from './links';

const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;

export function remarkWikiLink(linkMap: Map<string, LinkTarget>) {
  return function () {
    return function (tree: Root) {
      visit(tree, 'text', (node: Text, index, parent) => {
        if (parent == null || index == null) return;
        if (!node.value.includes('[[')) return;

        const out: PhrasingContent[] = [];
        let last = 0;
        for (const match of node.value.matchAll(WIKILINK_RE)) {
          const start = match.index ?? 0;
          if (start > last) out.push({ type: 'text', value: node.value.slice(last, start) });

          const [rawTitle, rawDisplay] = match[1].split('|');
          const title = rawTitle.trim();
          const display = (rawDisplay ?? rawTitle).trim();
          const target = linkMap.get(title);

          if (target) {
            out.push({
              type: 'link',
              url: target.url,
              children: [{ type: 'text', value: display }],
            });
          } else {
            out.push({ type: 'text', value: display });
          }
          last = start + match[0].length;
        }
        if (last < node.value.length) out.push({ type: 'text', value: node.value.slice(last) });

        parent.children.splice(index, 1, ...out);
        return index + out.length;
      });
    };
  };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/wikilink.test.ts`
Expected: PASS

- [ ] **Step 5: 写构建期扫盘建表**

`src/lib/linkmap.node.ts`:
```ts
import fg from 'fast-glob';
import matter from 'gray-matter';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { buildLinkMap, toUrl, type Collection, type LinkTarget } from './links';

export function buildLinkMapFromDisk(): Map<string, LinkTarget> {
  const targets: LinkTarget[] = [];
  for (const collection of ['articles', 'garden'] as Collection[]) {
    const files = fg.sync(`src/content/${collection}/**/*.md`);
    for (const file of files) {
      const { data } = matter(readFileSync(file, 'utf-8'));
      const title = data.title as string | undefined;
      if (!title) continue;
      const slug = basename(file, '.md');
      targets.push({ title, collection, slug, url: toUrl(collection, slug) });
    }
  }
  return buildLinkMap(targets);
}
```

- [ ] **Step 6: 接入 astro.config**

替换 `astro.config.ts` 全文:
```ts
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { remarkWikiLink } from './src/lib/wikilink';
import { buildLinkMapFromDisk } from './src/lib/linkmap.node';

const linkMap = buildLinkMapFromDisk();

export default defineConfig({
  site: 'https://example.com', // TODO: 换成自定义域名
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkWikiLink(linkMap)],
  },
});
```

- [ ] **Step 7: 构建并确认 wikilink 已转链接**

Run: `npm run build`
Expected: 构建成功。

Run: `grep -r '/garden/on-focus' dist/articles/hello-world/index.html`
Expected: 命中(hello-world 文章里的 `[[论专注作为一种稀缺资源]]` 已渲染为指向 `/garden/on-focus` 的 `<a>`)。

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat: add wikilink remark plugin and wire into build"
```

---

## Task 6: 基础布局 + 导航/页脚 + 极简样式(方案 A)

**Files:**
- Create: `src/styles/global.css`
- Create: `src/components/Nav.astro`, `src/components/Footer.astro`
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`(临时改为用 BaseLayout,Task 7 再填内容)

**Interfaces:**
- Produces: `BaseLayout`(props: `title: string`, 可选 `description?: string`;含 `<slot />`),站点统一 `<html>` 骨架、导航(归来 / 文章 / 花园 / 收藏 / 关于)、页脚。

- [ ] **Step 1: 写全局样式(方案 A)**

`src/styles/global.css`:
```css
:root {
  --ink: #1a1a1a;
  --muted: #777;
  --line: #e8e8e8;
  --bg: #ffffff;
  --maxw: 680px;
}
* { box-sizing: border-box; }
html { font-size: 17px; }
body {
  margin: 0;
  color: var(--ink);
  background: var(--bg);
  font-family: -apple-system, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1.75;
}
.wrap { max-width: var(--maxw); margin: 0 auto; padding: 0 20px; }
a { color: var(--ink); text-underline-offset: 3px; }
.site-header { display: flex; justify-content: space-between; align-items: baseline; padding: 28px 0; }
.site-header .logo { font-size: 1.3rem; font-weight: 700; letter-spacing: -.5px; text-decoration: none; }
.site-nav a { margin-left: 16px; font-size: .9rem; color: var(--muted); text-decoration: none; }
.site-nav a:hover { color: var(--ink); }
.site-footer { margin: 64px 0 40px; padding-top: 20px; border-top: 1px solid var(--line); color: var(--muted); font-size: .85rem; }
.post-list { list-style: none; padding: 0; margin: 0; }
.post-list li { padding: 14px 0; border-bottom: 1px solid var(--line); }
.post-list .meta { color: var(--muted); font-size: .82rem; }
.tag { display: inline-block; font-size: .72rem; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 1px 7px; margin-right: 5px; text-decoration: none; }
.tag:hover { border-color: var(--muted); }
article h1 { line-height: 1.3; margin-bottom: .2em; }
article .meta { color: var(--muted); font-size: .85rem; margin-bottom: 2em; }
.backlinks { margin-top: 48px; padding-top: 18px; border-top: 1px solid var(--line); }
.backlinks h2 { font-size: .95rem; color: var(--muted); }
.lead { color: var(--muted); }
```

- [ ] **Step 2: 写 Nav 与 Footer**

`src/components/Nav.astro`:
```astro
---
---
<header class="site-header">
  <a href="/" class="logo">归来</a>
  <nav class="site-nav">
    <a href="/articles">文章</a>
    <a href="/garden">花园</a>
    <a href="/collections">收藏</a>
    <a href="/about">关于</a>
  </nav>
</header>
```

`src/components/Footer.astro`:
```astro
---
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <p>© {year} 归来 · <a href="/rss.xml">RSS</a></p>
</footer>
```

- [ ] **Step 3: 写 BaseLayout**

`src/layouts/BaseLayout.astro`:
```astro
---
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description?: string;
}
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
  </head>
  <body>
    <div class="wrap">
      <Nav />
      <main>
        <slot />
      </main>
      <Footer />
    </div>
  </body>
</html>
```

- [ ] **Step 4: 临时改首页用 BaseLayout**

`src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="归来">
  <p class="lead">记录、思考、与归处。</p>
</BaseLayout>
```

- [ ] **Step 5: 构建并验证骨架**

Run: `npm run build`
Expected: 构建成功。

Run: `grep -c 'site-nav' dist/index.html`
Expected: `1`(导航已渲染)。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add base layout, nav, footer, and minimal styles"
```

---

## Task 7: 首页

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/components/PostList.astro`, `src/components/TagChip.astro`

**Interfaces:**
- Consumes: `BaseLayout`(Task 6),`getCollection`(Astro)
- Produces:
  - `TagChip`(props: `tag: string`)→ 渲染指向 `/tags/<tag>` 的 chip。
  - `PostList`(props: `items: { url: string; title: string; meta: string }[]`)→ 渲染列表。
  - 首页:一句话介绍 + 最近 5 篇文章 + 最近 5 条花园更新。

- [ ] **Step 1: 写 TagChip**

`src/components/TagChip.astro`:
```astro
---
interface Props { tag: string; }
const { tag } = Astro.props;
---
<a class="tag" href={`/tags/${tag}`}>{tag}</a>
```

- [ ] **Step 2: 写 PostList**

`src/components/PostList.astro`:
```astro
---
interface Item { url: string; title: string; meta: string; }
interface Props { items: Item[]; }
const { items } = Astro.props;
---
<ul class="post-list">
  {items.map((it) => (
    <li>
      <a href={it.url}>{it.title}</a>
      <div class="meta">{it.meta}</div>
    </li>
  ))}
</ul>
```

- [ ] **Step 3: 写首页**

`src/pages/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import PostList from '../components/PostList.astro';

const fmt = (d: Date) => d.toISOString().slice(0, 10);

const articles = (await getCollection('articles', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 5)
  .map((e) => ({ url: `/articles/${e.id}`, title: e.data.title, meta: fmt(e.data.date) }));

const garden = (await getCollection('garden'))
  .sort((a, b) => b.data.updated.valueOf() - a.data.updated.valueOf())
  .slice(0, 5)
  .map((e) => ({ url: `/garden/${e.id}`, title: e.data.title, meta: `更新于 ${fmt(e.data.updated)}` }));
---
<BaseLayout title="归来" description="Evan 的个人写作博客与数字花园">
  <p class="lead">记录、思考、与归处。</p>

  <h2>最近文章</h2>
  <PostList items={articles} />

  <h2>花园近况</h2>
  <PostList items={garden} />
</BaseLayout>
```

- [ ] **Step 4: 构建并验证首页内容**

Run: `npm run build`
Expected: 构建成功。

Run: `grep -q '你好，归来' dist/index.html && grep -q '论专注作为一种稀缺资源' dist/index.html && echo OK`
Expected: 输出 `OK`(最近文章与花园近况都已渲染)。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add homepage with recent articles and garden updates"
```

---

## Task 8: 文章列表 + 文章详情 + PostLayout

**Files:**
- Create: `src/layouts/PostLayout.astro`
- Create: `src/pages/articles/index.astro`
- Create: `src/pages/articles/[slug].astro`

**Interfaces:**
- Consumes: `BaseLayout`, `TagChip`, `getCollection`, `render`(Astro)
- Produces:
  - `PostLayout`(props: `title: string; meta: string; tags: string[]`;含 `<slot />` 放正文,可选 `<slot name="after" />` 放反链)。
  - `/articles` 全文列表(按日期倒序,排除 draft)。
  - `/articles/[slug]` 文章全文。

- [ ] **Step 1: 写 PostLayout**

`src/layouts/PostLayout.astro`:
```astro
---
import BaseLayout from './BaseLayout.astro';
import TagChip from '../components/TagChip.astro';

interface Props { title: string; meta: string; tags: string[]; }
const { title, meta, tags } = Astro.props;
---
<BaseLayout title={title}>
  <article>
    <h1>{title}</h1>
    <div class="meta">
      {meta}
      {tags.length > 0 && <span> · {tags.map((t) => <TagChip tag={t} />)}</span>}
    </div>
    <slot />
  </article>
  <slot name="after" />
</BaseLayout>
```

- [ ] **Step 2: 写文章列表**

`src/pages/articles/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostList from '../../components/PostList.astro';

const fmt = (d: Date) => d.toISOString().slice(0, 10);
const items = (await getCollection('articles', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .map((e) => ({ url: `/articles/${e.id}`, title: e.data.title, meta: fmt(e.data.date) }));
---
<BaseLayout title="文章 · 归来">
  <h1>文章</h1>
  <PostList items={items} />
</BaseLayout>
```

- [ ] **Step 3: 写文章详情**

`src/pages/articles/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  return articles.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const meta = entry.data.date.toISOString().slice(0, 10);
---
<PostLayout title={entry.data.title} meta={meta} tags={entry.data.tags}>
  <Content />
</PostLayout>
```

- [ ] **Step 4: 构建并验证**

Run: `npm run build`
Expected: 构建成功,生成 `dist/articles/index.html` 与 `dist/articles/hello-world/index.html`。

Run: `grep -q '你好，归来' dist/articles/hello-world/index.html && echo OK`
Expected: 输出 `OK`。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add article list and detail pages"
```

---

## Task 9: 花园列表 + 笔记详情 + 反向链接

**Files:**
- Create: `src/components/Backlinks.astro`
- Create: `src/pages/garden/index.astro`
- Create: `src/pages/garden/[slug].astro`

**Interfaces:**
- Consumes: `PostLayout`, `buildBacklinkIndex`, `toUrl`(Task 3),`getCollection`, `render`
- Produces:
  - `Backlinks`(props: `items: { title: string; url: string }[]`)→ 若非空渲染「链接到此页的笔记」区。
  - `/garden` 笔记列表(按 updated 倒序)。
  - `/garden/[slug]` 笔记全文 + 页底反链。

- [ ] **Step 1: 写 Backlinks 组件**

`src/components/Backlinks.astro`:
```astro
---
interface Item { title: string; url: string; }
interface Props { items: Item[]; }
const { items } = Astro.props;
---
{items.length > 0 && (
  <section class="backlinks">
    <h2>链接到此页的笔记</h2>
    <ul class="post-list">
      {items.map((it) => (
        <li><a href={it.url}>{it.title}</a></li>
      ))}
    </ul>
  </section>
)}
```

- [ ] **Step 2: 写花园列表**

`src/pages/garden/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostList from '../../components/PostList.astro';

const fmt = (d: Date) => d.toISOString().slice(0, 10);
const items = (await getCollection('garden'))
  .sort((a, b) => b.data.updated.valueOf() - a.data.updated.valueOf())
  .map((e) => ({ url: `/garden/${e.id}`, title: e.data.title, meta: `更新于 ${fmt(e.data.updated)}` }));
---
<BaseLayout title="花园 · 归来">
  <h1>数字花园</h1>
  <p class="lead">慢慢生长、互相链接的笔记。</p>
  <PostList items={items} />
</BaseLayout>
```

- [ ] **Step 3: 写笔记详情(含反链)**

`src/pages/garden/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';
import Backlinks from '../../components/Backlinks.astro';
import { buildBacklinkIndex, toUrl, type DocLike } from '../../lib/links';

const articles = await getCollection('articles', ({ data }) => !data.draft);
const garden = await getCollection('garden');

const docs: DocLike[] = [
  ...articles.map((e) => ({ title: e.data.title, collection: 'articles' as const, slug: e.id, body: e.body ?? '' })),
  ...garden.map((e) => ({ title: e.data.title, collection: 'garden' as const, slug: e.id, body: e.body ?? '' })),
];
const backlinkIndex = buildBacklinkIndex(docs);

export async function getStaticPaths() {
  const entries = await getCollection('garden');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const meta = `更新于 ${entry.data.updated.toISOString().slice(0, 10)}`;
const backlinks = backlinkIndex.get(toUrl('garden', entry.id)) ?? [];
---
<PostLayout title={entry.data.title} meta={meta} tags={entry.data.tags}>
  <Content />
  <Backlinks slot="after" items={backlinks} />
</PostLayout>
```

- [ ] **Step 4: 构建并验证反链**

Run: `npm run build`
Expected: 构建成功。

Run: `grep -q '链接到此页的笔记' dist/garden/on-focus/index.html && grep -q '深度工作' dist/garden/on-focus/index.html && echo OK`
Expected: 输出 `OK`(`on-focus` 页底列出反链来源 `深度工作` 与 `你好，归来`)。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add garden pages with backlinks"
```

---

## Task 10: 标签聚合页

**Files:**
- Create: `src/pages/tags/[tag].astro`

**Interfaces:**
- Consumes: `BaseLayout`, `PostList`, `getCollection`
- Produces: `/tags/[tag]` — 列出该标签下的全部文章与花园笔记。

- [ ] **Step 1: 写标签页**

`src/pages/tags/[tag].astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostList from '../../components/PostList.astro';

const fmt = (d: Date) => d.toISOString().slice(0, 10);

export async function getStaticPaths() {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const garden = await getCollection('garden');

  const items = [
    ...articles.map((e) => ({ tags: e.data.tags, url: `/articles/${e.id}`, title: e.data.title, meta: fmt(e.data.date), sort: e.data.date.valueOf() })),
    ...garden.map((e) => ({ tags: e.data.tags, url: `/garden/${e.id}`, title: e.data.title, meta: `更新于 ${fmt(e.data.updated)}`, sort: e.data.updated.valueOf() })),
  ];

  const tags = [...new Set(items.flatMap((i) => i.tags))];
  return tags.map((tag) => ({
    params: { tag },
    props: {
      tag,
      items: items
        .filter((i) => i.tags.includes(tag))
        .sort((a, b) => b.sort - a.sort)
        .map(({ url, title, meta }) => ({ url, title, meta })),
    },
  }));
}

const { tag, items } = Astro.props;
---
<BaseLayout title={`#${tag} · 归来`}>
  <h1>#{tag}</h1>
  <PostList items={items} />
</BaseLayout>
```

- [ ] **Step 2: 构建并验证**

Run: `npm run build`
Expected: 构建成功,生成如 `dist/tags/效率/index.html`。

Run: `grep -q '深度工作' dist/tags/效率/index.html && echo OK`
Expected: 输出 `OK`。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add tag aggregation pages"
```

---

## Task 11: 收藏/资源页 + 关于页

**Files:**
- Create: `src/pages/collections.astro`
- Create: `src/pages/about.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `loadFavorites`(Task 4),`favorites.json`(Task 2)
- Produces: `/collections`(书籍 + 影视分组,★ 评分),`/about`。

- [ ] **Step 1: 写收藏页**

`src/pages/collections.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { loadFavorites } from '../lib/favorites';
import raw from '../data/favorites.json';

const favorites = loadFavorites(raw);
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
const books = favorites.filter((f) => f.type === 'book');
const movies = favorites.filter((f) => f.type === 'movie');
---
<BaseLayout title="收藏 · 归来" description="读过的书与看过的影视">
  <h1>收藏</h1>

  <h2>书籍</h2>
  <ul class="post-list">
    {books.map((b) => (
      <li>
        <strong>{b.title}</strong> <span class="meta">— {b.creator} · {stars(b.rating)} · {b.date}</span>
        {b.note && <div class="meta">{b.note}</div>}
      </li>
    ))}
  </ul>

  <h2>影视</h2>
  <ul class="post-list">
    {movies.map((m) => (
      <li>
        <strong>{m.title}</strong> <span class="meta">— {m.creator} · {stars(m.rating)} · {m.date}</span>
        {m.note && <div class="meta">{m.note}</div>}
      </li>
    ))}
  </ul>
</BaseLayout>
```

- [ ] **Step 2: 写关于页**

`src/pages/about.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="关于 · 归来">
  <article>
    <h1>关于</h1>
    <p>这里是「归来」——我的个人写作博客与数字花园。</p>
    <p>联系我：<a href="mailto:yrj8134517@gmail.com">yrj8134517@gmail.com</a></p>
  </article>
</BaseLayout>
```

- [ ] **Step 3: 构建并验证**

Run: `npm run build`
Expected: 构建成功。

Run: `grep -q '瓦尔登湖' dist/collections/index.html && grep -q '★★★★★' dist/collections/index.html && echo OK`
Expected: 输出 `OK`。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add collections and about pages"
```

---

## Task 12: RSS 订阅

**Files:**
- Create: `src/pages/rss.xml.ts`

**Interfaces:**
- Consumes: `@astrojs/rss`, `getCollection`, `Astro.site`
- Produces: `/rss.xml` — 文章订阅(按日期倒序)。

- [ ] **Step 1: 写 RSS 端点**

`src/pages/rss.xml.ts`:
```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  return rss({
    title: '归来',
    description: 'Evan 的个人写作博客与数字花园',
    site: context.site!,
    items: articles
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((e) => ({
        title: e.data.title,
        description: e.data.summary,
        pubDate: e.data.date,
        link: `/articles/${e.id}/`,
      })),
  });
}
```

- [ ] **Step 2: 构建并验证**

Run: `npm run build`
Expected: 构建成功,生成 `dist/rss.xml`。

Run: `grep -q '<rss' dist/rss.xml && grep -q '你好，归来' dist/rss.xml && echo OK`
Expected: 输出 `OK`。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add RSS feed"
```

---

## Task 13: GitHub Pages 部署 + README

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

**Interfaces:**
- Produces: push 到 `main` 自动构建并发布到 GitHub Pages 的工作流;项目说明文档。

- [ ] **Step 1: 写部署工作流**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 写 README**

`README.md`:
```markdown
# 归来 (Guī Lái)

个人写作博客 + 数字花园。Astro 静态站,GitHub Pages 部署。

## 开发

```bash
npm install
npm run dev      # 本地预览 http://localhost:4321
npm run build    # 构建到 dist/
npm test         # 跑单元测试
```

## 加内容

- 文章:在 `src/content/articles/` 放 `.md`,frontmatter 需 `title, date, tags, summary, draft`。
- 花园笔记:在 `src/content/garden/` 放 `.md`,frontmatter 需 `title, updated, tags`;正文可用 `[[标题]]` 双向链接。
- 收藏:编辑 `src/data/favorites.json`。
- slug = 文件名(用英文)。

## 发布

push 到 `main` 即由 GitHub Actions 自动构建发布。
绑定自定义域名时:在 `public/` 放 `CNAME` 文件并把 `astro.config.ts` 的 `site` 改为该域名。

设计与计划见 `docs/superpowers/`。
```

- [ ] **Step 3: 校验工作流 YAML + 全量构建/测试**

Run: `npm run build && npm test`
Expected: 两者都成功。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "ci: add GitHub Pages deploy workflow and README"
```

---

## 附:完成后的人工步骤(非本计划任务)

- 在 GitHub 新建仓库并 push;仓库 Settings → Pages → Source 选 "GitHub Actions"。
- 绑定自定义域名:`public/CNAME` 写入域名,DNS 配置指向 GitHub Pages,`astro.config.ts` 的 `site` 改为该域名。
- 后续从 Obsidian `12-Resource/drafts/` 手动拷草稿到 `src/content/`,调好 frontmatter 再提交。
