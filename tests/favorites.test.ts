import { describe, it, expect } from 'vitest';
import { loadFavorites, decadeOf, TYPE_LABEL } from '../src/lib/favorites';

describe('loadFavorites', () => {
  it('parses a valid entry and applies defaults', () => {
    const [item] = loadFavorites([
      { type: 'movie', title: '花样年华', score: 8.6, year: '2000', cover: '/covers/x.jpg' },
    ]);
    expect(item).toEqual({
      type: 'movie',
      title: '花样年华',
      creator: '',
      score: 8.6,
      year: '2000',
      date: '',
      cover: '/covers/x.jpg',
      categories: [],
      status: false,
    });
  });

  it('accepts a null cover', () => {
    const [item] = loadFavorites([{ type: 'book', title: 'A', cover: null }]);
    expect(item.cover).toBeNull();
  });

  it('throws on an unknown type', () => {
    expect(() => loadFavorites([{ type: 'game', title: 'A' }])).toThrow();
  });

  it('throws on a score above 10', () => {
    expect(() => loadFavorites([{ type: 'movie', title: 'A', score: 11 }])).toThrow();
  });
});

describe('decadeOf', () => {
  it('buckets years into decades', () => {
    expect(decadeOf('2019')).toBe('2010s');
    expect(decadeOf('2006')).toBe('2000s');
    expect(decadeOf('1969')).toBe('earlier');
  });
  it('returns null for an empty/invalid year', () => {
    expect(decadeOf('')).toBeNull();
  });
});

describe('TYPE_LABEL', () => {
  it('maps every type to a Chinese label', () => {
    expect(TYPE_LABEL.teleplay).toBe('剧集');
    expect(TYPE_LABEL.music).toBe('音乐');
  });
});
