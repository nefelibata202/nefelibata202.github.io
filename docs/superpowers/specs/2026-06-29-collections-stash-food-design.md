# 设计:「私藏」聚合板块 + 美食页

日期:2026-06-29
状态:已确认,待写实现计划

## 背景与动机

当前 nav 五个板块混了三种性质的内容:输出(文章/花园)、自画像(归图)、品味安利(书影)、名片(关于)。"书影"是一块"安利/私藏"内容(电影/剧/书/乐),但站点缺一个统一承载"我推荐什么"的家——这是 Evan 感到"定位不清晰"的根因。

现在要新增「宝藏美食店铺」内容(已去过的店,方便自己和别人按城市/菜系查询)。它和书影同属"私藏/安利"家族。因此本设计不只是加一个页面,而是**把书影升级为「私藏」聚合板块**,顺手理顺架构。

## 方案

方向 A / 方案 X:建一个「私藏」hub,书影迁到 hub 下,美食作为 hub 下第二个子页。

### 1. 板块结构与路由

```
nav: 私藏  →  /collections           私藏 hub 落地页
                ├── /collections/media   书影(现有媒体库,逻辑原样迁移)
                └── /collections/food    美食(新增)
```

- **nav 改动**:`Nav.astro` 里 `{ href: '/collections', label: '书影' }` → `label: '私藏'`。`active()` 用 `path.startsWith('/collections')` 已能覆盖三个子路由,无需改判定逻辑。
- **`/collections`(hub 落地页)**:轻量页,一句话定位 + 两张大入口卡:
  - 书影 —— 显示藏品数(N 件),链到 `/collections/media`
  - 美食 —— 显示家数 + 城市数(N 家 · M 城),链到 `/collections/food`
  - 用现有 neo-brutalist 硬边卡 + 偏移硬阴影风格;为未来扩展(店铺/咖啡/工具)预留同构卡位。
- **`/collections/media`**:把现有 `src/pages/collections.astro` 的全部内容(统计条 / 筛选 chips / 海报网格 / 分页 / 内联脚本)迁到这里,逻辑零改动。数据仍读 `src/data/favorites.json`。
- **`/collections/food`**:新建,详见第 3 节。

URL 变更说明:书影从 `/collections` 移到 `/collections/media`。这是个人站内部链接,可接受;需检查站内是否有硬编码 `/collections` 指向书影的地方(如 index/about),改指到 `/collections/media` 或 hub。

### 2. 美食数据模型与筛选

新建 `src/data/food.json` 与 `src/lib/food.ts`(zod 校验 + 纯函数,和 `favorites.ts` 同套路,保持可单测)。

字段:

```jsonc
{
  "name": "店名",            // 必填
  "city": "成都",            // 必填,城市筛选主维度
  "area": "玉林",            // 可选,商圈/区域
  "cuisine": ["川菜"],       // 必填,菜系/品类(可多个)
  "score": 8.5,              // 必填,0–10,沿用书影评分体系
  "recommend": "一句话理由",  // 可选,为什么是宝藏
  "dishes": ["招牌1"],        // 可选,必点
  "map": "https://...",       // 可选,导航链接(高德/大众点评)
  "date": "2026-06"           // 可选,添加时间,排序用
}
```

`food.ts` 导出:`foodSchema`、`loadFood(raw)`(zod 解析+排序入口)、`type FoodSpot`。复用书影的评分分桶思路(9+/8–9/7–8/7以下)可在页面内联,无需额外函数;若需要可加 `scoreBand(score)` 纯函数并单测。

筛选维度(去掉书影里的年代/类型/状态/品类,因为美食不需要):

| 维度 | 选项来源 |
|------|---------|
| 城市 | 从 `food.json` 聚合(去重,按家数降序) |
| 菜系 | 从 `cuisine[]` 聚合 top N |
| 评分 | 9+ / 8–9 / 7–8 / 7以下(同书影) |
| 搜索框 | `name` + `cuisine` + `dishes` 全文(小写匹配) |
| 排序 | 评分(默认) / 最近添加(按 `date`) |

不做:价位档、状态(去过/想去)——所有收藏默认已去过。

### 3. 美食页面布局

复用书影的页面骨架(标题区 + 统计条 + 筛选 chips + 网格 + 分页 + 单一 `is:inline` 脚本),但卡片是**文字卡**(无海报):

```
┌─────────────────────────────┐
│ 店名               [ 8.5 ]  │  店名 + 朱砂评分角标
│ 成都 · 玉林                  │  城市 · 商圈(马金黄小字,无 area 时只显城市)
│ 川菜  苍蝇馆子                │  菜系 tag chips
│ "为什么是宝藏的一句话理由"      │  recommend(有才显示)
│ 必点:招牌1 / 招牌2           │  dishes(有才显示)
│              [ 导航 ↗ ]      │  map(有才显示,新窗口打开)
└─────────────────────────────┘
```

- 标题区:`美食 · 私人觅食地图`(kicker)+ `美食`(h1)+ 一句 lede。
- 统计条:共 N 家 · M 座城 · 均分 X.X(参照书影 statsmap,可简化)。
- 顶部分段切换「书影 | 美食」:两个子页顶部都放,方便横跳(hub 已是总入口,这里是页间快捷)。
- 筛选交互照搬书影脚本结构:`data-facet`/`data-val` chips、搜索 debounce、排序、清除筛选、>30 家时分页;`state` 精简为 `{ city, cuisine, score, q, sort, page }`。
- 卡片 `data-*` 携带 `city / cuisine(|分隔) / score / q` 供前端筛选。

### 4. 样式

所有样式进 `src/styles/global.css`,沿用现有 neo-brutalist 变量(ink / paper / 马金黄 marigold / 朱砂 seal、3px 硬边、偏移硬阴影)。美食文字卡是新增 class(如 `.fcard`),hub 入口卡为新增 class(如 `.hub-card`);筛选 chips 复用现有 `.fchip`/`.frow`/`.filters` 等类,避免重复。

## 测试与验收

- `src/lib/food.ts` 保持纯函数,加 `tests/food.test.ts`(校验 schema 解析、排序、聚合/分桶若有),与 `favorites.ts` 一致。
- 页面/布局由 `npm run build` + grep `dist/` 验证(三条路由都生成、nav 标签为"私藏"、hub 两卡、美食卡渲染)。
- 现有 `npm test` 全绿;`tests/links.test.ts` 不受影响。
- 手动 `npm run dev` 核对筛选/搜索/排序/分页在美食页可用,以及书影迁移后无回归。

## 不做(YAGNI)

- 价位筛选、去过/想去状态。
- 美食封面图(纯文字卡;未来真要加图再说)。
- hub 落地页的复杂统计/动画——保持轻量两卡。
- 把美食塞进 `collections.astro` 同一文件(刻意分页,避免巨型文件)。

## 待实现期间确认的小事

- 站内是否有硬编码指向 `/collections` 当作书影的链接,迁移时一并改。
- `food.json` 初始放几条样例数据(Evan 后续手填),先放 2–3 条占位以便构建/截图验证。
