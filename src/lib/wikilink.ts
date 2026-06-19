import { visit } from 'unist-util-visit';
import type { Root, Text, PhrasingContent } from 'mdast';
import type { LinkTarget } from './links';

const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;

export function remarkWikiLink(linkMap: Map<string, LinkTarget>) {
  return function () {
    return function (tree: Root) {
      visit(tree, 'text', (node: Text, index, parent) => {
        if (parent == null || index == null) return;
        if (!node.value.includes('[[')) return;

        const out: PhrasingContent[] = [];
        let last = 0;
        for (const match of node.value.matchAll(WIKILINK_RE)) {
          const start = match.index ?? 0;
          if (start > last) out.push({ type: 'text', value: node.value.slice(last, start) });

          const [rawTitle, rawDisplay] = match[1].split('|', 2);
          const title = rawTitle.trim();
          const display = (rawDisplay ?? rawTitle).trim();
          const target = linkMap.get(title);

          if (target) {
            out.push({
              type: 'link',
              url: target.url,
              children: [{ type: 'text', value: display }],
            });
          } else {
            out.push({ type: 'text', value: display });
          }
          last = start + match[0].length;
        }
        if (last < node.value.length) out.push({ type: 'text', value: node.value.slice(last) });

        parent.children.splice(index, 1, ...out);
        return index + out.length;
      });
    };
  };
}
