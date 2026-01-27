import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { toc } from 'mdast-util-toc';
import type { Root } from 'mdast';
import type { TocItem } from './types';

interface TocNode {
  type: string;
  children?: TocNode[];
  value?: string;
  url?: string;
}

interface TocResult {
  map?: TocNode;
}

function extractTocItems(node: TocNode, depth: number = 1): TocItem[] {
  const items: TocItem[] = [];

  if (node.type === 'list' && node.children) {
    for (const listItem of node.children) {
      if (listItem.type === 'listItem' && listItem.children) {
        const item: TocItem = {
          depth,
          value: '',
          id: '',
          children: [],
        };

        for (const child of listItem.children) {
          if (child.type === 'paragraph' && child.children) {
            const link = child.children.find((c: TocNode) => c.type === 'link');
            if (link && link.children) {
              const textNode = link.children.find((c: TocNode) => c.type === 'text');
              if (textNode && textNode.value) {
                item.value = textNode.value;
              }
              if (link.url) {
                item.id = link.url.replace('#', '');
              }
            }
          } else if (child.type === 'list') {
            item.children = extractTocItems(child, depth + 1);
          }
        }

        if (item.value && item.id) {
          items.push(item);
        }
      }
    }
  }

  return items;
}

export async function processMarkdown(content: string): Promise<{ html: string; toc: TocItem[] }> {
  // First, extract TOC from the markdown AST
  const tocProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  const mdast = tocProcessor.parse(content) as Root;
  const tocResult = toc(mdast, { maxDepth: 3 }) as TocResult;

  let tocItems: TocItem[] = [];
  if (tocResult.map) {
    tocItems = extractTocItems(tocResult.map);
  }

  // Then process to HTML
  const htmlProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const file = await htmlProcessor.process(content);

  return {
    html: String(file),
    toc: tocItems,
  };
}
