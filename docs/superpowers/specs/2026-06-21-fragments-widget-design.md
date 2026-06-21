# 碎片时间提醒部件 设计文档

**日期：** 2026-06-21  
**状态：** 已批准，待实现

---

## 概述

在归来网站首页主内容区（文章列表下方）新增一张"碎片时间可以做的事"卡片，提醒 Evan 在碎片化时间可以进行的活动。卡片公开展示，风格与首页 `.profile` 卡同族（neo-brutalist：实色边框 + 偏移硬阴影 + 金色标题行）。

---

## 数据

新建 `src/data/fragments.json`，数组结构：

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

字段规则：
- `emoji`：必填，条目前图标
- `label`：必填，活动描述
- `url`：选填，有则整行可点链接，无则纯文本

---

## 视觉设计

```
┌─────────────────────────────────────────┐  ← 3px 实色边框 + 6px 偏移阴影
│ ⚡ 碎片时间可以做的事          [金色标题行] │
├─────────────────────────────────────────┤
│  📺  哔哩哔哩看喜欢的 UP 主视频           │
│  ✍️  归来网站文章浏览 & 知识库缺口汇总    │
│  🎬  豆瓣挖掘想看的影视、书籍资源        │
│  📖  微信读书阅读书籍                    │
│  📰  浏览高质量的信息源                  │
│  💬  ChatGPT 询问感兴趣的问题            │
└─────────────────────────────────────────┘
```

样式细节：
- **卡片外框**：`border: 3px solid var(--line)`，`box-shadow: var(--shadow)`（6px 偏移），`background: var(--paper)`
- **标题行**：`background: var(--gold)`，`border-bottom: 3px solid var(--line)`，`padding: 14px 18px`；左侧 ⚡ emoji + "碎片时间可以做的事"，字体 `var(--disp)`（得意黑）
- **条目间隔**：`border-top: 1px solid var(--hair)` 细线
- **有 url 的条目**：`<a>` 标签，整行 `padding: 12px 18px`，hover 时 `transform: translate(-2px, -2px)` + `box-shadow: 3px 3px 0 var(--line)`（与 `.psocial a:hover` 同款动效）
- **无 url 的条目**：`<div>` 标签，同等 padding，无交互态
- **卡片与上方文章列表间距**：`margin-top: 28px`

---

## 实现范围

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/data/fragments.json` | 新建 | 六条活动数据 |
| `src/pages/index.astro` | 修改 | 顶部 import + `.ledger` 下方内联渲染卡片 |
| `src/styles/global.css` | 修改 | 新增 `.fragments` 系列规则（约 15 行） |

无新组件文件，无 JS，无新页面，无新依赖。

---

## 不在范围内

- 随机高亮某条（需 JS，用户未选）
- 后台管理界面（直接改 JSON 即可）
- 移动端独立样式（沿用现有响应式断点，自然折叠）
