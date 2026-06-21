import { z } from 'astro/zod';

export const favoriteSchema = z.object({
  type: z.enum(['movie', 'teleplay', 'book', 'music']),
  title: z.string(),
  creator: z.string().default(''),
  score: z.number().min(0).max(10).default(0),
  year: z.string().default(''),
  date: z.string().default(''),
  cover: z.string().nullable().default(null),
  categories: z.array(z.string()).default([]),
  status: z.boolean().default(false), // 已看 / 读毕 = true；想看 / 在读 = false
});

export type Favorite = z.infer<typeof favoriteSchema>;

export function loadFavorites(raw: unknown): Favorite[] {
  return z.array(favoriteSchema).parse(raw);
}

export const TYPE_LABEL: Record<Favorite['type'], string> = {
  movie: '电影',
  teleplay: '剧集',
  book: '书籍',
  music: '音乐',
};

/** 年代分桶：用于「年代」筛选 */
export function decadeOf(year: string): string | null {
  const y = parseInt(year, 10);
  if (!y) return null;
  if (y >= 2020) return '2020s';
  if (y >= 2010) return '2010s';
  if (y >= 2000) return '2000s';
  if (y >= 1990) return '1990s';
  if (y >= 1980) return '1980s';
  return 'earlier';
}
