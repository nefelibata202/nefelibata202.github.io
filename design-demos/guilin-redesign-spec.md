# 归图页面重设计 Spec

## 产品/项目是什么

「归图」是归来网站的个人导览页面，作为 Evan 的数字身份地图。当前版本是航海图风格（Canvas 绘制的岛屿 + 船只动画），用户要求完全重做。

## 目标受众与使用场景

- **受众**：访问 Evan 网站的访客（潜在客户、同行、朋友）
- **场景**：访客想了解 Evan 的知识体系、信息获取习惯、以及他正在学习什么
- **情感基调**：温暖、有质感、个人化、不冰冷。像一个有温度的个人书房，而不是企业 dashboard

## 核心信息与内容要点

三座「信息岛」是本次重设计的核心内容板块：

### 1. 碎片化时间（fragmented-time）
核心信息：Evan 如何利用碎片时间进行自我提升
示例内容：
- 🎧 听英语播客（ESL Pod、BBC 6 Minutes）
- 📖 读一篇短文章（Pocket 收藏夹）
- ✍️ 记一条 flomo 碎片想法
- 🏃 出去走走 + 听日语听力
- 📱 刷一条行业短视频（学习竞品）

### 2. 高质量信息源（info-sources）
核心信息：Evan 日常订阅/关注的优质内容来源
示例内容：
- 📰 Newsletter：Morning Brew、Stratechery、Not Boring
- 🎙️ Podcast：Lex Fridman、Huberman Lab、商业就是这样
- 📚 书籍：正在读《思考，快与慢》《原则》
- 🌐 网站：少数派、Hacker News、Product Hunt
- 👤 关注的人：孟岩、Lillian Li、Shane Parrish

### 3. 知识库缺口（knowledge-gaps）
核心信息：Evan 想补但还没补的知识领域
示例内容：
- 🔢 数据分析基础（SQL、Excel 高级）
- 🧠 认知科学 / 行为经济学
- 💻 前端开发入门（HTML/CSS/JS 基础）
- 📊 财务知识（读懂财报）
- 🗣️ 日语 N2 → N1

## 输出格式与尺寸

- **格式**：网页（响应式，桌面端 + 移动端）
- **桌面端**：1440px 宽，全高视口
- **移动端**：375px 宽
- **交互**：点击/悬停展开内容面板，有过渡动画

## 已知约束

- 必须使用归来网站的现有设计令牌（CSS 变量）：
  - 色彩：`--bg: #F1EBDB`, `--paper: #FCF8EE`, `--ink: #16140F`, `--gold: #F2B312`, `--seal: #C8362B`
  - 字体：得意黑 Smiley Sans（展示）、系统无衬线（正文）、Archivo（拉丁）、JetBrains Mono（数据）
  - 阴影：`--shadow: 6px 6px 0 var(--line)`, `--shadow-sm: 3px 3px 0 var(--line)`
- 暗色模式必须支持（使用现有 data-theme 机制）
- 零客户端 JS 框架（保持 Astro 静态站点风格，仅允许少量 is:inline 脚本）
- 内容以卡片/列表形式呈现，不使用 emoji 作为主要图标（可以用但不要满屏 emoji）

## 设计方向关键词

- 温暖、纸质感、书房气质
- 信息有层次、不堆砌
- 个人化、有温度
- 知识的可视化（不是数据可视化，而是知识的结构化呈现）

## 禁忌

- ❌ 航海图/岛屿/船只（放弃现有方案）
- ❌ 紫色渐变、霓虹 glow
- ❌ 满屏 emoji 图标
- ❌ 通用 stock photo
- ❌ 过于企业化的 dashboard 风格
