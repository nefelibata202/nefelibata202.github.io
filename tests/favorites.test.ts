import { describe, it, expect } from 'vitest';
import { loadFavorites } from '../src/lib/favorites';

describe('loadFavorites', () => {
  it('parses valid entries and defaults note', () => {
    const result = loadFavorites([
      { type: 'book', title: 'A', creator: 'X', rating: 5, date: '2026-01' },
    ]);
    expect(result).toEqual([
      { type: 'book', title: 'A', creator: 'X', rating: 5, date: '2026-01', note: '' },
    ]);
  });
  it('throws on invalid type', () => {
    expect(() => loadFavorites([{ type: 'game', title: 'A', creator: 'X', rating: 5, date: '2026' }])).toThrow();
  });
});
