# 归图 Interactive Map Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/guide` — a nautical-chart SVG map page where a boat sails to 7 clickable islands, each revealing a side-panel of personal guide content.

**Architecture:** Astro page (`src/pages/guide.astro`) renders a full SVG map at build time; 7 guide Markdown files in a new `guide` content collection are rendered server-side into hidden panels in the DOM; a single `<script is:inline>` handles all click / animation / panel-open logic at runtime using `requestAnimationFrame` + parametric quadratic Bézier curves.

**Tech Stack:** Astro 5 (content layer API, glob loader), Vitest, SVG + vanilla JS, CSS transitions.

## Global Constraints

- No client-side framework, no hydration — `<script is:inline>` only
- All island HTML rendered at build time via `render(entry)` from `astro:content`
- SVG viewBox = `0 0 900 520`; boat facing east (right) by default; rotation via `atan2`
- Design tokens from `src/styles/global.css`: `--ink`, `--paper`, `--bg`, `--gold`, `--seal`, `--shadow-lg`
- Sea colour `#C4B99A` (not in global tokens — used inline in SVG `fill` attribute)
- Nav link added as `{ href: '/guide', label: '归图' }` in `src/components/Nav.astro`
- Tests live in `tests/` and run with `npm test` (Vitest)

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| Create | `src/content/guide/people.md` | 喜欢的人物 content |
| Create | `src/content/guide/interests.md` | 个人兴趣 content |
| Create | `src/content/guide/philosophy.md` | 人生哲学 content |
| Create | `src/content/guide/travel.md` | 旅行计划 content |
| Create | `src/content/guide/info-sources.md` | 高质量的信息源 (placeholder) |
| Create | `src/content/guide/fragmented-time.md` | 碎片时间 (placeholder) |
| Create | `src/content/guide/knowledge-gaps.md` | 知识库缺口 (placeholder) |
| Modify | `src/content.config.ts` | Add `guide` collection + schema |
| Create | `src/pages/guide.astro` | Full page: SVG map + panels + script |
| Modify | `src/components/Nav.astro` | Add 归图 nav link |
| Create | `tests/guide.test.ts` | Verify 7 files + required frontmatter |

---

## Task 1: Content Collection + Markdown Files

**Files:**
- Create: `src/content/guide/` (7 `.md` files)
- Modify: `src/content.config.ts`
- Create: `tests/guide.test.ts`

**Interfaces:**
- Produces: `guide` collection with schema `{ title: string, island: string, placeholder?: boolean }`; island IDs: `people`, `interests`, `philosophy`, `travel`, `info-sources`, `fragmented-time`, `knowledge-gaps`

- [ ] **Step 1: Write the failing test**

Create `tests/guide.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const GUIDE_DIR = resolve('src/content/guide');
const EXPECTED = [
  'people',
  'interests',
  'philosophy',
  'travel',
  'info-sources',
  'fragmented-time',
  'knowledge-gaps',
];

describe('guide content collection', () => {
  it('has exactly 7 markdown files', () => {
    const files = readdirSync(GUIDE_DIR).filter(f => f.endsWith('.md'));
    expect(files).toHaveLength(7);
  });

  it('all required island files are present', () => {
    const files = readdirSync(GUIDE_DIR).filter(f => f.endsWith('.md'));
    const slugs = files.map(f => f.replace('.md', ''));
    for (const id of EXPECTED) {
      expect(slugs, `missing ${id}.md`).toContain(id);
    }
  });

  it('all files have required frontmatter fields', () => {
    for (const id of EXPECTED) {
      const content = readFileSync(resolve(GUIDE_DIR, `${id}.md`), 'utf-8');
      expect(content, `${id}.md missing title`).toMatch(/^title:/m);
      expect(content, `${id}.md missing island`).toMatch(/^island:/m);
    }
  });

  it('island field matches file slug', () => {
    for (const id of EXPECTED) {
      const content = readFileSync(resolve(GUIDE_DIR, `${id}.md`), 'utf-8');
      expect(content, `${id}.md island field mismatch`).toContain(`island: ${id}`);
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (directory missing)**

```bash
cd /Users/evan/Downloads/Softwares/my_website && npm test -- tests/guide.test.ts
```

Expected: error `ENOENT: no such file or directory` or 4 failures.

- [ ] **Step 3: Add guide collection to `src/content.config.ts`**

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

const guide = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guide' }),
  schema: z.object({
    title: z.string(),
    island: z.string(),
    placeholder: z.boolean().default(false),
  }),
});

export const collections = { articles, garden, guide };
```

- [ ] **Step 4: Create the 7 Markdown files**

**`src/content/guide/people.md`:**
```markdown
---
title: 喜欢的人物
island: people
---

## 演员

**艾德里安·布罗迪** · **罗伯特·德尼罗** · **菅田将晖**

## 作家

**刘震云** · **东野圭吾** · **马伯庸**

## 创作者

**梁文道** · **孟岩**
```

**`src/content/guide/interests.md`:**
```markdown
---
title: 个人兴趣
island: interests
---

历史故事 · 悬疑犯罪 · 知识管理 · 精酿啤酒 · 英语学习 · 运动锻炼
```

**`src/content/guide/philosophy.md`:**
```markdown
---
title: 人生哲学
island: philosophy
---

1. 接受自己是一个普通人
2. 以我为主，为我所用
3. 实践出真知
4. 动态系统理论 & 优化心态
5. 需求导向
```

**`src/content/guide/travel.md`:**
```markdown
---
title: 旅行计划
island: travel
---

## 福冈

深度放松之旅

## Fuji 音乐节

音乐之旅

## 新疆

探索之旅
```

**`src/content/guide/info-sources.md`:**
```markdown
---
title: 高质量的信息源
island: info-sources
placeholder: true
---

*内容整理中……*
```

**`src/content/guide/fragmented-time.md`:**
```markdown
---
title: 碎片时间能做的事
island: fragmented-time
placeholder: true
---

*内容整理中……*
```

**`src/content/guide/knowledge-gaps.md`:**
```markdown
---
title: 知识库缺口
island: knowledge-gaps
placeholder: true
---

*内容整理中……*
```

- [ ] **Step 5: Run test — expect PASS**

```bash
npm test -- tests/guide.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/content.config.ts src/content/guide/ tests/guide.test.ts
git commit -m "feat(guide): add guide content collection with 7 islands"
```

---

## Task 2: Guide Page — SVG Map Skeleton

**Files:**
- Create: `src/pages/guide.astro`
- Modify: `src/components/Nav.astro`

**Interfaces:**
- Consumes: `guide` collection (Task 1)
- Produces: `/guide` route; SVG map with 7 `<g class="island-group" data-island="...">` elements, `id="boat"`, `id="wake"`, `id="home-port"`, `id="guide-container"`, `id="map-wrapper"`

- [ ] **Step 1: Create `src/pages/guide.astro` with SVG map**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

const entries = await getCollection('guide');
const panels = await Promise.all(
  entries.map(async (e) => {
    const { Content } = await render(e);
    return { data: e.data, Content };
  })
);
---

<BaseLayout title="归图 · 个人导览">
  <div class="guide-page wrap">
    <header class="guide-header">
      <h1 class="guide-title">归图</h1>
      <p class="guide-sub">个人导览 · 点击岛屿探索</p>
    </header>

    <div id="guide-container" class="guide-container">
      <div id="map-wrapper" class="map-wrapper">
        <svg
          id="map-svg"
          viewBox="0 0 900 520"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="归图 — 个人导览地图"
          role="img"
        >
          <!-- Sea background -->
          <rect width="900" height="520" fill="#C4B99A" />

          <!-- Wake trail (accumulated; starts empty) -->
          <polyline
            id="wake"
            points=""
            fill="none"
            stroke="var(--seal)"
            stroke-width="2"
            stroke-dasharray="4 6"
            stroke-linecap="round"
          />

          <!-- ── Left cluster: personal islands ── -->

          <!-- 喜欢的人物 (cx=110, cy=90) — gold tint -->
          <g
            id="island-people"
            class="island-group"
            data-island="people"
            role="button"
            tabindex="0"
            aria-label="喜欢的人物"
          >
            <polygon
              points="68,67 155,63 152,85 145,115 102,120 70,108"
              fill="var(--paper)"
              stroke="var(--ink)"
              stroke-width="2"
            />
            <polygon
              points="68,67 155,63 152,85 145,115 102,120 70,108"
              fill="rgba(242,179,18,0.18)"
            />
            <text x="111" y="136" text-anchor="middle" class="island-label">喜欢的人物</text>
          </g>

          <!-- 人生哲学 (cx=300, cy=80) -->
          <g
            id="island-philosophy"
            class="island-group"
            data-island="philosophy"
            role="button"
            tabindex="0"
            aria-label="人生哲学"
          >
            <polygon
              points="250,58 358,55 362,72 355,105 295,110 255,98 248,75"
              fill="var(--paper)"
              stroke="var(--ink)"
              stroke-width="2"
            />
            <text x="303" y="126" text-anchor="middle" class="island-label">人生哲学</text>
          </g>

          <!-- 个人兴趣 (cx=115, cy=240) -->
          <g
            id="island-interests"
            class="island-group"
            data-island="interests"
            role="button"
            tabindex="0"
            aria-label="个人兴趣"
          >
            <polygon
              points="65,220 168,215 172,235 165,262 108,268 62,252 58,232"
              fill="var(--paper)"
              stroke="var(--ink)"
              stroke-width="2"
            />
            <text x="115" y="284" text-anchor="middle" class="island-label">个人兴趣</text>
          </g>

          <!-- 旅行计划 (cx=295, cy=228) — gold tint -->
          <g
            id="island-travel"
            class="island-group"
            data-island="travel"
            role="button"
            tabindex="0"
            aria-label="旅行计划"
          >
            <polygon
              points="245,208 350,203 355,222 348,252 288,258 242,242 238,220"
              fill="var(--paper)"
              stroke="var(--ink)"
              stroke-width="2"
            />
            <polygon
              points="245,208 350,203 355,222 348,252 288,258 242,242 238,220"
              fill="rgba(242,179,18,0.18)"
            />
            <text x="295" y="274" text-anchor="middle" class="island-label">旅行计划</text>
          </g>

          <!-- ── Right cluster: info islands ── -->

          <!-- 高质量的信息源 (cx=645, cy=133) -->
          <g
            id="island-info-sources"
            class="island-group"
            data-island="info-sources"
            role="button"
            tabindex="0"
            aria-label="高质量的信息源"
          >
            <polygon
              points="592,112 700,108 706,128 698,158 638,164 590,148"
              fill="var(--paper)"
              stroke="var(--ink)"
              stroke-width="2"
            />
            <text x="647" y="180" text-anchor="middle" class="island-label">信息源</text>
          </g>

          <!-- 知识库缺口 (cx=790, cy=258) -->
          <g
            id="island-knowledge-gaps"
            class="island-group"
            data-island="knowledge-gaps"
            role="button"
            tabindex="0"
            aria-label="知识库缺口"
          >
            <polygon
              points="748,234 838,229 844,250 836,280 782,287 745,270 740,247"
              fill="var(--paper)"
              stroke="var(--ink)"
              stroke-width="2"
            />
            <text x="792" y="303" text-anchor="middle" class="island-label">知识缺口</text>
          </g>

          <!-- 碎片时间 (cx=660, cy=393) -->
          <g
            id="island-fragmented-time"
            class="island-group"
            data-island="fragmented-time"
            role="button"
            tabindex="0"
            aria-label="碎片时间能做的事"
          >
            <polygon
              points="608,370 718,365 724,384 716,418 652,424 606,408"
              fill="var(--paper)"
              stroke="var(--ink)"
              stroke-width="2"
            />
            <text x="662" y="440" text-anchor="middle" class="island-label">碎片时间</text>
          </g>

          <!-- ── Home port (center: 470, 270) ── -->
          <g id="home-port">
            <circle cx="470" cy="270" r="5" fill="var(--ink)" />
            <circle
              cx="470"
              cy="270"
              r="10"
              fill="none"
              stroke="var(--ink)"
              stroke-width="1.5"
              stroke-dasharray="3 3"
            />
          </g>

          <!-- ── Boat (starts at home port, facing east) ── -->
          <g id="boat" transform="translate(470,270)">
            <!-- hull: trapezoid wider at stern, bow points east -->
            <polygon points="-12,-6 10,-4 10,4 -12,6" fill="var(--ink)" />
            <!-- mast -->
            <line x1="-2" y1="-14" x2="-2" y2="6" stroke="var(--ink)" stroke-width="1.5" />
            <!-- sail (gold triangle, points east) -->
            <polygon points="-2,-14 -2,4 10,-4" fill="var(--gold)" />
          </g>

          <!-- ── Compass rose (bottom-right, decorative) ── -->
          <g transform="translate(848,468)">
            <line x1="0" y1="-18" x2="0" y2="18" stroke="var(--gold)" stroke-width="2" />
            <line x1="-18" y1="0" x2="18" y2="0" stroke="var(--gold)" stroke-width="2" />
            <polygon points="0,-18 3,-8 0,-5 -3,-8" fill="var(--gold)" />
            <polygon points="0,18 3,8 0,5 -3,8" fill="var(--ink)" />
            <polygon points="-18,0 -8,3 -5,0 -8,-3" fill="var(--ink)" />
            <polygon points="18,0 8,3 5,0 8,-3" fill="var(--gold)" />
            <circle cx="0" cy="0" r="3" fill="var(--ink)" />
          </g>

          <!-- ── Map title plate (bottom-left) ── -->
          <g transform="translate(16,454)">
            <rect
              x="0" y="0" width="172" height="52"
              fill="var(--paper)"
              stroke="var(--ink)"
              stroke-width="2"
            />
            <text x="10" y="22" class="plate-title">归图</text>
            <text x="10" y="42" class="plate-sub">个人导览 · 2026</text>
          </g>
        </svg>
      </div><!-- /map-wrapper -->

      <!-- Content panels injected in Task 3 -->
    </div><!-- /guide-container -->
  </div>
</BaseLayout>

<style>
  .guide-page {
    padding-top: 32px;
    padding-bottom: 64px;
  }
  .guide-header {
    margin-bottom: 24px;
  }
  .guide-title {
    font-family: var(--disp);
    font-size: 2rem;
    margin: 0 0 4px;
  }
  .guide-sub {
    color: var(--muted);
    margin: 0;
    font-size: 0.9rem;
  }
  .guide-container {
    display: flex;
    border: 3px solid var(--ink);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    background: var(--paper);
  }
  .map-wrapper {
    flex: 1 1 100%;
    min-width: 0;
    transition: flex-basis 0.4s ease;
  }
  #map-svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .island-group {
    cursor: pointer;
  }
  .island-group:hover > polygon:first-child,
  .island-group:focus > polygon:first-child {
    stroke-width: 3.5px;
  }
  .island-group:focus {
    outline: none;
  }
  .island-label {
    font-family: var(--disp);
    font-size: 13px;
    fill: var(--ink);
    letter-spacing: 0.04em;
    pointer-events: none;
    user-select: none;
  }
  .plate-title {
    font-family: var(--disp);
    font-size: 18px;
    fill: var(--ink);
  }
  .plate-sub {
    font-family: var(--lat);
    font-size: 11px;
    fill: var(--muted);
  }
</style>
```

- [ ] **Step 2: Add 归图 link to Nav**

In `src/components/Nav.astro`, find the `links` array and add the 归图 entry:

```ts
const links = [
  { href: '/articles', label: '文章' },
  { href: '/garden',   label: '花园' },
  { href: '/guide',    label: '归图' },
  { href: '/collections', label: '书影' },
  { href: '/about',    label: '关于' },
];
```

- [ ] **Step 3: Build and verify**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

```bash
grep -c 'data-island' dist/guide/index.html
```

Expected: `7`

- [ ] **Step 4: Commit**

```bash
git add src/pages/guide.astro src/components/Nav.astro
git commit -m "feat(guide): add SVG map page skeleton with 7 islands"
```

---

## Task 3: Content Panels + Full CSS

**Files:**
- Modify: `src/pages/guide.astro` — add panels div + expand `<style>`

**Interfaces:**
- Consumes: `panels` array from Task 2 frontmatter (already computed via `render`)
- Produces: DOM structure `<div id="guide-panels">` containing 7 `<div class="guide-panel" data-island="...">` with rendered HTML; CSS for panel transitions and mobile layout

- [ ] **Step 1: Add panels div inside `guide-container`**

In `src/pages/guide.astro`, replace the comment `<!-- Content panels injected in Task 3 -->` with:

```astro
      <div id="guide-panels" class="guide-panels" aria-live="polite">
        <button id="panel-close" class="panel-close" aria-label="关闭面板">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
        {panels.map(({ data, Content }) => (
          <div
            class="guide-panel"
            data-island={data.island}
            hidden
            role="region"
            aria-label={data.title}
          >
            <h2 class="panel-title">{data.title}</h2>
            {data.placeholder && (
              <p class="panel-placeholder">内容整理中……</p>
            )}
            <div class="panel-body">
              <Content />
            </div>
          </div>
        ))}
      </div>
```

- [ ] **Step 2: Expand `<style>` block with panels + mobile CSS**

Replace the existing `<style>` block in `src/pages/guide.astro` with:

```astro
<style>
  /* ── Page ── */
  .guide-page {
    padding-top: 32px;
    padding-bottom: 64px;
  }
  .guide-header {
    margin-bottom: 24px;
  }
  .guide-title {
    font-family: var(--disp);
    font-size: 2rem;
    margin: 0 0 4px;
  }
  .guide-sub {
    color: var(--muted);
    margin: 0;
    font-size: 0.9rem;
  }

  /* ── Container ── */
  .guide-container {
    display: flex;
    border: 3px solid var(--ink);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    background: var(--paper);
    min-height: 360px;
  }

  /* ── Map ── */
  .map-wrapper {
    flex: 1 1 100%;
    min-width: 0;
    transition: flex-basis 0.4s ease;
  }
  .guide-container.panel-open .map-wrapper {
    flex-basis: 58%;
  }
  #map-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  /* ── Island interactive ── */
  .island-group {
    cursor: pointer;
  }
  .island-group:hover > polygon:first-child,
  .island-group:focus > polygon:first-child {
    stroke-width: 3.5px;
  }
  .island-group:focus {
    outline: none;
  }

  /* ── SVG text ── */
  .island-label {
    font-family: var(--disp);
    font-size: 13px;
    fill: var(--ink);
    letter-spacing: 0.04em;
    pointer-events: none;
    user-select: none;
  }
  .plate-title {
    font-family: var(--disp);
    font-size: 18px;
    fill: var(--ink);
  }
  .plate-sub {
    font-family: var(--lat);
    font-size: 11px;
    fill: var(--muted);
  }

  /* ── Panels ── */
  .guide-panels {
    flex: 0 0 0%;
    overflow: hidden;
    border-left: 3px solid var(--ink);
    background: var(--paper);
    transition: flex-basis 0.35s ease-out;
    position: relative;
  }
  .guide-container.panel-open .guide-panels {
    flex: 0 0 42%;
    overflow-y: auto;
  }
  .guide-panel {
    padding: 40px 28px 48px;
  }
  .panel-close {
    position: sticky;
    top: 12px;
    left: calc(100% - 44px);
    display: block;
    width: 32px;
    height: 32px;
    border: 2px solid var(--ink);
    background: var(--bg);
    cursor: pointer;
    padding: 4px;
    box-shadow: var(--shadow-sm);
    color: var(--ink);
    margin: 12px 12px 0 auto;
  }
  .panel-close:hover {
    background: var(--ink);
    color: var(--paper);
  }
  .panel-close svg {
    width: 100%;
    height: 100%;
  }
  .panel-title {
    font-family: var(--disp);
    font-size: 1.6rem;
    margin: 0 0 20px;
    border-bottom: 2px solid var(--ink);
    padding-bottom: 12px;
  }
  .panel-placeholder {
    color: var(--muted);
    font-style: italic;
  }

  /* panel body: markdown content (use :global for rendered HTML) */
  .guide-panel :global(.panel-body h2) {
    font-family: var(--disp);
    font-size: 1rem;
    margin: 20px 0 8px;
    color: var(--muted);
    letter-spacing: 0.05em;
  }
  .guide-panel :global(.panel-body p) {
    margin: 0 0 12px;
    line-height: 1.7;
  }
  .guide-panel :global(.panel-body ol),
  .guide-panel :global(.panel-body ul) {
    padding-left: 1.4em;
    margin: 0 0 12px;
    line-height: 1.8;
  }
  .guide-panel :global(.panel-body strong) {
    font-weight: 700;
  }

  /* ── Boat bob ── */
  @keyframes boat-bob {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-4px); }
  }
  #boat.bobbing {
    animation: boat-bob 300ms ease-in-out;
  }

  /* ── Mobile ── */
  @media (max-width: 767px) {
    .guide-container {
      flex-direction: column;
      min-height: auto;
    }
    .guide-container.panel-open .map-wrapper {
      flex-basis: auto;
    }
    .guide-panels {
      border-left: none;
      border-top: 3px solid var(--ink);
      max-height: 65vh;
      transition: max-height 0.35s ease-out;
      overflow-y: auto;
    }
    .guide-container.panel-open .guide-panels {
      flex: none;
      max-height: 65vh;
      overflow-y: auto;
    }
    .panel-close {
      position: sticky;
      top: 8px;
    }
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .map-wrapper,
    .guide-panels {
      transition: none;
    }
    #boat.bobbing {
      animation: none;
    }
  }
</style>
```

- [ ] **Step 3: Build and verify panels in output**

```bash
npm run build 2>&1 | tail -10
```

Expected: no errors.

```bash
grep -c 'guide-panel' dist/guide/index.html
```

Expected: `7` (one per island).

```bash
grep 'panel-title' dist/guide/index.html | head -5
```

Expected: contains `喜欢的人物`, `个人兴趣`, etc.

- [ ] **Step 4: Commit**

```bash
git add src/pages/guide.astro
git commit -m "feat(guide): add content panels and full CSS layout"
```

---

## Task 4: Animation JavaScript

**Files:**
- Modify: `src/pages/guide.astro` — add `<script is:inline>` before `</BaseLayout>`

**Interfaces:**
- Consumes: DOM elements `#guide-container`, `#map-wrapper`, `#guide-panels`, `#boat`, `#wake`, `#panel-close`, `.island-group[data-island]`, `.guide-panel[data-island]`
- Produces: full interaction — boat sails Bézier arc to clicked island → panels open/close → wake trail accumulates

- [ ] **Step 1: Add the inline script**

In `src/pages/guide.astro`, add the following block immediately before `</BaseLayout>`:

```astro
<script is:inline>
(function () {
  /* ── Constants ── */
  const HOME = { x: 470, y: 270 };
  const CENTERS = {
    'people':           { x: 111,  y: 90  },
    'philosophy':       { x: 303,  y: 80  },
    'interests':        { x: 115,  y: 240 },
    'travel':           { x: 295,  y: 228 },
    'info-sources':     { x: 647,  y: 133 },
    'knowledge-gaps':   { x: 792,  y: 258 },
    'fragmented-time':  { x: 662,  y: 393 },
  };
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── State ── */
  let pos = { ...HOME };      // current boat position in SVG coords
  let activeIsland = null;    // currently open island id
  let animating = false;
  const wakePoints = [];      // accumulated wake trail

  /* ── DOM refs ── */
  const boat       = document.getElementById('boat');
  const wake       = document.getElementById('wake');
  const container  = document.getElementById('guide-container');
  const panels     = document.getElementById('guide-panels');
  const closeBtn   = document.getElementById('panel-close');

  /* ── Bézier helpers ── */
  function quadBez(p0, cp, p1, t) {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * cp.x + t * t * p1.x,
      y: u * u * p0.y + 2 * u * t * cp.y + t * t * p1.y,
    };
  }

  function controlPoint(from, to) {
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const offset = Math.min(90, len * 0.28);
    return { x: mx - (dy / len) * offset, y: my + (dx / len) * offset };
  }

  function duration(from, to) {
    return Math.max(900, Math.min(1400, Math.hypot(to.x - from.x, to.y - from.y) * 2));
  }

  /* ── Boat transform ── */
  function setBoat(p, angle) {
    boat.setAttribute(
      'transform',
      `translate(${p.x.toFixed(2)},${p.y.toFixed(2)}) rotate(${angle.toFixed(1)})`
    );
  }

  /* ── Animate boat from `from` to `to` then call `done()` ── */
  function sail(from, to, done) {
    if (REDUCED) {
      pos = { ...to };
      setBoat(to, 0);
      done();
      return;
    }
    animating = true;
    const cp = controlPoint(from, to);
    const dur = duration(from, to);
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const p = quadBez(from, cp, to, t);

      // rotation: point boat toward next position
      const ahead = quadBez(from, cp, to, Math.min(t + 0.02, 1));
      const angle = Math.atan2(ahead.y - p.y, ahead.x - p.x) * (180 / Math.PI);

      setBoat(p, angle);

      wakePoints.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      wake.setAttribute('points', wakePoints.join(' '));

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        pos = { ...to };
        animating = false;
        done();
      }
    }
    requestAnimationFrame(tick);
  }

  /* ── Panel open/close ── */
  function showPanel(islandId) {
    // hide all panels, show the target
    document.querySelectorAll('.guide-panel').forEach((el) => {
      el.hidden = true;
    });
    const target = panels.querySelector(`.guide-panel[data-island="${islandId}"]`);
    if (target) target.hidden = false;

    container.classList.add('panel-open');

    // on mobile, scroll panel into view
    if (window.innerWidth < 768) {
      setTimeout(() => panels.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  }

  function hidePanel() {
    container.classList.remove('panel-open');
    // wait for CSS transition before hiding
    setTimeout(() => {
      document.querySelectorAll('.guide-panel').forEach((el) => {
        el.hidden = true;
      });
    }, 380);
  }

  /* ── Island click ── */
  function handleIslandClick(islandId) {
    if (animating) return;
    if (activeIsland === islandId) {
      // second click on same island → close
      activeIsland = null;
      hidePanel();
      sail(pos, HOME, () => {});
      return;
    }
    activeIsland = islandId;
    const target = CENTERS[islandId];
    if (!target) return;

    sail(pos, target, () => {
      // bob
      boat.classList.add('bobbing');
      setTimeout(() => boat.classList.remove('bobbing'), 600);
      showPanel(islandId);
    });
  }

  /* ── Close button ── */
  closeBtn?.addEventListener('click', () => {
    if (animating) return;
    activeIsland = null;
    hidePanel();
    sail(pos, HOME, () => {});
  });

  /* ── Wire up islands ── */
  document.querySelectorAll('.island-group[data-island]').forEach((el) => {
    const id = el.dataset.island;
    el.addEventListener('click', () => handleIslandClick(id));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleIslandClick(id);
      }
    });
  });
})();
</script>
```

- [ ] **Step 2: Build to confirm no syntax errors**

```bash
npm run build 2>&1 | grep -i error
```

Expected: no output (no errors).

- [ ] **Step 3: Start dev server and test manually**

```bash
npm run dev
```

Open `http://localhost:4321/guide` and verify:
- [ ] Map renders with 7 islands, boat at home port
- [ ] Clicking an island causes boat to sail along a curved path
- [ ] Wake trail (dashed red line) appears and accumulates across clicks
- [ ] Panel slides in from the right (desktop) or bottom (mobile)
- [ ] Close button sails boat back to home port
- [ ] Clicking the same island again closes the panel
- [ ] Visiting multiple islands accumulates wake trail
- [ ] Dark mode renders correctly (SVG uses `var(--ink)`, `var(--paper)`, etc.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/guide.astro
git commit -m "feat(guide): add boat animation and panel interaction script"
```

---

## Self-Review

**Spec coverage:**
- ✅ 7 islands (4 personal + 3 info) — Task 1
- ✅ SVG nautical-chart map, viewBox 900×520 — Task 2
- ✅ Boat at home port, gold sail, ink hull — Task 2
- ✅ Wake trail accumulates in `--seal` dashed stroke — Task 4
- ✅ Bézier arc animation, distance-adaptive duration — Task 4
- ✅ Bob animation on arrival — Task 4
- ✅ Right-side panel, 58/42 split, CSS transition — Task 3
- ✅ Mobile bottom sheet (65vh, border-top) — Task 3
- ✅ `prefers-reduced-motion` → instant move — Task 4
- ✅ `role="button"` + `tabindex="0"` + keyboard `Enter`/`Space` — Task 4
- ✅ Compass rose, map title plate — Task 2
- ✅ Gold tint on 旅行计划 + 喜欢的人物 — Task 2
- ✅ Nav link — Task 2
- ✅ Placeholder content for 3 info islands — Task 1

**Type consistency:** `data-island` attribute values match keys in `CENTERS` object exactly and match `island:` frontmatter values. Verified: `people`, `philosophy`, `interests`, `travel`, `info-sources`, `knowledge-gaps`, `fragmented-time`.

**No placeholders:** All code blocks are complete. No TBD/TODO present.
