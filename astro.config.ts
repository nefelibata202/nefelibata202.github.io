import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { remarkWikiLink } from './src/lib/wikilink';
import { buildLinkMapFromDisk } from './src/lib/linkmap.node';

const linkMap = buildLinkMapFromDisk();

export default defineConfig({
  site: 'https://nefelibata202.github.io', // 绑定自定义域名后改为该域名
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkWikiLink(linkMap)],
  },
});
