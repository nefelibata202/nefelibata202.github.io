import { z } from 'astro/zod';

export const favoriteSchema = z.object({
  type: z.enum(['book', 'movie']),
  title: z.string(),
  creator: z.string(),
  rating: z.number().min(0).max(5),
  date: z.string(),
  note: z.string().default(''),
});

export type Favorite = z.infer<typeof favoriteSchema>;

export function loadFavorites(raw: unknown): Favorite[] {
  return z.array(favoriteSchema).parse(raw);
}
