import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { remarkWikiLink } from './src/lib/wikilink';
import { buildLinkMapFromDisk } from './src/lib/linkmap.node';

const linkMap = buildLinkMapFromDisk();

export default defineConfig({
  site: 'https://freespot.top',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkWikiLink(linkMap)],
  },
});
