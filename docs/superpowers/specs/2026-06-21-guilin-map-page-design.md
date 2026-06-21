# 归图页面设计文档

**日期：** 2026-06-21  
**状态：** 待实现  
**路由：** `/guide`

---

## 概述

"归图"是一张可交互的航海图风格页面，作为个人导览入口。页面上有 5 座风格化岛屿，一艘小船停在中央"母港"。用户点击任意岛屿，船只沿贝塞尔曲线驶向目标，抵达后右侧面板（移动端为底部抽屉）展开显示该岛的内容。

---

## 内容

5 座岛屿，各对应一个个人导览主题：

| 岛屿 ID | 显示名 | 说明 |
|---------|--------|------|
| `travel` | 旅游计划 | 旅行目的地、计划、游记 |
| `worldview` | 三观 | 价值观、世界观、人生观的梳理 |
| `info-sources` | 高质量的信息源 | 值得订阅的媒体、播客、作者等 |
| `knowledge-gaps` | 知识库缺口 | 想补但还没补的知识领域清单 |
| `people` | 喜欢的人物 | 对我有影响的人物 |

内容以 Markdown 存储于 `src/content/guide/`（新集合），每个文件对应一座岛屿。

---

## 视觉设计

### 色彩 Token（在现有 token 基础上扩充）

| 变量 | 值 | 用途 |
|------|----|------|
| `--sea` | `#C4B99A` | 海面底色，比 `--bg` 深一档 |
| `--island-gold` | `rgba(242,179,18,0.18)` | 旅游计划、喜欢的人物的岛屿叠色 |
| `--wake-dash` | `4 6`（stroke-dasharray） | 朱砂航迹虚线节奏 |

- 岛屿填色：`--paper`，描边 `2px --ink`
- 船帆：`--gold`；船身：`--ink`
- 航迹线：`--seal`，虚线，随航行实时延伸
- 地图外框：`3px --ink border + --shadow-lg`（新粗野标准）

### 字体

- 岛屿标签：得意黑（`--disp`）13px，字间距 0.04em
- 面板标题：得意黑 26px
- 面板正文：`--zh` 系统字，16px，行高 1.75
- 地图铭牌（左下角）：Archivo + 得意黑混排，仿旧航海图说明风格

### SVG 地图布局（参考坐标，viewBox 800×500）

```
(0,0)──────────────────────────────(800,0)
  │                                      │
  │  旅游计划(150,120)   三观(580,100)   │
  │                                      │
  │           [母港⛵](400,280)          │
  │                                      │
  │  知识缺口(180,380)                   │
  │              信息源(520,360)         │
  │                       人物(660,250)  │
  │                                      │
(0,500)────────────────────────────(800,500)
```

- 左下角：图例铭牌 + 比例尺装饰
- 右下角：罗盘玫瑰（金色，纯装饰）

### 签名元素

**可积累的航迹：** 船只每次驶向一座岛，都在地图上留下永久的朱砂虚线。用户访问的岛屿越多，图面上的航线越丰富。刷新重置，每次"归来"都是全新航行。

---

## 技术架构

### 选型

SVG 地图 + `requestAnimationFrame` 参数化贝塞尔曲线动画 + Astro 服务端渲染内容面板。

- 动画：纯 JS 参数化贝塞尔，动态计算从当前位置到目标的弧线（偏移量 80–120px）
- 内容：`getCollection('guide')` 在构建期渲染，写入隐藏 `<div data-island="...">`
- 交互脚本：单个 `<script is:inline>` 约 120 行

### 新增文件

```
src/content/guide/
  travel.md
  worldview.md
  info-sources.md
  knowledge-gaps.md
  people.md

src/pages/guide.astro          ← 新页面
```

### 修改文件

```
src/content.config.ts          ← 新增 guide collection
src/components/Nav.astro       ← 添加"归图"导航链接
```

### Content Collection Schema

```ts
const guide = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guide' }),
  schema: z.object({
    title: z.string(),
    island: z.string(),         // 对应 SVG 岛屿 id
    goldTint: z.boolean().default(false),
  }),
});
```

### 数据流

```
构建时：
  getCollection('guide')
    → 5 个 <div data-island="travel"> 隐藏面板
    → 内容已完全渲染为 HTML

运行时：
  用户点击岛屿 SVG 元素
    → JS 读取 dataset.island
    → 计算贝塞尔弧线（当前位置 → 目标岛屿中心）
    → requestAnimationFrame 推进 t: 0→1
      → 更新 boat transform
      → 追加 wake polyline points
    → t=1 时：
      → 岛屿 "锚定" bob 动画（CSS keyframe）
      → 对应面板 display:block + slide-in transition
      → map 容器 flex-basis 60% → 面板 flex-basis 40%
  用户点击关闭：
    → 面板收起
    → 船沿新弧线返回母港
    → map 容器还原 100%
```

### 动画参数

| 参数 | 值 |
|------|----|
| 航行帧率 | rAF（~60fps） |
| 动画时长 | 距离自适应，约 900–1400ms |
| 贝塞尔控制点偏移 | 路径中点垂直偏移 90px |
| 抵达 bob 动画 | CSS：translateY 0→-4px→0，300ms |
| 面板 slide-in | CSS transform translateX(100%)→0，350ms ease-out |

---

## 布局

### 桌面（≥768px）

```
┌──────────────────────────────────────────────────────┐
│ NAV                                                   │
├──────────────────────────────────────────────────────┤
│ 归图 · 个人导览                           [小副标题]  │
├─────────────────────────┬────────────────────────────┤
│                         │                            │
│   SVG 地图              │   内容面板                 │
│   （初始 100%，         │   3px ink 左边框           │
│    面板展开后 60%）      │   shadow-lg                │
│                         │   （初始隐藏）             │
│                         │                            │
└─────────────────────────┴────────────────────────────┘
```

### 移动端（<768px）

```
┌─────────────────────────┐
│ NAV                     │
├─────────────────────────┤
│   SVG 地图（全宽）       │
├─────────────────────────┤
│   底部抽屉 65vh          │ ← 点击岛屿后上滑
│   拖拽把手              │
│   岛屿名 + 内容          │
└─────────────────────────┘
```

---

## 可访问性

- 所有岛屿 SVG 元素加 `role="button"` + `tabindex="0"` + `aria-label`
- `prefers-reduced-motion`：禁用动画，直接显示内容面板；船只瞬移
- 面板内容完全可被屏幕阅读器读取（服务端渲染 HTML）

---

## 不包含

- 不做水波纹/粒子效果（Canvas 方案才有，当前方案不包含）
- 不做跨刷新的航迹持久化（localStorage 可作后续扩展）
- 不做地图缩放/平移

