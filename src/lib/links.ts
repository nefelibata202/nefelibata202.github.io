export type Collection = 'articles' | 'garden';

export interface LinkTarget {
  title: string;
  collection: Collection;
  slug: string;
  url: string;
}

export interface Backlink {
  title: string;
  url: string;
}

export interface DocLike {
  title: string;
  collection: Collection;
  slug: string;
  body: string;
}

const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;

export function toUrl(collection: Collection, slug: string): string {
  return `/${collection}/${slug}`;
}

export function extractWikiLinks(markdown: string): string[] {
  const titles: string[] = [];
  for (const match of markdown.matchAll(WIKILINK_RE)) {
    const title = match[1].split('|')[0].trim();
    if (title && !titles.includes(title)) titles.push(title);
  }
  return titles;
}

export function buildLinkMap(targets: LinkTarget[]): Map<string, LinkTarget> {
  const map = new Map<string, LinkTarget>();
  for (const t of targets) map.set(t.title, t);
  return map;
}

export function buildBacklinkIndex(docs: DocLike[]): Map<string, Backlink[]> {
  const linkMap = buildLinkMap(
    docs.map((d) => ({
      title: d.title,
      collection: d.collection,
      slug: d.slug,
      url: toUrl(d.collection, d.slug),
    })),
  );
  const index = new Map<string, Backlink[]>();
  for (const doc of docs) {
    const from: Backlink = { title: doc.title, url: toUrl(doc.collection, doc.slug) };
    for (const title of extractWikiLinks(doc.body)) {
      const target = linkMap.get(title);
      if (!target || target.url === from.url) continue;
      const list = index.get(target.url) ?? [];
      if (!list.some((b) => b.url === from.url)) list.push(from);
      index.set(target.url, list);
    }
  }
  return index;
}
