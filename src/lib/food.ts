import { z } from 'astro/zod';

export const foodSchema = z.object({
  name: z.string(),
  city: z.string(),
  area: z.string().default(''),
  cuisine: z.array(z.string()).default([]),
  score: z.number().min(0).max(10).default(0),
  recommend: z.string().default(''),
  dishes: z.array(z.string()).default([]),
  map: z.string().default(''),
  date: z.string().default(''),
});

export type FoodSpot = z.infer<typeof foodSchema>;

export function loadFood(raw: unknown): FoodSpot[] {
  return z.array(foodSchema).parse(raw);
}

/** 评分分桶：用于「评分」筛选，与书影一致 */
export function scoreBand(score: number): '9' | '8' | '7' | 'lt7' | null {
  if (score >= 9) return '9';
  if (score >= 8) return '8';
  if (score >= 7) return '7';
  if (score > 0) return 'lt7';
  return null;
}
