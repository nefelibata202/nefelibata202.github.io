# 书影页面分页功能 — Design Spec

**Date:** 2026-06-21  
**Status:** Approved

## Overview

为 `/collections`（书影）页面增加客户端分页，每页固定显示 30 条（约桌面端 6 行），与现有的筛选、排序、搜索功能无缝联动。

## Scope

- 修改文件：`src/pages/collections.astro`（inline script + HTML 结构）
- 修改文件：`src/styles/global.css`（分页栏样式）
- 不新增文件，不引入框架或额外 HTTP 请求

## Constants

```
PAGE_SIZE = 30
```

## State

在现有 `state` 对象中新增一个字段：

```js
const state = { type: '*', score: '*', cat: '*', decade: '*', status: '*', q: '', sort: 'score', page: 0 };
```

`page` 为 0-indexed 当前页号。

## Logic Changes（`apply()` 函数）

1. 筛选得到 `vis[]`（同现有逻辑，不变）
2. 排序 `vis[]`（同现有逻辑，不变）
3. **新增**：计算总页数 `totalPages = Math.ceil(vis.length / PAGE_SIZE)`，若 `state.page >= totalPages` 则钳位到 `Math.max(0, totalPages - 1)`
4. **新增**：切片 `pageItems = vis.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE)`
5. 将所有卡片 `hidden = true`，再将 `pageItems` 中的卡片 `hidden = false`，并按排序顺序 `appendChild` 到 grid（保持现有 DOM 操作方式）
6. `mcount` 显示 `vis.length`（总筛选数量，非当前页数量）
7. **新增**：更新分页栏 UI（见下）

## Page Reset

以下任何操作触发时，先将 `state.page = 0`，再调用 `apply()`：

- 点击任意筛选 chip（`[data-facet]`）
- 点击任意排序按钮（`[data-sort]`）
- 搜索框 input 事件
- 点击「清除筛选」按钮

## HTML 结构

在 `.mlib-meta`（计数 + 清除筛选行）**之后**、`div.mlib`（含 pgrid）**之前**插入分页栏：

```html
<div class="mpager" id="mpager" hidden>
  <button type="button" class="mpager-btn" id="mprev" aria-label="上一页">← 上一页</button>
  <span class="mpager-info" id="mpinfo">第 1 / 1 页</span>
  <button type="button" class="mpager-btn" id="mnext" aria-label="下一页">下一页 →</button>
</div>
```

## Pagination Bar Update（`updatePager(vis)`）

```
totalPages = Math.ceil(vis.length / PAGE_SIZE)
if totalPages <= 1:
    mpager.hidden = true
    return
mpager.hidden = false
mprev.disabled = (state.page === 0)
mnext.disabled = (state.page === totalPages - 1)
mpinfo.textContent = `第 ${state.page + 1} / ${totalPages} 页`
```

上/下一页按钮点击：

```
prev: if state.page > 0 → state.page-- → apply() → scrollToGrid()
next: if state.page < totalPages-1 → state.page++ → apply() → scrollToGrid()
```

`scrollToGrid()`：翻页后平滑滚动到 pgrid 顶部（`pgrid.scrollIntoView({ behavior: 'smooth', block: 'start' })`）。

## Styles（`global.css`）

新增 `.mpager` 相关样式，插入在 `.mlib-meta` 样式附近：

```css
.mpager {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 20px;
}
.mpager-btn {
  font-family: var(--mono);
  font-size: .82rem;
  font-weight: 600;
  background: none;
  border: 2px solid var(--line);
  padding: 5px 14px;
  cursor: pointer;
  color: var(--fg);
  transition: background .12s, color .12s;
}
.mpager-btn:hover:not(:disabled) {
  background: var(--seal);
  color: #fff;
  border-color: var(--seal);
}
.mpager-btn:disabled {
  opacity: .35;
  cursor: default;
}
.mpager-info {
  font-family: var(--mono);
  font-size: .86rem;
  color: var(--muted);
  flex: 1;
  text-align: center;
}
```

## Behavior Summary

| 操作 | 结果 |
|------|------|
| 首次加载 | 显示第 1 页（30 条） |
| 切换筛选/排序/搜索 | 重置到第 1 页，重新分页 |
| 清除筛选 | 重置到第 1 页 |
| 筛选结果 ≤ 30 条 | 分页栏隐藏 |
| 翻页 | 平滑滚动到 pgrid 顶部 |
| mcount 显示 | 总筛选数量（不受分页影响） |

## Out of Scope

- URL 中不记录页码（无 `?page=2` 参数）
- 不做页码数字按钮（仅上一页/下一页）
- 不做每页条数切换
