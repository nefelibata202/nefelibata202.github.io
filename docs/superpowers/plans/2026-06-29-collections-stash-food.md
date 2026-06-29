# 「私藏」聚合板块 + 美食页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把「书影」升级为「私藏」聚合板块(hub + 书影子页),并新增可按城市/菜系/评分筛选的「美食」子页。

**Architecture:** 纯静态 Astro。nav `书影 → 私藏`,`/collections` 变 hub 落地页;现有书影逻辑原样迁到 `/collections/media`;新增 `/collections/food`。美食数据走新 `src/data/food.json` + `src/lib/food.ts`(zod 校验、纯函数、单测),复用书影那套 neo-brutalist 筛选骨架,但卡片为无图文字卡。

**Tech Stack:** Astro 5、TypeScript、zod(astro/zod)、Vitest、单一 `is:inline` 脚本(无框架/无 hydration)、样式集中在 `src/styles/global.css`。

## Global Constraints

- Node >= 20.3。
- **零客户端框架**:不引入 `client:*`,不加框架;交互只用单个 `is:inline` 脚本(沿用书影页写法)。
- 样式一律进 `src/styles/global.css`,复用现有变量(ink / paper / 马金黄 marigold / 朱砂 seal、3px 硬边、偏移硬阴影)与现有筛选类 `.fchip`/`.frow`/`.filters`/`.mlib`/`.pgrid` 等,避免重复。
- `src/lib/*.ts` 保持纯函数,有单测;`.astro` 页面靠 `npm run build` + grep `dist/` 验证(项目约定,不写页面单测)。
- Slug/文件名用英文。中文用于标题/文案。
- 提交信息结尾加:`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

## File Structure

- `src/lib/food.ts` — 新增。美食 zod schema + `loadFood` + `scoreBand`(纯函数)。
- `tests/food.test.ts` — 新增。food.ts 单测。
- `src/data/food.json` — 新增。美食数据(先放 2 条样例)。
- `src/pages/collections.astro` — 由「书影整页」改写为「私藏 hub 落地页」。
- `src/pages/collections/media.astro` — 新增(由原 `collections.astro` 内容迁入,改 import 深度)。
- `src/pages/collections/food.astro` — 新增。美食筛选页。
- `src/components/CollectionTabs.astro` — 新增。书影/美食 页间分段切换器。
- `src/components/Nav.astro` — 改 1 行(label `书影 → 私藏`)。
- `src/styles/global.css` — 追加 hub 卡、美食文字卡、分段切换器样式。

---

### Task 1: 美食数据层 `food.ts` + 单测

**Files:**
- Create: `src/lib/food.ts`
- Test: `tests/food.test.ts`

**Interfaces:**
- Consumes: `z` from `astro/zod`(参照 `src/lib/favorites.ts`)。
- Produces:
  - `foodSchema`(zod 对象)
  - `type FoodSpot = z.infer<typeof foodSchema>`
  - `loadFood(raw: unknown): FoodSpot[]`
  - `scoreBand(score: number): '9' | '8' | '7' | 'lt7' | null`
  - 字段:`name: string`, `city: string`, `area: string`(默认 `''`), `cuisine: string[]`(默认 `[]`), `score: number`(0–10,默认 0), `recommend: string`(默认 `''`), `dishes: string[]`(默认 `[]`), `map: string`(默认 `''`), `date: string`(默认 `''`)。

- [ ] **Step 1: 写失败测试**

`tests/food.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { loadFood, scoreBand } from '../src/lib/food';

describe('loadFood', () => {
  it('parses a valid entry and applies defaults', () => {
    const [item] = loadFood([
      { name: '明婷饭店', city: '成都', cuisine: ['川菜'], score: 8.8 },
    ]);
    expect(item).toEqual({
      name: '明婷饭店',
      city: '成都',
      area: '',
      cuisine: ['川菜'],
      score: 8.8,
      recommend: '',
      dishes: [],
      map: '',
      date: '',
    });
  });

  it('rejects an entry missing required name', () => {
    expect(() => loadFood([{ city: '成都' }])).toThrow();
  });

  it('rejects score out of range', () => {
    expect(() => loadFood([{ name: 'x', city: 'y', score: 11 }])).toThrow();
  });
});

describe('scoreBand', () => {
  it('buckets scores into bands', () => {
    expect(scoreBand(9)).toBe('9');
    expect(scoreBand(9.5)).toBe('9');
    expect(scoreBand(8)).toBe('8');
    expect(scoreBand(8.9)).toBe('8');
    expect(scoreBand(7)).toBe('7');
    expect(scoreBand(6.9)).toBe('lt7');
    expect(scoreBand(0)).toBeNull();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/food.test.ts`
Expected: FAIL（`Cannot find module '../src/lib/food'`）

- [ ] **Step 3: 写实现**

`src/lib/food.ts`:
```ts
import { z } from 'astro/zod';

export const foodSchema = z.object({
  name: z.string(),
  city: z.string(),
  area: z.string().default(''),
  cuisine: z.array(z.string()).default([]),
  score: z.number().min(0).max(10).default(0),
  recommend: z.string().default(''),
  dishes: z.array(z.string()).default([]),
  map: z.string().default(''),
  date: z.string().default(''),
});

export type FoodSpot = z.infer<typeof foodSchema>;

export function loadFood(raw: unknown): FoodSpot[] {
  return z.array(foodSchema).parse(raw);
}

/** 评分分桶：用于「评分」筛选，与书影一致 */
export function scoreBand(score: number): '9' | '8' | '7' | 'lt7' | null {
  if (score >= 9) return '9';
  if (score >= 8) return '8';
  if (score >= 7) return '7';
  if (score > 0) return 'lt7';
  return null;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/food.test.ts`
Expected: PASS（4 个用例全过）

- [ ] **Step 5: 提交**

```bash
git add src/lib/food.ts tests/food.test.ts
git commit -m "feat(food): food.ts schema + loadFood + scoreBand with tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 私藏 IA 重构(hub + 书影迁移 + nav)

把 `/collections` 变 hub 落地页,书影整页迁到 `/collections/media`,新增样例 `food.json`,nav 标签改「私藏」。

**Files:**
- Create: `src/data/food.json`
- Create: `src/pages/collections/media.astro`(内容来自原 `src/pages/collections.astro`)
- Modify(改写为 hub): `src/pages/collections.astro`
- Modify: `src/components/Nav.astro:9`
- Modify(追加样式): `src/styles/global.css`

**Interfaces:**
- Consumes: `loadFavorites`(`src/lib/favorites.ts`)、`loadFood`(Task 1)、`src/data/favorites.json`、`src/data/food.json`。
- Produces: 路由 `/collections`(hub)、`/collections/media`(书影);hub 卡引用 class `.hub-head`/`.hub-grid`/`.hub-card`。

- [ ] **Step 1: 建样例数据 `src/data/food.json`**

```json
[
  {
    "name": "明婷饭店",
    "city": "成都",
    "area": "玉林",
    "cuisine": ["川菜", "苍蝇馆子"],
    "score": 8.8,
    "recommend": "脑花豆腐是镇店之宝，巷子深处的老成都味道。",
    "dishes": ["脑花豆腐", "鳝鱼"],
    "map": "",
    "date": "2026-06"
  },
  {
    "name": "Egg",
    "city": "上海",
    "area": "永康路",
    "cuisine": ["西餐", "咖啡"],
    "score": 8.2,
    "recommend": "周末 brunch 首选，班尼迪克蛋分量足。",
    "dishes": ["班尼迪克蛋"],
    "map": "",
    "date": "2026-05"
  }
]
```

- [ ] **Step 2: 迁移书影页到子路由**

用 git 移动文件(保留历史):
```bash
mkdir -p src/pages/collections
git mv src/pages/collections.astro src/pages/collections/media.astro
```

然后在 `src/pages/collections/media.astro` 里把 import 路径加深一层(原来在 `src/pages/`,现在在 `src/pages/collections/`)。改这三行:
```astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { loadFavorites, TYPE_LABEL, decadeOf } from '../../lib/favorites';
import raw from '../../data/favorites.json';
```
(原文件其余内容、`<BaseLayout title="书影 · 归来" ... wide>`、脚本全部不动。)

- [ ] **Step 3: 新建 hub 落地页 `src/pages/collections.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { loadFavorites } from '../lib/favorites';
import { loadFood } from '../lib/food';
import favRaw from '../data/favorites.json';
import foodRaw from '../data/food.json';

const media = loadFavorites(favRaw);
const food = loadFood(foodRaw);
const foodCities = new Set(food.map((f) => f.city)).size;
---
<BaseLayout title="私藏 · 归来" description="私人珍藏——读过看过的书影，与亲自去过的宝藏馆子。">
  <header class="hub-head">
    <p class="kicker">私人珍藏</p>
    <h1>私藏</h1>
    <p class="hub-lede">经手挑选的偏爱——读过看过的作品，与亲自去过的宝藏馆子。</p>
  </header>
  <div class="hub-grid">
    <a class="hub-card" href="/collections/media">
      <span class="hub-card-kicker">影 / 视 / 书 / 乐</span>
      <h2 class="hub-card-title">书影</h2>
      <p class="hub-card-meta">{media.length} 件藏品</p>
    </a>
    <a class="hub-card" href="/collections/food">
      <span class="hub-card-kicker">私人觅食地图</span>
      <h2 class="hub-card-title">美食</h2>
      <p class="hub-card-meta">{food.length} 家 · {foodCities} 城</p>
    </a>
  </div>
</BaseLayout>
```

- [ ] **Step 4: 改 nav 标签**

`src/components/Nav.astro:9`,把:
```astro
  { href: '/collections', label: '书影' },
```
改为:
```astro
  { href: '/collections', label: '私藏' },
```
(`active()` 已用 `path.startsWith('/collections')`,三个子路由都会高亮,无需改。)

- [ ] **Step 5: 追加 hub 样式到 `src/styles/global.css`**

在文件末尾追加:
```css
/* ── 私藏 hub ───────────────────────────── */
.hub-head { max-width: 680px; margin: 0 auto 2rem; }
.hub-head h1 { font-family: var(--font-display, inherit); margin: .2rem 0; }
.hub-lede { color: var(--ink-soft, inherit); }
.hub-grid {
  max-width: 680px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
}
@media (max-width: 560px) { .hub-grid { grid-template-columns: 1fr; } }
.hub-card {
  display: block; padding: 1.4rem 1.2rem; text-decoration: none; color: inherit;
  background: var(--paper, #fff);
  border: 3px solid var(--ink, #1a1a1a);
  box-shadow: 5px 5px 0 var(--ink, #1a1a1a);
  transition: transform .12s ease, box-shadow .12s ease;
}
.hub-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 7px 7px 0 var(--seal, #b22);
}
.hub-card-kicker { display: block; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--marigold, #c89a2b); }
.hub-card-title { margin: .35rem 0 .15rem; font-family: var(--font-display, inherit); }
.hub-card-meta { margin: 0; font-family: var(--font-mono, monospace); font-size: .85rem; color: var(--ink-soft, inherit); }
```
(若 `--ink-soft`/`--font-display`/`--font-mono` 在 global.css 里是别的名字,用文件中实际存在的变量名替换;fallback 已给。)

- [ ] **Step 6: 构建并验证**

Run: `npm run build`
Expected: 构建成功,无报错。

Run: `test -f dist/collections/index.html && test -f dist/collections/media/index.html && echo OK`
Expected: `OK`

Run: `grep -l '私藏' dist/collections/index.html && grep -c 'collections/media\|collections/food' dist/collections/index.html`
Expected: hub 页含「私藏」,且两个子路由链接都在(计数 >= 2)。

Run: `grep -o '书影' dist/collections/media/index.html | head -1`
Expected: `书影`(书影页内容已就位)。

- [ ] **Step 7: 跑全量测试**

Run: `npm test`
Expected: 全绿(含 Task 1 的 food.test.ts)。

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat(collections): 私藏 hub + 书影迁到 /collections/media

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 美食筛选页 `/collections/food`

**Files:**
- Create: `src/pages/collections/food.astro`
- Modify(追加样式): `src/styles/global.css`

**Interfaces:**
- Consumes: `loadFood`、`scoreBand`(Task 1)、`src/data/food.json`(Task 2)。复用 global.css 现有 `.mlib-head`/`.mlib-bar`/`.filters`/`.frow`/`.flabel`/`.fchip`/`.mlib-meta`/`.mcount`/`.mreset`/`.pgrid`/`.noresult`/`.mpager` 等类。
- Produces: 路由 `/collections/food`;美食卡 class `.fcard` 系列。

- [ ] **Step 1: 新建 `src/pages/collections/food.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { loadFood, scoreBand } from '../../lib/food';
import raw from '../../data/food.json';

const items = loadFood(raw).sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));

// 城市（按家数降序）
const cityCount = new Map<string, number>();
for (const it of items) cityCount.set(it.city, (cityCount.get(it.city) ?? 0) + 1);
const cities = [...cityCount.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);

// 菜系（top 12）
const cuiCount = new Map<string, number>();
for (const it of items) for (const c of it.cuisine) cuiCount.set(c, (cuiCount.get(c) ?? 0) + 1);
const topCui = [...cuiCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map((e) => e[0]);

const scored = items.filter((i) => i.score > 0);
const stats = {
  total: items.length,
  cities: cityCount.size,
  avg: scored.length ? (scored.reduce((s, i) => s + i.score, 0) / scored.length).toFixed(1) : '—',
};

const searchText = (i: typeof items[number]) =>
  [i.name, ...i.cuisine, ...i.dishes].join(' ').toLowerCase();
const fmtScore = (s: number) => (s > 0 ? s.toFixed(1) : '');
---
<BaseLayout title="美食 · 私藏" description="私人觅食地图——亲自去过的宝藏馆子，按城市、菜系、评分检索。" wide>
  <header class="mlib-head">
    <div class="mlib-head-inner">
      <div class="mlib-head-text">
        <p class="kicker">私人觅食地图</p>
        <h1>美食</h1>
        <p class="mlib-lede">都是亲自去过、值得回头的宝藏馆子。按城市、菜系与评分自由检索。</p>
      </div>
      <div class="foodstats" aria-label="美食统计">
        <div class="foodstat"><span class="fs-num">{stats.total}</span><span class="fs-lab">家</span></div>
        <div class="foodstat"><span class="fs-num">{stats.cities}</span><span class="fs-lab">座城</span></div>
        <div class="foodstat"><span class="fs-num fs-num--red">{stats.avg}</span><span class="fs-lab">均分</span></div>
      </div>
    </div>
  </header>

  <div class="mlib-bar">
    <label class="msearch">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      <input id="fsearch" type="search" placeholder="搜店名、菜系、招牌菜…" autocomplete="off" aria-label="搜索美食" />
    </label>
    <div class="frow" role="group" aria-label="排序">
      <span class="flabel">排序</span>
      <button type="button" class="fchip is-on" data-sort="score">评分</button>
      <button type="button" class="fchip" data-sort="date">最近</button>
    </div>
  </div>

  <button type="button" class="mlib-filter-toggle" id="ffiltertoggle" aria-expanded="false">
    筛选<span class="mft-badge" id="fftbadge" hidden>0</span><span class="mft-arr" aria-hidden="true">▼</span>
  </button>

  <div class="filters mlib-filters" id="food-filters-panel">
    <div class="frow" role="group" aria-label="按城市筛选">
      <span class="flabel">城市</span>
      <button type="button" class="fchip is-on" data-facet="city" data-val="*">全部</button>
      {cities.map((c) => <button type="button" class="fchip" data-facet="city" data-val={c}>{c} · {cityCount.get(c)}</button>)}
    </div>
    <div class="frow" role="group" aria-label="按菜系筛选">
      <span class="flabel">菜系</span>
      <button type="button" class="fchip is-on" data-facet="cuisine" data-val="*">全部</button>
      {topCui.map((c) => <button type="button" class="fchip" data-facet="cuisine" data-val={c}>{c}</button>)}
    </div>
    <div class="frow" role="group" aria-label="按评分筛选">
      <span class="flabel">评分</span>
      <button type="button" class="fchip is-on" data-facet="score" data-val="*">全部</button>
      <button type="button" class="fchip" data-facet="score" data-val="9">9+ 殿堂</button>
      <button type="button" class="fchip" data-facet="score" data-val="8">8–9 杰作</button>
      <button type="button" class="fchip" data-facet="score" data-val="7">7–8 佳作</button>
      <button type="button" class="fchip" data-facet="score" data-val="lt7">7 以下</button>
    </div>
  </div>

  <div class="mlib-meta">
    <span class="mcount">收录 <b id="fcount">{items.length}</b> 家</span>
    <button type="button" class="mreset" id="freset">清除筛选</button>
  </div>

  <div class="mlib">
    <div class="fgrid" id="fgrid">
      {items.map((it) => (
        <article
          class="fcard"
          data-city={it.city}
          data-cuisine={it.cuisine.join('|')}
          data-band={scoreBand(it.score) ?? ''}
          data-date={it.date}
          data-q={searchText(it)}
        >
          <div class="fcard-top">
            <h3 class="fcard-name">{it.name}</h3>
            {it.score > 0 && <span class="fcard-score">{fmtScore(it.score)}</span>}
          </div>
          <p class="fcard-loc">{[it.city, it.area].filter(Boolean).join(' · ')}</p>
          {it.cuisine.length > 0 && (
            <div class="fcard-tags">
              {it.cuisine.map((c) => <span class="fcard-tag">{c}</span>)}
            </div>
          )}
          {it.recommend && <p class="fcard-rec">{it.recommend}</p>}
          {it.dishes.length > 0 && <p class="fcard-dish">必点：{it.dishes.join(' / ')}</p>}
          {it.map && <a class="fcard-map" href={it.map} target="_blank" rel="noopener">导航 ↗</a>}
        </article>
      ))}
    </div>
    <p class="noresult" id="fnone" hidden>没有符合条件的店——试着放宽筛选。</p>
  </div>

  <div class="mpager" id="fpager" hidden>
    <button type="button" class="mpager-btn" id="fprev" aria-label="上一页">← 上一页</button>
    <span class="mpager-info" id="fpinfo">第 1 / 1 页</span>
    <button type="button" class="mpager-btn" id="fnext" aria-label="下一页">下一页 →</button>
  </div>

  <script is:inline>
    (() => {
      const grid = document.getElementById('fgrid');
      if (!grid) return;
      const cards = Array.from(grid.children);
      const none = document.getElementById('fnone');
      const count = document.getElementById('fcount');
      const search = document.getElementById('fsearch');
      const pager = document.getElementById('fpager');
      const pprev = document.getElementById('fprev');
      const pnext = document.getElementById('fnext');
      const pinfo = document.getElementById('fpinfo');
      const ftoggle = document.getElementById('ffiltertoggle');
      const ftbadge = document.getElementById('fftbadge');
      const filterPanel = document.getElementById('food-filters-panel');
      const PAGE_SIZE = 30;
      const state = { city: '*', cuisine: '*', score: '*', q: '', sort: 'score', page: 0 };

      const updateBadge = () => {
        const n = ['city', 'cuisine', 'score'].filter((k) => state[k] !== '*').length;
        if (ftbadge) { ftbadge.textContent = n; ftbadge.hidden = n === 0; }
      };
      ftoggle?.addEventListener('click', () => {
        const open = filterPanel.classList.toggle('is-open');
        ftoggle.setAttribute('aria-expanded', String(open));
        const arr = ftoggle.querySelector('.mft-arr');
        if (arr) arr.textContent = open ? '▲' : '▼';
      });

      const visible = (c) => {
        const d = c.dataset;
        if (state.city !== '*' && d.city !== state.city) return false;
        if (state.cuisine !== '*' && !d.cuisine.split('|').includes(state.cuisine)) return false;
        if (state.score !== '*' && d.band !== state.score) return false;
        if (state.q && !d.q.includes(state.q)) return false;
        return true;
      };
      const apply = () => {
        const vis = cards.filter((c) => visible(c));
        vis.sort((a, b) => {
          if (state.sort === 'date') return (b.dataset.date || '').localeCompare(a.dataset.date || '');
          return (b.dataset.band || '').localeCompare(a.dataset.band || '') ||
                 (b.dataset.date || '').localeCompare(a.dataset.date || '');
        });
        const totalPages = Math.max(1, Math.ceil(vis.length / PAGE_SIZE));
        if (state.page >= totalPages) state.page = totalPages - 1;
        const start = state.page * PAGE_SIZE;
        const pageItems = new Set(vis.slice(start, start + PAGE_SIZE));
        cards.forEach((c) => { c.hidden = !pageItems.has(c); });
        vis.slice(start, start + PAGE_SIZE).forEach((c) => grid.appendChild(c));
        if (count) count.textContent = vis.length;
        if (none) none.hidden = vis.length > 0;
        if (pager) {
          pager.hidden = totalPages <= 1;
          if (pprev) pprev.disabled = state.page === 0;
          if (pnext) pnext.disabled = state.page === totalPages - 1;
          if (pinfo) pinfo.textContent = `第 ${state.page + 1} / ${totalPages} 页`;
        }
      };

      document.querySelectorAll('[data-facet]').forEach((btn) => btn.addEventListener('click', () => {
        const f = btn.dataset.facet;
        state[f] = btn.dataset.val;
        document.querySelectorAll(`[data-facet="${f}"]`).forEach((b) => b.classList.toggle('is-on', b === btn));
        state.page = 0;
        apply();
        updateBadge();
      }));
      document.querySelectorAll('[data-sort]').forEach((btn) => btn.addEventListener('click', () => {
        state.sort = btn.dataset.sort;
        document.querySelectorAll('[data-sort]').forEach((b) => b.classList.toggle('is-on', b === btn));
        state.page = 0;
        apply();
      }));
      let t;
      search?.addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); state.page = 0; apply(); }, 120);
      });
      document.getElementById('freset')?.addEventListener('click', () => {
        Object.assign(state, { city: '*', cuisine: '*', score: '*', q: '', sort: 'score', page: 0 });
        if (search) search.value = '';
        document.querySelectorAll('[data-facet]').forEach((b) => b.classList.toggle('is-on', b.dataset.val === '*'));
        document.querySelectorAll('[data-sort]').forEach((b) => b.classList.toggle('is-on', b.dataset.sort === 'score'));
        apply();
        updateBadge();
      });
      pprev?.addEventListener('click', () => {
        if (state.page > 0) { state.page--; apply(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
      pnext?.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(cards.filter((c) => visible(c)).length / PAGE_SIZE));
        if (state.page < totalPages - 1) { state.page++; apply(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
      apply();
    })();
  </script>
</BaseLayout>
```

- [ ] **Step 2: 追加美食样式到 `src/styles/global.css`**

在文件末尾追加:
```css
/* ── 美食统计 + 文字卡 ───────────────────── */
.foodstats { display: flex; gap: 1.4rem; align-items: baseline; }
.foodstat { display: flex; flex-direction: column; align-items: center; }
.fs-num { font-family: var(--font-mono, monospace); font-size: 1.6rem; font-weight: 700; line-height: 1; }
.fs-num--red { color: var(--seal, #b22); }
.fs-lab { font-size: .72rem; color: var(--ink-soft, inherit); margin-top: .2rem; }

.fgrid {
  display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.fcard {
  display: flex; flex-direction: column; gap: .45rem;
  padding: 1rem 1.1rem;
  background: var(--paper, #fff);
  border: 3px solid var(--ink, #1a1a1a);
  box-shadow: 4px 4px 0 var(--ink, #1a1a1a);
}
.fcard-top { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }
.fcard-name { margin: 0; font-family: var(--font-display, inherit); font-size: 1.1rem; }
.fcard-score {
  flex: none; font-family: var(--font-mono, monospace); font-weight: 700; font-size: .95rem;
  color: var(--paper, #fff); background: var(--seal, #b22);
  padding: .05rem .4rem; border: 2px solid var(--ink, #1a1a1a);
}
.fcard-loc { margin: 0; font-family: var(--font-mono, monospace); font-size: .8rem; color: var(--marigold, #c89a2b); }
.fcard-tags { display: flex; flex-wrap: wrap; gap: .35rem; }
.fcard-tag { font-size: .72rem; padding: .05rem .4rem; border: 2px solid var(--ink, #1a1a1a); }
.fcard-rec { margin: 0; font-size: .9rem; line-height: 1.5; }
.fcard-dish { margin: 0; font-size: .82rem; color: var(--ink-soft, inherit); }
.fcard-map {
  align-self: flex-start; margin-top: .15rem;
  font-family: var(--font-mono, monospace); font-size: .8rem; font-weight: 700;
  text-decoration: none; color: var(--ink, #1a1a1a);
  border-bottom: 2px solid var(--marigold, #c89a2b);
}
```

- [ ] **Step 3: 构建并验证**

Run: `npm run build`
Expected: 成功。

Run: `test -f dist/collections/food/index.html && echo OK`
Expected: `OK`

Run: `grep -c 'fcard' dist/collections/food/index.html && grep -o '明婷饭店' dist/collections/food/index.html`
Expected: 含 `fcard` 卡片(计数 >= 2),且样例「明婷饭店」已渲染。

Run: `grep -o '成都\|上海' dist/collections/food/index.html | sort -u`
Expected: 城市 chips/卡片中出现 `成都` 与 `上海`。

- [ ] **Step 4: 手动核对交互(可选但建议)**

Run: `npm run dev`,浏览 `http://localhost:4321/collections/food`,确认城市/菜系/评分 chips、搜索、排序、清除筛选都生效。完成后停掉 dev server。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat(food): 美食筛选页 /collections/food

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 书影/美食 页间分段切换器

**Files:**
- Create: `src/components/CollectionTabs.astro`
- Modify: `src/pages/collections/media.astro`
- Modify: `src/pages/collections/food.astro`
- Modify(追加样式): `src/styles/global.css`

**Interfaces:**
- Consumes: 无(纯展示组件)。
- Produces: `CollectionTabs.astro`,prop `active: 'media' | 'food'`,渲染 `.ctabs` 切换条。

- [ ] **Step 1: 新建组件 `src/components/CollectionTabs.astro`**

```astro
---
const { active } = Astro.props as { active: 'media' | 'food' };
---
<nav class="ctabs" aria-label="私藏分区">
  <a href="/collections/media" class="ctab" aria-current={active === 'media' ? 'page' : undefined}>书影</a>
  <a href="/collections/food" class="ctab" aria-current={active === 'food' ? 'page' : undefined}>美食</a>
</nav>
```

- [ ] **Step 2: 在书影页插入切换器**

`src/pages/collections/media.astro`:在 import 区加:
```astro
import CollectionTabs from '../../components/CollectionTabs.astro';
```
并在 `<BaseLayout ...>` 之后、`<header class="mlib-head">` 之前插入:
```astro
  <CollectionTabs active="media" />
```

- [ ] **Step 3: 在美食页插入切换器**

`src/pages/collections/food.astro`:在 import 区加:
```astro
import CollectionTabs from '../../components/CollectionTabs.astro';
```
并在 `<BaseLayout ...>` 之后、`<header class="mlib-head">` 之前插入:
```astro
  <CollectionTabs active="food" />
```

- [ ] **Step 4: 追加切换器样式到 `src/styles/global.css`**

在文件末尾追加:
```css
/* ── 私藏页间分段切换 ─────────────────────── */
.ctabs {
  display: inline-flex; margin: 0 0 1.2rem;
  border: 3px solid var(--ink, #1a1a1a);
  box-shadow: 3px 3px 0 var(--ink, #1a1a1a);
}
.ctab {
  padding: .4rem 1.1rem; text-decoration: none; color: inherit;
  font-family: var(--font-display, inherit); font-size: .95rem;
}
.ctab + .ctab { border-left: 3px solid var(--ink, #1a1a1a); }
.ctab[aria-current="page"] { background: var(--marigold, #c89a2b); color: var(--ink, #1a1a1a); }
```

- [ ] **Step 5: 构建并验证**

Run: `npm run build`
Expected: 成功。

Run: `grep -c 'ctabs' dist/collections/media/index.html dist/collections/food/index.html`
Expected: 两个文件各含 `ctabs`(每个计数 >= 1)。

Run: `grep -o 'aria-current="page"' dist/collections/food/index.html | head -1`
Expected: `aria-current="page"`(当前页高亮存在)。

- [ ] **Step 6: 跑全量测试**

Run: `npm test`
Expected: 全绿。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat(collections): 书影/美食 页间分段切换器

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- 第 1 节 板块结构/路由 → Task 2(hub + 书影迁移 + nav 标签)。✓
- 第 2 节 数据模型/筛选 → Task 1(food.ts/schema/scoreBand)+ Task 3(城市/菜系/评分/搜索/排序 chips)。✓
- 第 3 节 页面布局(文字卡 + 统计 + 分段切换)→ Task 3(卡 + 统计)+ Task 4(切换器)。✓
- 第 4 节 样式入 global.css、复用现有筛选类 → Task 2/3/4 各自追加,复用 `.fchip` 等。✓
- 测试与验收(food.ts 单测、build+grep、npm test 全绿)→ Task 1 单测,Task 2/3/4 build+grep,Task 2/4 跑 `npm test`。✓
- 迁移注意:硬编码 `/collections` 仅 `Nav.astro`(已核实),Task 2 Step 4 处理。✓
- 待确认小事:food.json 放 2 条样例 → Task 2 Step 1。✓
- YAGNI(无价位/状态/封面/不并文件)→ schema 与页面均未含,书影/美食分文件。✓

**Placeholder scan:** 无 TBD/TODO;所有代码步骤含完整代码;build 步骤含确切命令与期望输出。✓

**Type consistency:** `loadFood`/`scoreBand`/`FoodSpot` 字段在 Task 1 定义,Task 2(hub)与 Task 3(food 页)的用法一致(`scoreBand` 返回值 `'9'|'8'|'7'|'lt7'|null` 与页面 `data-band` 及筛选 `data-val` 对齐);`CollectionTabs` 的 `active` prop 在 Task 4 三处一致。✓
