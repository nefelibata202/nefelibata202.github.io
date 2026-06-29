import { describe, it, expect } from 'vitest';
import { loadFood, scoreBand } from '../src/lib/food';

describe('loadFood', () => {
  it('parses a valid entry and applies defaults', () => {
    const [item] = loadFood([
      { name: '明婷饭店', city: '成都', cuisine: ['川菜'], score: 8.8 },
    ]);
    expect(item).toEqual({
      name: '明婷饭店',
      city: '成都',
      area: '',
      cuisine: ['川菜'],
      score: 8.8,
      recommend: '',
      dishes: [],
      map: '',
      date: '',
    });
  });

  it('rejects an entry missing required name', () => {
    expect(() => loadFood([{ city: '成都' }])).toThrow();
  });

  it('rejects score out of range', () => {
    expect(() => loadFood([{ name: 'x', city: 'y', score: 11 }])).toThrow();
  });
});

describe('scoreBand', () => {
  it('buckets scores into bands', () => {
    expect(scoreBand(9)).toBe('9');
    expect(scoreBand(9.5)).toBe('9');
    expect(scoreBand(8)).toBe('8');
    expect(scoreBand(8.9)).toBe('8');
    expect(scoreBand(7)).toBe('7');
    expect(scoreBand(6.9)).toBe('lt7');
    expect(scoreBand(0)).toBeNull();
  });
});
