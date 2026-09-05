import { parseYumia } from './parser.js';
import { HeadingElement, Presentation, SlideElement } from '@yumiamd/ast';

/**
 * Migration tool to convert legacy YumiaMD (.yumia.md) files into
 * the clean Native Yumia Language (.yumia) format.
 */
export function migrateMarkdownToNative(source: string): string {
  const presentation: Presentation = parseYumia(source);
  const out: string[] = [];

  // Document metadata
  if (presentation.metadata.title) {
    out.push(`document "${presentation.metadata.title}"`);
  }
  if (presentation.metadata.theme) {
    const themeName =
      typeof presentation.metadata.theme === 'string'
        ? presentation.metadata.theme
        : presentation.metadata.theme.name;
    out.push(`  theme "${themeName}"`);
  }
  if (presentation.metadata.author) {
    out.push(`  author "${presentation.metadata.author}"`);
  }
  if (presentation.metadata.aspectRatio) {
    out.push(`  aspectRatio "${presentation.metadata.aspectRatio}"`);
  }
  if (presentation.metadata.transition) {
    const trans =
      typeof presentation.metadata.transition === 'string'
        ? presentation.metadata.transition
        : presentation.metadata.transition.type;
    out.push(`  transition "${trans}"`);
  }
  if (presentation.metadata.watermark) {
    out.push(`  watermark "${presentation.metadata.watermark}"`);
  }

  out.push('');

  for (const slide of presentation.slides) {
    // Determine slide title from first heading
    const firstHeading = slide.elements.find((el) => el.type === 'heading') as
      HeadingElement | undefined;
    const slideTitle = firstHeading && firstHeading.level === 1 ? firstHeading.text : '';

    if (slideTitle) {
      out.push(`slide "${slideTitle}"`);
    } else {
      out.push('slide');
    }

    if (slide.transition) {
      const trans = typeof slide.transition === 'string' ? slide.transition : slide.transition.type;
      out.push(`  transition "${trans}"`);
    }

    for (const el of slide.elements) {
      // If heading was used as slide title, skip duplicating it
      if (el === firstHeading && firstHeading.level === 1) continue;
      out.push(serializeElement(el, 2));
    }

    if (slide.notes) {
      out.push('  notes');
      for (const nl of slide.notes.split('\n')) {
        out.push(`    ${nl}`);
      }
    }

    out.push('');
  }

  return out.join('\n').trim() + '\n';
}

function serializeElement(el: SlideElement, indent: number): string {
  const pad = ' '.repeat(indent);

  switch (el.type) {
    case 'heading':
      return `${pad}heading "${el.text}"`;
    case 'paragraph':
      return `${pad}text "${el.text}"`;
    case 'icon':
      return `${pad}icon "${el.name}"`;
    case 'badge':
      return `${pad}badge "${el.text}" variant="${el.variant || 'default'}"`;
    case 'metric':
      return `${pad}metric "${el.value}" label="${el.label}"${el.change ? ` diff="${el.change}"` : ''}`;
    case 'code': {
      const hl = el.highlight ? ` highlight="${el.highlight}"` : '';
      const lang = el.language ? ` lang="${el.language}"` : '';
      const codeLines = el.code
        .split('\n')
        .map((l) => `${pad}  ${l}`)
        .join('\n');
      return `${pad}code${lang}${hl}\n${codeLines}`;
    }
    case 'section': {
      const sub = el.subtitle ? ` subtitle="${el.subtitle}"` : '';
      const num = el.number !== undefined ? ` number="${el.number}"` : '';
      return `${pad}section "${el.title}"${sub}${num}`;
    }
    case 'toc':
      return `${pad}toc "${el.title || 'Table of Contents'}"`;
    case 'card': {
      const cleanTitle = (el.title || '').replace(/^[Tt]itle=['"]?/, '').replace(/['"]$/, '');
      const title = cleanTitle ? ` title="${cleanTitle}"` : '';
      const v = el.variant ? ` variant="${el.variant}"` : '';
      const cardChildren = (el.elements || [])
        .map((c) => serializeElement(c, indent + 2))
        .join('\n');
      return `${pad}card${title}${v}\n${cardChildren}`;
    }
    case 'grid': {
      const gridChildren = el.elements.map((c) => serializeElement(c, indent + 2)).join('\n');
      return `${pad}grid columns=${el.columns}\n${gridChildren}`;
    }
    case 'stack': {
      const stackChildren = el.elements.map((c) => serializeElement(c, indent + 2)).join('\n');
      return `${pad}stack direction="${el.direction}"\n${stackChildren}`;
    }
    case 'columns': {
      const colChildren = el.columns
        .map((col) => {
          const inner = col.elements.map((c) => serializeElement(c, indent + 4)).join('\n');
          return `${pad}  column\n${inner}`;
        })
        .join('\n');
      return `${pad}columns ${el.ratios || '50:50'}\n${colChildren}`;
    }
    case 'list': {
      const listItems = el.items.map((it) => `${pad}  item "${it.text}"`).join('\n');
      return `${pad}list\n${listItems}`;
    }
    case 'quote': {
      const qAuthor = el.author ? ` author="${el.author}"` : '';
      return `${pad}quote${qAuthor}\n${pad}  ${el.text}`;
    }
    default:
      return `${pad}// [${el.type}]`;
  }
}
