import fg from 'fast-glob';
import matter from 'gray-matter';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { buildLinkMap, toUrl, type Collection, type LinkTarget } from './links';

export function buildLinkMapFromDisk(): Map<string, LinkTarget> {
  const targets: LinkTarget[] = [];
  for (const collection of ['articles', 'garden'] as Collection[]) {
    const files = fg.sync(`src/content/${collection}/**/*.md`);
    for (const file of files) {
      const { data } = matter(readFileSync(file, 'utf-8'));
      const title = data.title as string | undefined;
      if (!title) continue;
      if (data.draft === true) continue;
      const slug = relative(`src/content/${collection}`, file).replace(/\.md$/, '');
      targets.push({ title, collection, slug, url: toUrl(collection, slug) });
    }
  }
  return buildLinkMap(targets);
}
