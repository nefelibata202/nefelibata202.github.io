import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { remarkWikiLink } from './src/lib/wikilink';
import { buildLinkMapFromDisk } from './src/lib/linkmap.node';

const linkMap = buildLinkMapFromDisk();

export default defineConfig({
  site: 'https://guilai.me',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkWikiLink(linkMap)],
  },
});
