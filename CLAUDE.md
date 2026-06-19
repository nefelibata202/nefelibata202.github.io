# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

「归来」(Guī Lái) — Evan's personal **writing blog + digital garden**. Astro 5 static site, zero client-side JS, design "方案 A" (minimal, black/white, single ~680px reading column). Deployed to GitHub Pages at https://nefelibata202.github.io/ (repo `nefelibata202/nefelibata202.github.io`).

## Commands

```bash
npm install        # install deps (Node >= 20.3)
npm run dev        # local preview at http://localhost:4321
npm run build      # build static output to dist/
npm run preview    # serve the built dist/
npm test           # run the Vitest unit suite
npx vitest run tests/links.test.ts   # run a single test file
```

There is no lint step. CI (`.github/workflows/deploy.yml`) runs `npm ci && npm run build` and deploys `dist/` to Pages on every push to `main`.

## Architecture

Static-only: all HTML is generated at build time. "No client JS" is a hard constraint — do not add `<script>` or `client:*` directives without a deliberate reason.

**Content is data, not pages.** Three sources drive everything:
- `src/content/articles/*.md` — blog posts. Frontmatter: `title, date, tags[], summary, draft`.
- `src/content/garden/*.md` — digital-garden notes. Frontmatter: `title, updated, tags[]`. Bodies may use `[[wikilink]]`.
- `src/data/favorites.json` — books & movies with ★ ratings (validated by `src/lib/favorites.ts`).

Collections are defined in `src/content.config.ts` (Astro 5 glob loader + zod). **Slug = the collection-relative path of the `.md` file** (= Astro's `entry.id`); slugs are English, titles may be Chinese.

**Wikilinks & backlinks (the signature feature):**
- `src/lib/links.ts` — pure, dependency-free logic: `extractWikiLinks`, `buildLinkMap`, `buildBacklinkIndex`, `toUrl`. This is the unit-tested core; keep it pure.
- `src/lib/wikilink.ts` — a remark plugin that rewrites `[[标题]]` / `[[标题|显示]]` into in-site `<a>` at build time. Matched by exact title; unmatched → plain text.
- `src/lib/linkmap.node.ts` — Node-only (`*.node.ts`): scans `src/content/**/*.md` at config time to build the title→url map the remark plugin needs. Imported by `astro.config.ts`. Skips `draft: true`.
- Backlinks ("反向链接") are computed once in `getStaticPaths` of `src/pages/garden/[slug].astro` and rendered at page bottom via `PostLayout`'s named `<slot name="after" />`.

**Why `linkmap.node.ts` is separate from `links.ts`:** the remark plugin is configured in `astro.config.ts` before Astro loads content, so the link map is built by scanning the filesystem directly. The glob there (`**/*.md`) must stay in sync with `content.config.ts`'s loader pattern, or wikilink targets and page URLs diverge.

**Layout/components:** `src/layouts/BaseLayout.astro` (html shell + Nav + Footer, props `title`/`description?`) → `src/layouts/PostLayout.astro` (article chrome, default slot for body + named `after` slot). Shared bits: `Nav`, `Footer`, `PostList` (`items: {url,title,meta}[]`), `TagChip`, `Backlinks`. All styling lives in `src/styles/global.css`.

**Pages:** `index` (home), `articles/` (list + `[slug]`), `garden/` (list + `[slug]`), `tags/[tag]` (aggregates both collections; tag URLs are intentionally non-ASCII), `collections`, `about`, `rss.xml.ts`. Drafts (`draft: true`) are excluded everywhere: home, lists, detail, tags, RSS, and the backlink index.

## Adding content (publish flow)

The site is the publishing end of Evan's Obsidian PKM vault: the `compose` skill writes drafts to the vault's `12-Resource/drafts/`, then Evan **manually copies** the `.md` into `src/content/articles/` or `src/content/garden/`, fixes frontmatter, and pushes. Push to `main` → Actions builds and deploys. Use English filenames (they become the slug).

## Conventions

- Match the existing per-page idiom: small inline `fmt` date helper, server-side `getCollection` in frontmatter, `entry.id` as slug. Don't introduce a framework or client runtime.
- Keep `src/lib/links.ts` and `src/lib/favorites.ts` pure and unit-tested. Page/layout `.astro` files are verified by `npm run build` (+ grep of `dist/`), not unit tests.

## Custom domain (future)

Currently `astro.config.ts` `site` = `https://nefelibata202.github.io` (root path, no `base` — user-site repo). To bind a custom domain: add `public/CNAME` with the domain, set `site` to the domain, point DNS at GitHub Pages.

## Project docs

The design spec and the task-by-task implementation plan are committed under `docs/superpowers/`.
