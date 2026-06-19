import { describe, it, expect } from 'vitest';
import { remark } from 'remark';
import { remarkWikiLink } from '../src/lib/wikilink';
import { buildLinkMap, type LinkTarget } from '../src/lib/links';

const targets: LinkTarget[] = [
  { title: '甲', collection: 'garden', slug: 'jia', url: '/garden/jia' },
];
const map = buildLinkMap(targets);

async function run(md: string): Promise<string> {
  const file = await remark().use(remarkWikiLink(map)).process(md);
  return String(file);
}

describe('remarkWikiLink', () => {
  it('resolves known title to a link', async () => {
    expect(await run('见 [[甲]]。')).toContain('[甲](/garden/jia)');
  });
  it('uses display alias for link text', async () => {
    expect(await run('见 [[甲|别名]]。')).toContain('[别名](/garden/jia)');
  });
  it('renders unknown link as plain text', async () => {
    const out = await run('见 [[未知]]。');
    expect(out).toContain('未知');
    expect(out).not.toContain('[未知](');
  });
});
