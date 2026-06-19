import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  return rss({
    title: '归来',
    description: 'Evan 的个人写作博客与数字花园',
    site: context.site!,
    items: articles
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((e) => ({
        title: e.data.title,
        description: e.data.summary,
        pubDate: e.data.date,
        link: `/articles/${e.id}/`,
      })),
  });
}
