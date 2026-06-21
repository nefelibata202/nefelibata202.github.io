# Collections Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为书影页面增加客户端分页，每页 30 条，与现有筛选/排序/搜索联动。

**Architecture:** 扩展 `collections.astro` 内的 `is:inline` script，在现有 `apply()` 函数中追加分页切片逻辑；在 `.mlib-meta` 之后插入分页栏 HTML；在 `global.css` 中添加分页栏样式。所有变更限于两个文件，不引入框架或额外 HTTP 请求。

**Tech Stack:** Astro 5, vanilla JS (is:inline), CSS custom properties

## Global Constraints

- 不新增文件，不引入 `client:*` 指令
- PAGE_SIZE = 30（常量，不可配置化）
- 样式使用现有 CSS 变量（`--line`、`--seal`、`--fg`、`--muted`、`--mono`）
- 修改只涉及 `src/pages/collections.astro` 和 `src/styles/global.css`

---

### Task 1: 添加分页栏样式

**Files:**
- Modify: `src/styles/global.css`（在 `.mlib-meta` 样式块附近追加）

**Interfaces:**
- Produces: `.mpager`、`.mpager-btn`、`.mpager-info` CSS 类，供 Task 2 的 HTML 使用

- [ ] **Step 1: 找到 `.mlib-meta` 样式行**

  ```bash
  grep -n "mlib-meta" /Users/evan/Downloads/Softwares/my_website/src/styles/global.css
  ```

  预期输出类似：`403:.mlib-meta { ... }`

- [ ] **Step 2: 在 `.mlib-meta` 样式块之后追加分页栏样式**

  在 `.mlib-meta` 相关行的**末尾**之后插入（紧接其后）：

  ```css
  .mpager { display: flex; align-items: center; gap: 12px; margin: 0 0 20px; }
  .mpager-btn { font-family: var(--mono); font-size: .82rem; font-weight: 600; background: none; border: 2px solid var(--line); padding: 5px 14px; cursor: pointer; color: var(--fg); transition: background .12s, color .12s; }
  .mpager-btn:hover:not(:disabled) { background: var(--seal); color: #fff; border-color: var(--seal); }
  .mpager-btn:disabled { opacity: .35; cursor: default; }
  .mpager-info { font-family: var(--mono); font-size: .86rem; color: var(--muted); flex: 1; text-align: center; }
  ```

- [ ] **Step 3: 验证样式语法**

  ```bash
  cd /Users/evan/Downloads/Softwares/my_website && npm run build 2>&1 | tail -20
  ```

  预期：build 成功，无 CSS 报错。

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/evan/Downloads/Softwares/my_website && git add src/styles/global.css && git commit -m "style: add pagination bar styles for collections page"
  ```

---

### Task 2: 插入分页栏 HTML 并更新 inline script

**Files:**
- Modify: `src/pages/collections.astro`（HTML 结构 + script 两处）

**Interfaces:**
- Consumes: `.mpager`、`.mpager-btn`、`.mpager-info`（来自 Task 1）
- Consumes: 现有 `state`、`cards`、`grid`、`count`、`none` 变量
- Produces: 带分页的 `apply()` 函数

- [ ] **Step 1: 插入分页栏 HTML**

  在 `collections.astro` 中找到 `<div class="mlib">` 这一行（约第 122 行），在其**前面**插入：

  ```html
  <div class="mpager" id="mpager" hidden>
    <button type="button" class="mpager-btn" id="mprev" aria-label="上一页">← 上一页</button>
    <span class="mpager-info" id="mpinfo">第 1 / 1 页</span>
    <button type="button" class="mpager-btn" id="mnext" aria-label="下一页">下一页 →</button>
  </div>
  ```

- [ ] **Step 2: 更新 inline script 中的常量与 state**

  在 script 开头（`const grid = ...` 之后），找到 `const state = { ... }` 这一行，替换为：

  ```js
  const PAGE_SIZE = 30;
  const state = { type: '*', score: '*', cat: '*', decade: '*', status: '*', q: '', sort: 'score', page: 0 };
  ```

- [ ] **Step 3: 在 script 中获取分页栏 DOM 引用**

  在获取 `search`、`count` 等引用的位置（`const search = ...` 附近），追加：

  ```js
  const pager = document.getElementById('mpager');
  const pprev = document.getElementById('mprev');
  const pnext = document.getElementById('mnext');
  const pinfo = document.getElementById('mpinfo');
  ```

- [ ] **Step 4: 替换 `apply()` 函数体**

  找到现有 `const apply = () => { ... };` 整个函数体，替换为：

  ```js
  const apply = () => {
    const vis = cards.filter((c) => visible(c));
    vis.sort((a, b) => {
      if (state.sort === 'score') return (b.dataset.score - a.dataset.score) || b.dataset.year.localeCompare(a.dataset.year);
      if (state.sort === 'year') return (b.dataset.year || '').localeCompare(a.dataset.year || '') || (b.dataset.score - a.dataset.score);
      return a.querySelector('.pt').textContent.localeCompare(b.querySelector('.pt').textContent, 'zh');
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
  ```

- [ ] **Step 5: 注册翻页按钮事件**

  在所有现有事件监听器注册之后（`search?.addEventListener` 之后），追加：

  ```js
  pprev?.addEventListener('click', () => {
    if (state.page > 0) { state.page--; apply(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  pnext?.addEventListener('click', () => {
    const totalPages = Math.ceil(cards.filter((c) => visible(c)).length / PAGE_SIZE);
    if (state.page < totalPages - 1) { state.page++; apply(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  ```

- [ ] **Step 6: 在所有触发 apply() 的地方先重置 page**

  找到以下三处，在调用 `apply()` **之前**插入 `state.page = 0;`：

  1. `[data-facet]` 按钮 click 监听器内（`state[f] = btn.dataset.val;` 之后，`apply();` 之前）
  2. `[data-sort]` 按钮 click 监听器内（`state.sort = btn.dataset.sort;` 之后，`apply();` 之前）
  3. `mreset` 按钮 click 监听器内（`Object.assign(state, {...})` 之后，`apply();` 之前）
  4. 搜索防抖回调内（`state.q = ...` 之后，`apply();` 之前）

- [ ] **Step 7: 构建验证**

  ```bash
  cd /Users/evan/Downloads/Softwares/my_website && npm run build 2>&1 | tail -20
  ```

  预期：build 成功，无报错。

- [ ] **Step 8: 启动 dev server 手动验证**

  ```bash
  cd /Users/evan/Downloads/Softwares/my_website && npm run dev
  ```

  打开 `http://localhost:4321/collections`，逐项验证：

  - [ ] 首次加载：显示前 30 条，分页栏可见，显示「第 1 / N 页」，「← 上一页」禁用
  - [ ] 点击「下一页 →」：显示第 31–60 条，页面平滑滚动到卡片区顶部，「← 上一页」变为可用
  - [ ] 在末页：「下一页 →」禁用
  - [ ] 切换筛选 chip：分页重置回第 1 页
  - [ ] 搜索关键词：分页重置回第 1 页
  - [ ] 筛选结果 ≤ 30 条：分页栏隐藏
  - [ ] 点击「清除筛选」：回到第 1 页，分页栏恢复

- [ ] **Step 9: Commit**

  ```bash
  cd /Users/evan/Downloads/Softwares/my_website && git add src/pages/collections.astro && git commit -m "feat: add client-side pagination to collections page (30 items/page)"
  ```
