import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const GUIDE_DIR = resolve('src/content/guide');
const EXPECTED = [
  'people',
  'interests',
  'philosophy',
  'fragmented-time',
  'knowledge-gaps',
];

describe('guide content collection', () => {
  it('has exactly 5 markdown files', () => {
    const files = readdirSync(GUIDE_DIR).filter(f => f.endsWith('.md'));
    expect(files).toHaveLength(5);
  });

  it('all required island files are present', () => {
    const files = readdirSync(GUIDE_DIR).filter(f => f.endsWith('.md'));
    const slugs = files.map(f => f.replace('.md', ''));
    for (const id of EXPECTED) {
      expect(slugs, `missing ${id}.md`).toContain(id);
    }
  });

  it('all files have required frontmatter fields', () => {
    for (const id of EXPECTED) {
      const content = readFileSync(resolve(GUIDE_DIR, `${id}.md`), 'utf-8');
      expect(content, `${id}.md missing title`).toMatch(/^title:/m);
      expect(content, `${id}.md missing island`).toMatch(/^island:/m);
    }
  });

  it('island field matches file slug', () => {
    for (const id of EXPECTED) {
      const content = readFileSync(resolve(GUIDE_DIR, `${id}.md`), 'utf-8');
      expect(content, `${id}.md island field mismatch`).toContain(`island: ${id}`);
    }
  });
});
