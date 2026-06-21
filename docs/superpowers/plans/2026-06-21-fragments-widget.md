# 碎片时间提醒部件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "碎片时间可以做的事" card to the home page main column, below the recent articles list, listing six activities with emoji and optional links.

**Architecture:** Three-file change — a new JSON data file, inline template additions to `index.astro`, and new CSS rules in `global.css`. No JS, no new components, no new dependencies.

**Tech Stack:** Astro 5 (static), vanilla CSS (CSS custom properties), JSON

## Global Constraints

- Zero client-side JS — no `<script>` tags, no `client:*` directives
- No new component files — render inline in `index.astro`
- CSS must use existing custom properties (`var(--line)`, `var(--gold)`, `var(--paper)`, `var(--soft)`, `var(--hair)`, `var(--ink)`, `var(--on-gold)`, `var(--shadow)`, `var(--disp)`, `var(--mono)`)
- External links must include `target="_blank" rel="noopener noreferrer"`
- Neo-brutalist card style: `border: 3px solid var(--line)`, `box-shadow: var(--shadow)` (6px offset), gold header row

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/data/fragments.json` | Create | Six activity items (emoji, label, optional url) |
| `src/styles/global.css` | Modify | Add `.fragments` CSS rules after line 303 (end of `.profile` block) |
| `src/pages/index.astro` | Modify | Import JSON; render `.fragments` card below `.ledger` |

---

### Task 1: Data file + CSS rules

**Files:**
- Create: `src/data/fragments.json`
- Modify: `src/styles/global.css` (insert after line 303)

**Interfaces:**
- Produces: `fragments` array type `{ emoji: string; label: string; url?: string }[]` consumed by Task 2

- [ ] **Step 1: Create `src/data/fragments.json`**

```json
[
  { "emoji": "📺", "label": "哔哩哔哩看喜欢的 UP 主视频", "url": "https://www.bilibili.com" },
  { "emoji": "✍️", "label": "归来网站文章浏览 & 知识库缺口汇总", "url": "https://nefelibata202.github.io" },
  { "emoji": "🎬", "label": "豆瓣挖掘想看的影视、书籍资源", "url": "https://www.douban.com" },
  { "emoji": "📖", "label": "微信读书阅读书籍" },
  { "emoji": "📰", "label": "浏览高质量的信息源" },
  { "emoji": "💬", "label": "ChatGPT 询问感兴趣的问题", "url": "https://chat.openai.com" }
]
```

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/fragments.json','utf8')).length + ' items')"
```

Expected output: `6 items`

- [ ] **Step 3: Add `.fragments` CSS rules to `src/styles/global.css`**

Insert the following block immediately after line 303 (`.profile .psocial svg { width: 17px; height: 17px; }`), before the `/* ---------- 首页区块标题 ---------- */` comment:

```css
/* ---------- 碎片时间提醒卡 ---------- */
.fragments { border: 3px solid var(--line); background: var(--paper); box-shadow: var(--shadow); margin-top: 28px; }
.fragments .frag-head { background: var(--gold); border-bottom: 3px solid var(--line); padding: 14px 18px; display: flex; align-items: center; gap: 8px; font-family: var(--disp); font-weight: 700; font-size: 1rem; color: var(--on-gold); }
.fragments .frag-item { display: flex; align-items: center; gap: 12px; padding: 12px 18px; color: var(--ink); text-decoration: none; }
.fragments .frag-item + .frag-item { border-top: 1px solid var(--hair); }
.fragments a.frag-item { transition: .12s; }
.fragments a.frag-item:hover { background: var(--soft); transform: translate(-2px, -2px); box-shadow: 3px 3px 0 var(--line); }
.fragments .frag-ico { font-size: 1.2rem; flex: 0 0 auto; line-height: 1; }
.fragments .frag-lbl { font-size: .9rem; line-height: 1.4; }
```

- [ ] **Step 4: Commit**

```bash
git add src/data/fragments.json src/styles/global.css
git commit -m "feat: add fragments data + CSS for 碎片时间提醒卡"
```

---

### Task 2: Template rendering + build verification

**Files:**
- Modify: `src/pages/index.astro` (frontmatter import + template block)

**Interfaces:**
- Consumes: `src/data/fragments.json` — array of `{ emoji: string; label: string; url?: string }`
- Consumes: `.fragments`, `.frag-head`, `.frag-item`, `.frag-ico`, `.frag-lbl` CSS classes from Task 1

- [ ] **Step 1: Add JSON import to `src/pages/index.astro` frontmatter**

In the frontmatter block (between the `---` fences), add this import after the existing imports:

```ts
import fragments from '../data/fragments.json';
```

The top of the frontmatter should look like:

```ts
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import subsetGui from 'cn-fontsource-smiley-sans-oblique-regular/L1_5e37_192.woff2?url';
import subsetLai from 'cn-fontsource-smiley-sans-oblique-regular/L1_65b1_192.woff2?url';
import fragments from '../data/fragments.json';
// ... rest of frontmatter unchanged
```

- [ ] **Step 2: Add the widget template below `.ledger` in `src/pages/index.astro`**

Find this closing block in the template (around line 86–87):

```astro
      )}
    </div>
```

That closing `</div>` ends `.home-main`. Insert the `.fragments` card before it, so it appears below the articles list inside `.home-main`:

```astro
      )}

      <div class="fragments">
        <div class="frag-head"><span>⚡</span> 碎片时间可以做的事</div>
        {fragments.map((f) =>
          f.url
            ? <a class="frag-item" href={f.url} target="_blank" rel="noopener noreferrer">
                <span class="frag-ico">{f.emoji}</span>
                <span class="frag-lbl">{f.label}</span>
              </a>
            : <div class="frag-item">
                <span class="frag-ico">{f.emoji}</span>
                <span class="frag-lbl">{f.label}</span>
              </div>
        )}
      </div>
    </div>
```

- [ ] **Step 3: Build and verify output**

```bash
npm run build 2>&1 | tail -5
```

Expected: build completes with no errors, ends with something like `dist/ built`.

- [ ] **Step 4: Grep the built output for the widget**

```bash
grep -o 'frag-head\|碎片时间\|哔哩哔哩\|豆瓣' dist/index.html
```

Expected output (order may vary):

```
frag-head
碎片时间
哔哩哔哩
豆瓣
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): 碎片时间提醒卡 — 首页主内容区新增活动清单"
```
