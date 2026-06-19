import { describe, it, expect } from 'vitest';
import {
  toUrl,
  extractWikiLinks,
  buildLinkMap,
  buildBacklinkIndex,
  type LinkTarget,
  type DocLike,
} from '../src/lib/links';

describe('toUrl', () => {
  it('builds collection-prefixed urls', () => {
    expect(toUrl('garden', 'on-focus')).toBe('/garden/on-focus');
    expect(toUrl('articles', 'hello')).toBe('/articles/hello');
  });
});

describe('extractWikiLinks', () => {
  it('extracts titles and strips display alias', () => {
    const md = '见 [[甲]] 与 [[乙|别名]]，以及重复 [[甲]]。';
    expect(extractWikiLinks(md)).toEqual(['甲', '乙']);
  });
  it('returns empty array when none', () => {
    expect(extractWikiLinks('没有链接')).toEqual([]);
  });
});

describe('buildLinkMap', () => {
  it('maps title to target', () => {
    const targets: LinkTarget[] = [
      { title: '甲', collection: 'garden', slug: 'jia', url: '/garden/jia' },
    ];
    const map = buildLinkMap(targets);
    expect(map.get('甲')?.url).toBe('/garden/jia');
  });
});

describe('buildBacklinkIndex', () => {
  it('indexes referrers by target url', () => {
    const docs: DocLike[] = [
      { title: '甲', collection: 'garden', slug: 'jia', body: '链到 [[乙]]' },
      { title: '乙', collection: 'garden', slug: 'yi', body: '无链接' },
    ];
    const index = buildBacklinkIndex(docs);
    expect(index.get('/garden/yi')).toEqual([{ title: '甲', url: '/garden/jia' }]);
    expect(index.get('/garden/jia')).toBeUndefined();
  });
});
