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
