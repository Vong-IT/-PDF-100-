import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  PageOrientation,
  ImageRun,
} from 'docx';

export type WordTableStyle =
  | 'bordered'
  | 'striped'
  | 'minimal'
  | 'double'
  | 'dashed'
  | 'dotted'
  | 'thick'
  | 'borderless';

export type WordTableBorderColor = 'slate' | 'blue' | 'amber' | 'emerald' | 'crimson' | 'dark';
export type WordTableBgColor = 'slate-soft' | 'blue-soft' | 'amber-soft' | 'emerald-soft' | 'navy-royal' | 'white';
export type WordBulletPreset = 'auto' | 'standard' | 'khmer-alphabet' | 'khmer-numeral' | 'checklist' | 'arrow' | 'square' | 'diamond';
export type WordHeaderBannerStyle = 'none' | 'tinted' | 'bordered-double' | 'bordered-single';
export type WordLayoutPreset = 'cambodian-official' | 'clean-report' | 'standard';
export type WordPaperSize = 'A4' | 'Letter' | 'Legal' | 'A3';
export type WordMarginsPreset = 'page-setup' | 'administrative' | 'standard' | 'narrow' | 'wide';

export interface CustomWordMargins {
  top: number;     // in inches (e.g. 0.69)
  bottom: number;  // in inches (e.g. 0.59)
  left: number;    // in inches (e.g. 0.59)
  right: number;   // in inches (e.g. 0.59)
  gutter?: number; // in inches (e.g. 0)
}

export interface WordExportOptions {
  title?: string;
  fontFamily?: string;       // Body font (e.g. 'Kantumruy Pro', 'Khmer OS Siemreap', 'Calibri')
  muolFont?: string;         // Headline / Royal font (e.g. 'Khmer OS Muol Light', 'Moul')
  fontSizePt?: number;       // Base font size in pt (default: 12)
  preserveDetectedFontSizes?: boolean; // Preserve inline/heading font sizes (default: true)
  paperSize?: WordPaperSize; // A4, Letter, Legal, A3 (default: 'A4')
  tableStyle?: WordTableStyle;
  tableBorderColor?: WordTableBorderColor;
  tableHeaderBg?: WordTableBgColor;
  bulletPreset?: WordBulletPreset;
  headerBannerStyle?: WordHeaderBannerStyle;
  headerBgColor?: string;    // Custom hex without #
  layoutPreset?: WordLayoutPreset;
  firstLineIndent?: boolean; // Cambodian administrative paragraph indent (default: true)
  justifyText?: boolean;     // Justify body paragraphs (default: true)
  marginsPreset?: WordMarginsPreset; // 'page-setup' (Top: 0.69", Bottom: 0.59", Left: 0.59", Right: 0.59") vs administrative vs standard vs narrow vs wide
  customMargins?: CustomWordMargins;
  orientation?: 'portrait' | 'landscape';
  includePageNumbers?: boolean;
  includeHeaderFooter?: boolean;
  author?: string;
  embedPdfImages?: boolean;
  pageImages?: { pageNumber: number; dataUrl: string; width: number; height: number }[];
}

export interface ParsedRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  muol?: boolean;
  color?: string;    // Hex without # (e.g. '16A34A', 'DC2626')
  bgColor?: string;  // Hex highlight/background without # (e.g. 'FEF3C7')
  underline?: boolean;
  size?: number;     // Half-points (e.g. 24 = 12pt, 28 = 14pt, 32 = 16pt)
}

export interface ParsedHeaderLayout {
  type: 'header-layout';
  leftLines: string[];
  rightLines: string[];
  hasMotto?: boolean;
  hasFlourish?: boolean;
  bgColor?: string;          // Hex without #
  borderBottom?: 'single' | 'double' | 'dashed' | 'none';
}

export interface ParsedBox {
  type: 'box';
  borderStyle?: 'single' | 'double' | 'dashed' | 'dotted' | 'accent-left' | 'none';
  borderColor?: string;      // Hex without #
  bgColor?: string;          // Hex without #
  title?: string;
  align?: 'left' | 'center' | 'right';
  content: string[];
}

export interface SignatureColumn {
  align?: 'left' | 'center' | 'right';
  date?: string;          // e.g. "ថ្ងៃអាទិត្យ ៤រោច... \n ម៉ាឡៃ, ថ្ងៃទី..."
  title?: string;         // e.g. "**បានឃើញ និងឯកភាព**" or "**ពិនិត្យ និងផ្ទៀងផ្ទាត់**"
  role?: string;          // e.g. "នាយកសាលា" or "ប្រធានក្រុមបច្ចេកទេស" or "បង្រៀនដោយ"
  name?: string;          // e.g. "នាក់ យឿន" or "ឡោម មនីវង្ស"
  lines?: string[];
}

export interface ParsedSignatureBlock {
  type: 'signature-layout';
  columns?: SignatureColumn[];
  date?: string;
  role?: string;
  name?: string;
  seal?: string;
  ccList?: string[];
  footerLine?: {
    left?: string[];
    right?: string[];
  };
}

export interface ParsedDocFooter {
  type: 'doc-footer';
  leftLines: string[];
  rightLines: string[];
  borderTop?: 'single' | 'double' | 'solid';
}

export interface ParsedMuolHeading {
  type: 'muol-heading';
  text: string;
  level: 1 | 2; // 1 = Royal motto / Supreme title; 2 = Prakas / Decree title
  hasFlourish?: boolean;
}

export interface ParsedTable {
  type: 'table';
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
  borderStyle?: WordTableStyle;
  borderColor?: string;
  headerBgColor?: string;
}

export interface ParsedHeading {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
  isMuol?: boolean;
}

export interface ParsedParagraph {
  type: 'paragraph';
  runs: ParsedRun[];
  alignment?: 'left' | 'center' | 'right' | 'both';
  isFirstLineIndent?: boolean;
  isBulletContinuation?: boolean;
  indentLevel?: number;
}

export interface ParsedListItem {
  type: 'bullet' | 'numbered' | 'checklist' | 'khmer-bullet';
  marker?: string;
  checked?: boolean;
  level?: number;
  runs: ParsedRun[];
}

export interface ParsedPaperSetting {
  type: 'paper-setting';
  paperSize?: WordPaperSize;
  orientation?: 'portrait' | 'landscape';
  marginsPreset?: WordMarginsPreset;
  customMargins?: CustomWordMargins;
}

export interface ParsedDivider {
  type: 'divider';
  style?: 'single' | 'double' | 'dashed';
}

export interface ParsedPageBreak {
  type: 'page-break';
  pageNumber: number;
}


export interface ParsedImage {
  type: 'image';
  dataUrl?: string;
  bytes?: Uint8Array;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  align?: 'left' | 'center' | 'right';
  pageNumber?: number;
}

export interface ParsedShape {
  type: 'shape';
  shapeType: 'seal-box' | 'badge' | 'ribbon' | 'rounded-box' | 'banner' | 'callout' | 'stamp-circle' | 'header-accent' | 'divider-shape';
  title?: string;
  subtitle?: string;
  content?: string[];
  borderColor?: string;  // Hex without #
  bgColor?: string;      // Hex without #
  textColor?: string;    // Hex without #
  borderWidth?: number;  // pt or px
  borderStyle?: 'single' | 'double' | 'dashed' | 'dotted';
  align?: 'left' | 'center' | 'right';
  icon?: string;
}

export type ParsedBlock =
  | ParsedImage
  | ParsedShape
  | ParsedPaperSetting
  | ParsedHeaderLayout
  | ParsedBox
  | ParsedSignatureBlock
  | ParsedDocFooter
  | ParsedMuolHeading
  | ParsedHeading
  | ParsedTable
  | ParsedParagraph
  | ParsedListItem
  | ParsedDivider
  | ParsedPageBreak;

/**
 * Parses a single column inside a multi-column signature block
 */
export function parseSingleSignatureColumn(rawLines: string[]): SignatureColumn {
  const cleanLines = rawLines
    .map((l) => l.replace(/\[\/?(?:col(?::\d+)?|left|center|right)\]/gi, '').trim())
    .filter(Boolean);

  if (cleanLines.length === 0) {
    return { lines: [] };
  }

  const dateLines: string[] = [];
  let title: string | undefined;
  let role: string | undefined;
  let name: string | undefined;
  const remainingLines: string[] = [];

  for (let idx = 0; idx < cleanLines.length; idx++) {
    const l = cleanLines[idx];

    // Explicit [name]...[/name]
    if (l.startsWith('[name]') && l.endsWith('[/name]')) {
      name = l.replace(/^\[name\]/, '').replace(/\[\/name\]$/, '').trim();
      continue;
    }

    // Explicit [role]...[/role]
    if (l.startsWith('[role]') && l.endsWith('[/role]')) {
      role = l.replace(/^\[role\]/, '').replace(/\[\/role\]$/, '').trim();
      continue;
    }

    // Explicit [date]...[/date]
    if (l.startsWith('[date]') && l.endsWith('[/date]')) {
      dateLines.push(l.replace(/^\[date\]/, '').replace(/\[\/date\]$/, '').trim());
      continue;
    }

    // Date line check: ថ្ងៃ..., ព.ស., ម៉ាឡៃ, ភ្នំពេញ, ឆ្នាំ២០...
    const isDate =
      /^(?:ថ្ងៃ|រាជធានី|ភ្នំពេញ|ធ្វើនៅ|ខេត្ត|ក្រុង|ស្រុក|ម៉ាឡៃ|បាត់ដំបង|សៀមរាប)/i.test(l) ||
      l.includes('ព.ស.') ||
      l.includes('សប្តស័ក') ||
      (l.includes('ថ្ងៃទី') && l.includes('ខែ'));

    if (isDate) {
      dateLines.push(l);
      continue;
    }

    // Approval / Title: e.g. បានឃើញ និងឯកភាព, ពិនិត្យ និងផ្ទៀងផ្ទាត់, យល់ព្រម
    const isApproval =
      /^(?:\*\*)?(?:បានឃើញ|ពិនិត្យ|ឯកភាព|ផ្ទៀងផ្ទាត់|យល់ព្រម|អនុម័ត)/i.test(l) &&
      !l.includes('នាយក') &&
      !l.includes('ប្រធាន');

    if (isApproval && !title) {
      title = l;
      continue;
    }

    remainingLines.push(l);
  }

  // From remaining lines: Role is top, Name is bottom
  if (remainingLines.length === 1) {
    if (!role) role = remainingLines[0];
    else if (!name) name = remainingLines[0];
  } else if (remainingLines.length === 2) {
    if (!role) role = remainingLines[0];
    if (!name) name = remainingLines[1];
  } else if (remainingLines.length > 2) {
    if (!name) {
      name = remainingLines[remainingLines.length - 1];
      remainingLines.pop();
    }
    if (!role) {
      role = remainingLines.join('\n');
    }
  }

  return {
    date: dateLines.length > 0 ? dateLines.join('\n') : undefined,
    title,
    role,
    name,
    lines: cleanLines,
  };
}

/**
 * Parses full :::signature-layout block contents
 */
export function parseSignatureLayoutBlock(rawLines: string[], specifiedCols?: number): ParsedSignatureBlock {
  const content = rawLines.join('\n');

  // Check for [footer]...[/footer]
  let footerLine: { left?: string[]; right?: string[] } | undefined;
  const footerMatch = content.match(/\[footer\]([\s\S]*?)\[\/footer\]/i);
  let contentWithoutFooter = content;
  if (footerMatch) {
    contentWithoutFooter = content.replace(footerMatch[0], '');
    const footerContent = footerMatch[1];
    const leftFooterMatch = footerContent.match(/\[left\]([\s\S]*?)\[\/left\]/i);
    const rightFooterMatch = footerContent.match(/\[right\]([\s\S]*?)\[\/right\]/i);
    footerLine = {
      left: leftFooterMatch ? leftFooterMatch[1].split('\n').map((l) => l.trim()).filter(Boolean) : [],
      right: rightFooterMatch ? rightFooterMatch[1].split('\n').map((l) => l.trim()).filter(Boolean) : [],
    };
  }

  // Check for [col]...[/col] or [col:1]...[/col:1]
  const colMatches = Array.from(contentWithoutFooter.matchAll(/\[col(?::\d+)?\]([\s\S]*?)\[\/col(?::\d+)?\]/gi));
  if (colMatches.length > 0) {
    const columns: SignatureColumn[] = colMatches.map((m) => parseSingleSignatureColumn(m[1].split('\n')));
    return {
      type: 'signature-layout',
      columns,
      footerLine,
    };
  }

  // Check for [left]...[/left], [center]...[/center], [right]...[/right]
  const leftMatch = contentWithoutFooter.match(/\[left\]([\s\S]*?)\[\/left\]/i);
  const centerMatch = contentWithoutFooter.match(/\[center\]([\s\S]*?)\[\/center\]/i);
  const rightMatch = contentWithoutFooter.match(/\[right\]([\s\S]*?)\[\/right\]/i);

  if (leftMatch || centerMatch || rightMatch) {
    const columns: SignatureColumn[] = [];
    if (leftMatch) {
      columns.push({ ...parseSingleSignatureColumn(leftMatch[1].split('\n')), align: 'left' });
    }
    if (centerMatch) {
      columns.push({ ...parseSingleSignatureColumn(centerMatch[1].split('\n')), align: 'center' });
    }
    if (rightMatch) {
      columns.push({ ...parseSingleSignatureColumn(rightMatch[1].split('\n')), align: 'right' });
    }
    return {
      type: 'signature-layout',
      columns,
      footerLine,
    };
  }

  // Fallback: legacy signature fields ([date], [role], [name], [cc])
  let date: string | undefined;
  let role: string | undefined;
  let name: string | undefined;
  let seal: string | undefined;
  const ccList: string[] = [];
  const lines = contentWithoutFooter.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const l of lines) {
    if (l.startsWith('[date]') && l.endsWith('[/date]')) {
      date = l.replace(/^\[date\]/, '').replace(/\[\/date\]$/, '').trim();
    } else if (l.startsWith('[role]') && l.endsWith('[/role]')) {
      role = l.replace(/^\[role\]/, '').replace(/\[\/role\]$/, '').trim();
    } else if (l.startsWith('[name]') && l.endsWith('[/name]')) {
      name = l.replace(/^\[name\]/, '').replace(/\[\/name\]$/, '').trim();
    } else if (l.startsWith('[seal]') && l.endsWith('[/seal]')) {
      seal = l.replace(/^\[seal\]/, '').replace(/\[\/seal\]$/, '').trim();
    } else if (l.startsWith('[cc]') || l.includes('កន្លែងទទួល')) {
      ccList.push(l.replace(/^\[\/?cc\]/g, '').trim());
    } else if (l) {
      if (l.includes('ថ្ងៃទី') || l.includes('ធ្វើនៅ') || l.includes('ឆ្នាំ២០')) date = l;
      else if (!role) role = l;
      else if (!name) name = l;
    }
  }

  return {
    type: 'signature-layout',
    date,
    role,
    name,
    seal,
    ccList: ccList.length > 0 ? ccList : undefined,
    footerLine,
  };
}

/**
 * Parses :::doc-footer block (e.g. prepared by / teacher info and page number)
 */
export function parseDocFooterBlock(rawLines: string[]): ParsedDocFooter {
  const content = rawLines.join('\n');
  const leftMatch = content.match(/\[left\]([\s\S]*?)\[\/left\]/i);
  const rightMatch = content.match(/\[right\]([\s\S]*?)\[\/right\]/i);

  const leftLines = leftMatch
    ? leftMatch[1].split('\n').map((l) => l.trim()).filter(Boolean)
    : [];
  const rightLines = rightMatch
    ? rightMatch[1].split('\n').map((l) => l.trim()).filter(Boolean)
    : [];

  if (leftLines.length === 0 && rightLines.length === 0) {
    const all = rawLines.map((l) => l.trim()).filter(Boolean);
    const mid = Math.ceil(all.length / 2);
    return {
      type: 'doc-footer',
      leftLines: all.slice(0, mid),
      rightLines: all.slice(mid),
      borderTop: 'double',
    };
  }

  return {
    type: 'doc-footer',
    leftLines,
    rightLines,
    borderTop: 'double',
  };
}

/**
 * Parses markdown-formatted or structured text into document AST blocks
 * preserving font styles (Muol, bold, italic, color), alignments, and layout blocks.
 */
export function parseDocumentContent(rawText: string): ParsedBlock[] {
  if (!rawText) return [];

  const lines = rawText.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 0. Check for Paper / Page Layout Setting: :::paper ... ::: or :::page-setup
    if (trimmed.startsWith(':::paper') || trimmed.startsWith(':::page-setup') || trimmed.startsWith(':::page-layout')) {
      const sizeMatch = trimmed.match(/(?:size|format)=["']?(A4|Letter|Legal|A3)["']?/i);
      const orientMatch = trimmed.match(/orientation=["']?(portrait|landscape)["']?/i);
      const marginsMatch = trimmed.match(/margins?=["']?(page-setup|administrative|standard|narrow|wide)["']?/i);
      const topMatch = trimmed.match(/top=["']?([0-9\.]+)["']?/i);
      const bottomMatch = trimmed.match(/bottom=["']?([0-9\.]+)["']?/i);
      const leftMatch = trimmed.match(/left=["']?([0-9\.]+)["']?/i);
      const rightMatch = trimmed.match(/right=["']?([0-9\.]+)["']?/i);

      let customM: CustomWordMargins | undefined = undefined;
      if (topMatch || bottomMatch || leftMatch || rightMatch) {
        customM = {
          top: topMatch ? parseFloat(topMatch[1]) : 0.69,
          bottom: bottomMatch ? parseFloat(bottomMatch[1]) : 0.59,
          left: leftMatch ? parseFloat(leftMatch[1]) : 0.59,
          right: rightMatch ? parseFloat(rightMatch[1]) : 0.59,
        };
      }

      let parsedSize: WordPaperSize | undefined = undefined;
      if (sizeMatch) {
        const sm = sizeMatch[1].toUpperCase();
        if (sm === 'A4') parsedSize = 'A4';
        else if (sm === 'A3') parsedSize = 'A3';
        else if (sm === 'LETTER') parsedSize = 'Letter';
        else if (sm === 'LEGAL') parsedSize = 'Legal';
      }
      blocks.push({
        type: 'paper-setting',
        paperSize: parsedSize,
        orientation: orientMatch ? (orientMatch[1].toLowerCase() as 'portrait' | 'landscape') : undefined,
        marginsPreset: marginsMatch ? (marginsMatch[1].toLowerCase() as WordMarginsPreset) : (customM ? 'page-setup' : undefined),
        customMargins: customM,
      });
      i++;
      continue;
    }

    // 1. Check for Page separator: e.g. "--- [ទំព័រទី 1 / Page 1] ---"
    const pageMatch = trimmed.match(/^---+\s*\[?(?:ទំព័រទី|Page)\s*([០-៩\d]+)[^\]]*\]?\s*---+/i);
    if (pageMatch) {
      blocks.push({
        type: 'page-break',
        pageNumber: parseInt(pageMatch[1].replace(/[០-៩]/g, (d) => String('០១២៣៤៥៦៧៨៩'.indexOf(d))), 10) || 1,
      });
      i++;
      continue;
    }

    // 2. Check for Horizontal rule: "---" or "***" or "==="
    if (/^(\-{3,}|\*{3,}|={3,})$/.test(trimmed)) {
      blocks.push({
        type: 'divider',
        style: trimmed.startsWith('=') ? 'double' : trimmed.startsWith('*') ? 'dashed' : 'single',
      });
      i++;
      continue;
    }

    // 3. Check for 2-column header layout block: :::header-layout ... :::
    if (trimmed.startsWith(':::header-layout') || trimmed.startsWith(':::layout-header')) {
      const headerAttr = trimmed;
      const bgMatch = headerAttr.match(/bg=([#a-zA-Z0-9]+)/i);
      const borderMatch = headerAttr.match(/border=(single|double|dashed|none)/i);
      const bgColor = bgMatch ? bgMatch[1].replace(/^#/, '').toUpperCase() : undefined;
      const borderBottom = borderMatch ? (borderMatch[1].toLowerCase() as 'single' | 'double' | 'dashed' | 'none') : undefined;

      i++;
      const leftLines: string[] = [];
      const rightLines: string[] = [];
      let currentSection: 'left' | 'right' | null = null;

      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        const l = lines[i].trim();
        if (l === '[left]') {
          currentSection = 'left';
        } else if (l === '[/left]') {
          currentSection = null;
        } else if (l === '[right]') {
          currentSection = 'right';
        } else if (l === '[/right]') {
          currentSection = null;
        } else if (l) {
          if (currentSection === 'left') leftLines.push(l);
          else if (currentSection === 'right') rightLines.push(l);
          else {
            // Default split if no sub-tags
            if (l.includes('ព្រះរាជាណាចក្រកម្ពុជា') || l.includes('រាជធានីភ្នំពេញ') || l.includes('ថ្ងៃទី')) {
              rightLines.push(l);
            } else {
              leftLines.push(l);
            }
          }
        }
        i++;
      }
      i++; // Skip closing :::

      const hasMotto = rightLines.some((r) => r.includes('ព្រះរាជាណាចក្រកម្ពុជា') || r.includes('ជាតិ  សាសនា  ព្រះមហាក្សត្រ'));
      blocks.push({
        type: 'header-layout',
        leftLines,
        rightLines,
        hasMotto,
        hasFlourish: hasMotto,
        bgColor,
        borderBottom,
      });
      continue;
    }


    // 3.5. Check for Image marker: :::image ... ::: or [image:data:image/...] or ![alt](url)
    if (trimmed.startsWith(':::image') || trimmed.startsWith('![') || trimmed.startsWith('[image:')) {
      if (trimmed.startsWith(':::image')) {
        const imgAttr = trimmed;
        const widthMatch = imgAttr.match(/width=(d+)/i);
        const heightMatch = imgAttr.match(/height=(d+)/i);
        const alignMatch = imgAttr.match(/align=(left|center|right)/i);
        const altMatch = imgAttr.match(/alt=["']([^"']+)["']/i);
        const captionMatch = imgAttr.match(/caption=["']([^"']+)["']/i);

        i++;
        let dataUrl = '';
        while (i < lines.length && !lines[i].trim().startsWith(':::')) {
          dataUrl += lines[i].trim();
          i++;
        }
        i++; // Skip closing :::

        blocks.push({
          type: 'image',
          dataUrl,
          width: widthMatch ? parseInt(widthMatch[1], 10) : 480,
          height: heightMatch ? parseInt(heightMatch[1], 10) : 320,
          align: alignMatch ? (alignMatch[1].toLowerCase() as any) : 'center',
          alt: altMatch ? altMatch[1] : 'PDF Image',
          caption: captionMatch ? captionMatch[1] : undefined,
        });
        continue;
      } else if (trimmed.startsWith('![')) {
        const mdImg = trimmed.match(/^!\[([^\]]*)\]\(([^\)]+)\)/);
        if (mdImg) {
          blocks.push({
            type: 'image',
            alt: mdImg[1] || 'PDF Image',
            dataUrl: mdImg[2],
            width: 480,
            height: 320,
            align: 'center',
          });
          i++;
          continue;
        }
      } else if (trimmed.startsWith('[image:')) {
        const inlineImg = trimmed.slice(7, -1).trim();
        blocks.push({
          type: 'image',
          dataUrl: inlineImg,
          width: 480,
          height: 320,
          align: 'center',
        });
        i++;
        continue;
      }
    }

    // 3.6. Check for Shape block: :::shape ... :::
    if (trimmed.startsWith(':::shape')) {
      const shapeAttr = trimmed;
      const typeMatch = shapeAttr.match(/type=(seal-box|badge|ribbon|rounded-box|banner|callout|stamp-circle|header-accent|divider-shape)/i);
      const borderColorMatch = shapeAttr.match(/borderColor=([#a-zA-Z0-9]+)/i);
      const bgMatch = shapeAttr.match(/bg=([#a-zA-Z0-9]+)/i);
      const textMatch = shapeAttr.match(/textColor=([#a-zA-Z0-9]+)/i);
      const borderStyleMatch = shapeAttr.match(/border=(single|double|dashed|dotted)/i);
      const titleMatch = shapeAttr.match(/title=["']([^"']+)["']/i);
      const subtitleMatch = shapeAttr.match(/subtitle=["']([^"']+)["']/i);
      const alignMatch = shapeAttr.match(/align=(left|center|right)/i);
      const iconMatch = shapeAttr.match(/icon=["']([^"']+)["']/i);

      i++;
      const shapeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        shapeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing :::

      let resolvedShapeAlign: 'left' | 'center' | 'right' = 'left';
      if (alignMatch) {
        resolvedShapeAlign = alignMatch[1].toLowerCase() as any;
      } else if (typeMatch && (typeMatch[1] === 'stamp-circle' || typeMatch[1] === 'badge')) {
        resolvedShapeAlign = 'center';
      } else {
        // Document content boxes, header metadata, and syllabus info default to left alignment as in original documents
        resolvedShapeAlign = 'left';
      }

      blocks.push({
        type: 'shape',
        shapeType: typeMatch ? (typeMatch[1].toLowerCase() as any) : 'seal-box',
        borderColor: borderColorMatch ? borderColorMatch[1].replace(/^#/, '').toUpperCase() : '1D4ED8',
        bgColor: bgMatch ? bgMatch[1].replace(/^#/, '').toUpperCase() : 'EFF6FF',
        textColor: textMatch ? textMatch[1].replace(/^#/, '').toUpperCase() : '1E3A8A',
        borderStyle: borderStyleMatch ? (borderStyleMatch[1].toLowerCase() as any) : 'double',
        title: titleMatch ? titleMatch[1] : undefined,
        subtitle: subtitleMatch ? subtitleMatch[1] : undefined,
        align: resolvedShapeAlign,
        icon: iconMatch ? iconMatch[1] : undefined,
        content: shapeLines,
      });
      continue;
    }

    // 4. Check for Box / Callout Block: :::box ... ::: or :::callout ... :::
    if (trimmed.startsWith(':::box') || trimmed.startsWith(':::callout')) {
      const boxAttr = trimmed;
      const borderStyleMatch = boxAttr.match(/border=(single|double|dashed|dotted|accent-left|none)/i);
      const borderColorMatch = boxAttr.match(/borderColor=([#a-zA-Z0-9]+)/i);
      const bgMatch = boxAttr.match(/bg=([#a-zA-Z0-9]+)/i);
      const titleMatch = boxAttr.match(/title=["']([^"']+)["']/i);
      const boxAlignMatch = boxAttr.match(/align=(left|center|right)/i);

      let borderStyle: ParsedBox['borderStyle'] = borderStyleMatch
        ? (borderStyleMatch[1].toLowerCase() as any)
        : boxAttr.includes('callout') ? 'accent-left' : 'single';
      let borderColor = borderColorMatch ? borderColorMatch[1].replace(/^#/, '').toUpperCase() : '2563EB';
      let bgColor = bgMatch ? bgMatch[1].replace(/^#/, '').toUpperCase() : 'EFF6FF';
      let title = titleMatch ? titleMatch[1] : undefined;
      let align: 'left' | 'center' | 'right' = boxAlignMatch ? (boxAlignMatch[1].toLowerCase() as any) : 'left';

      i++;
      const boxLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        boxLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing :::

      blocks.push({
        type: 'box',
        borderStyle,
        borderColor,
        bgColor,
        title,
        align,
        content: boxLines,
      });
      continue;
    }

    // 5. Check for Blockquote: > ... (Callout box with accent-left border)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'box',
        borderStyle: 'accent-left',
        borderColor: '2563EB',
        bgColor: 'F8FAFC',
        content: quoteLines,
      });
      continue;
    }

    // 6. Check for Signature block: :::signature-layout ... :::
    if (trimmed.startsWith(':::signature-layout') || trimmed.startsWith(':::signature')) {
      const dirMatch = trimmed.match(/cols=(\d+)/i);
      const specifiedCols = dirMatch ? parseInt(dirMatch[1], 10) : undefined;
      i++;
      const sigLines: string[] = [];

      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        sigLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing :::

      const parsedSig = parseSignatureLayoutBlock(sigLines, specifiedCols);
      blocks.push(parsedSig);

      if (parsedSig.footerLine && (parsedSig.footerLine.left?.length || parsedSig.footerLine.right?.length)) {
        blocks.push({
          type: 'doc-footer',
          leftLines: parsedSig.footerLine.left || [],
          rightLines: parsedSig.footerLine.right || [],
          borderTop: 'double',
        });
      }
      continue;
    }

    // 6b. Check for Document Footer: :::doc-footer ... ::: or :::page-footer
    if (trimmed.startsWith(':::doc-footer') || trimmed.startsWith(':::page-footer')) {
      i++;
      const footerLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        footerLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing :::
      blocks.push(parseDocFooterBlock(footerLines));
      continue;
    }

    // 7. Check for Markdown Table: starts with '|' and contains '|'
    if (trimmed.startsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length) {
        const curTrim = lines[i].trim();
        if (curTrim.startsWith('|') && curTrim.includes('|')) {
          tableLines.push(curTrim);
          i++;
        } else if (
          tableLines.length > 0 &&
          curTrim.length > 0 &&
          !curTrim.startsWith('#') &&
          !curTrim.startsWith(':::') &&
          !curTrim.startsWith('---') &&
          !curTrim.startsWith('===') &&
          !curTrim.startsWith('___')
        ) {
          // Continuation line of multi-line table cell (e.g. bullets, shapes, or images)
          tableLines[tableLines.length - 1] += '<br>' + curTrim;
          i++;
        } else {
          break;
        }
      }

      const parsedTable = parseMarkdownTableLines(tableLines);
      if (parsedTable) {
        blocks.push(parsedTable);
      }
      continue;
    }

    // 8. Check for Tab-separated pseudo-table
    if (trimmed.includes('\t') && !trimmed.startsWith('#')) {
      const tsvLines: string[] = [];
      while (i < lines.length && lines[i].includes('\t')) {
        tsvLines.push(lines[i]);
        i++;
      }
      if (tsvLines.length >= 2) {
        const rows = tsvLines.map((l) => l.split('\t').map((c) => c.trim()));
        const headers = rows[0];
        const dataRows = rows.slice(1);
        blocks.push({
          type: 'table',
          headers,
          rows: dataRows,
          alignments: headers.map(() => 'left'),
        });
        continue;
      }
    }

    // 9. Check for Explicit Muol / Royal Motto lines:
    // e.g. [muol]...[/muol] or "ព្រះរាជាណាចក្រកម្ពុជា" or "ជាតិ  សាសនា  ព្រះមហាក្សត្រ"
    const isRoyalMotto =
      trimmed === 'ព្រះរាជាណាចក្រកម្ពុជា' ||
      trimmed === 'ជាតិ  សាសនា  ព្រះមហាក្សត្រ' ||
      trimmed === 'ជាតិ សាសនា ព្រះមហាក្សត្រ' ||
      trimmed.includes('[muol]ព្រះរាជាណាចក្រកម្ពុជា') ||
      trimmed.includes('[muol]ជាតិ');

    if (isRoyalMotto) {
      const cleanMotto = trimmed.replace(/\[\/?muol\]/g, '').replace(/\[\/?center\]/g, '').trim();
      blocks.push({
        type: 'muol-heading',
        text: cleanMotto,
        level: 1,
        hasFlourish: cleanMotto.includes('ជាតិ'),
      });
      i++;
      continue;
    }

    // Check for explicit [muol] tag line
    if (trimmed.startsWith('[muol]') && trimmed.endsWith('[/muol]')) {
      const inner = trimmed.slice(6, -7).trim();
      blocks.push({
        type: 'muol-heading',
        text: inner,
        level: 2,
      });
      i++;
      continue;
    }

    // 10. Check for Decree / Prakas / Certificate Title:
    // Centered or Bold titles like "លិខិតស្តីពី៖ ...", "ប្រកាស", "សេចក្តីសម្រេច", "វិញ្ញាបនបត្រ..."
    const isDecreeTitle =
      /^(?:\[center\]|\*\*)?(?:ប្រកាស|សេចក្តីសម្រេច|វិញ្ញាបនបត្រ|លិខិតបញ្ជាក់|លិខិតស្តីពី|របាយការណ៍|កិច្ចសន្យា|លិខិតអញ្ជើញ)/.test(
        trimmed
      );

    if (isDecreeTitle && trimmed.length < 150) {
      const cleanTitle = trimmed
        .replace(/\[\/?(?:center|muol)\]/g, '')
        .replace(/^\*\*|\*\*$/g, '')
        .trim();
      blocks.push({
        type: 'muol-heading',
        text: cleanTitle,
        level: 2,
      });
      i++;
      continue;
    }

    // 11. Check for Headings: # H1, ## H2, ### H3
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      const text = headingMatch[2].trim();
      const isMuol = text.includes('[អក្សរមូល]') || text.includes('[muol]');
      blocks.push({
        type: 'heading',
        level,
        text: text.replace(/\[(?:អក្សរមូល|muol)\]/g, '').trim(),
        isMuol,
      });
      i++;
      continue;
    }

    // Indentation level helper
    const leadingSpaces = line.search(/\S/);
    const listLevel = leadingSpaces > 3 ? 2 : leadingSpaces > 1 ? 1 : 0;

    // Check if this line is an indented continuation of the previous list item
    const lastBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;
    const isPrevListItem =
      lastBlock &&
      (lastBlock.type === 'bullet' ||
        lastBlock.type === 'numbered' ||
        lastBlock.type === 'checklist' ||
        lastBlock.type === 'khmer-bullet');
    const isExplicitBulletMarker =
      /^([-*]\s*\[([ xX])\]|[☑☐✔✓]|[ក-អ][\.\)]|\([ក-អ]\)|[០-៩\d]+[\.\)]|\([០-៩\d]+\)|[➢➔➤➜►▶▪▫■□◆◇❖※✽✦•–—◦∙⁃\+]|\*|-)\s+/.test(
        trimmed
      );
    const isSpecialBlockStart =
      trimmed.startsWith('#') ||
      trimmed.startsWith('|') ||
      trimmed.startsWith(':::') ||
      trimmed.startsWith('---');

    if (isPrevListItem && leadingSpaces >= 2 && !isExplicitBulletMarker && !isSpecialBlockStart) {
      blocks.push({
        type: 'paragraph',
        runs: parseInlineRuns(trimmed),
        alignment: 'left',
        isBulletContinuation: true,
        indentLevel: (lastBlock as ParsedListItem).level || 0,
      });
      i++;
      continue;
    }

    // 12. Check for Checklist Items: - [ ] or - [x] or ☑ or ☐ or ✔
    const checkMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      blocks.push({
        type: 'checklist',
        checked: checkMatch[1].toLowerCase() === 'x',
        level: listLevel,
        runs: parseInlineRuns(checkMatch[2]),
      });
      i++;
      continue;
    }

    const boxCheckMatch = trimmed.match(/^([☑☐✔✓])\s*(.*)$/);
    if (boxCheckMatch) {
      const isChecked = boxCheckMatch[1] === '☑' || boxCheckMatch[1] === '✔' || boxCheckMatch[1] === '✓';
      blocks.push({
        type: 'checklist',
        checked: isChecked,
        level: listLevel,
        runs: parseInlineRuns(boxCheckMatch[2]),
      });
      i++;
      continue;
    }

    // 13. Check for Khmer Alphabetical list items: ក. or (ក) or ក)
    const khmerAlphaMatch = trimmed.match(/^([ក-អ][\.\)]|\([ក-អ]\))\s+(.*)$/);
    if (khmerAlphaMatch) {
      blocks.push({
        type: 'khmer-bullet',
        marker: khmerAlphaMatch[1],
        level: listLevel,
        runs: parseInlineRuns(khmerAlphaMatch[2]),
      });
      i++;
      continue;
    }

    // 14. Check for Numbered list items: 1. or 01. or ០១. or (១)
    const numMatch = trimmed.match(/^([០-៩\d]+[\.\)]|\([០-៩\d]+\))\s+(.*)$/);
    if (numMatch) {
      blocks.push({
        type: 'numbered',
        marker: numMatch[1],
        level: listLevel,
        runs: parseInlineRuns(numMatch[2]),
      });
      i++;
      continue;
    }

    // 15. Check for Graphic Bullets / Arrows: ➢ or ➔ or ❖ or ◆ or ■ or ▪ or ▫ or • or – or — or ◦ or ∙ or ⁃ or +
    const graphicBulletMatch = trimmed.match(/^([➢➔➤➜►▶▪▫■□◆◇❖※✽✦•–—◦∙⁃\+])\s+(.*)$/);
    if (graphicBulletMatch) {
      blocks.push({
        type: 'bullet',
        marker: graphicBulletMatch[1],
        level: listLevel,
        runs: parseInlineRuns(graphicBulletMatch[2]),
      });
      i++;
      continue;
    }

    // 16. Check for Standard Bullet list items: * or -
    const bulletMatch = trimmed.match(/^[\*\-]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({
        type: 'bullet',
        level: listLevel,
        runs: parseInlineRuns(bulletMatch[1]),
      });
      i++;
      continue;
    }

    // 17. Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // 18. Check if line is at the end and looks like date or signature
    const isDateLine =
      /^(?:\[right\])?(?:ធ្វើនៅ|រាជធានីភ្នំពេញ|ភ្នំពេញ)[\s,]+ថ្ងៃទី/i.test(trimmed) ||
      trimmed.startsWith('រាជធានីភ្នំពេញ, ថ្ងៃទី') ||
      trimmed.includes('ឆ្នាំ២០២');

    if (isDateLine && i >= lines.length - 8) {
      // Look ahead for signature block
      let sigDate = trimmed.replace(/\[\/?right\]/g, '').trim();
      let sigRole: string | undefined;
      let sigName: string | undefined;

      if (i + 1 < lines.length && lines[i + 1].trim()) {
        sigRole = lines[i + 1].trim().replace(/\[\/?right\]/g, '').replace(/^\*\*|\*\*$/g, '');
        i++;
      }
      if (i + 1 < lines.length && lines[i + 1].trim()) {
        sigName = lines[i + 1].trim().replace(/\[\/?right\]/g, '').replace(/^\*\*|\*\*$/g, '');
        i++;
      }

      blocks.push({
        type: 'signature-layout',
        date: sigDate,
        role: sigRole,
        name: sigName,
      });
      i++;
      continue;
    }

    // 19. Check alignment markers [center], [right], [left]
    let alignment: 'left' | 'center' | 'right' | 'both' = 'left';
    let processedText = trimmed;

    if (processedText.startsWith('[left]') && processedText.endsWith('[/left]')) {
      alignment = 'left';
      processedText = processedText.slice(6, -7).trim();
    } else if (processedText.startsWith('[center]') && processedText.endsWith('[/center]')) {
      alignment = 'center';
      processedText = processedText.slice(8, -9).trim();
    } else if (processedText.startsWith('[right]') && processedText.endsWith('[/right]')) {
      alignment = 'right';
      processedText = processedText.slice(7, -8).trim();
    } else if (processedText.startsWith('[left]')) {
      alignment = 'left';
      processedText = processedText.replace(/^\[left\]/, '').replace(/\[\/left\]$/, '').trim();
    } else if (processedText.startsWith('[center]')) {
      alignment = 'center';
      processedText = processedText.replace(/^\[center\]/, '').replace(/\[\/center\]$/, '').trim();
    } else if (processedText.startsWith('[right]')) {
      alignment = 'right';
      processedText = processedText.replace(/^\[right\]/, '').replace(/\[\/right\]$/, '').trim();
    } else {
      // Body paragraph: Check for administrative opening for first-line indentation
      const isAdministrativeOpening =
        /^(?:សូមជម្រាបជូន|យោងតាម|យោង|តាមរយៈ|អាស្រ័យហេតុនេះ|ដើម្បី|ដោយយោង|អនុលោមតាម|ក្នុងគោលបំណង)/.test(
          processedText
        );
      if (isAdministrativeOpening) {
        alignment = 'both';
      }
    }

    if (!processedText) {
      i++;
      continue;
    }

    // Check if paragraph contains inline bullets (bullet ក្នុងកថាខណ្ឌ)
    const inlineBullets = tryExtractInlineBullets(processedText, listLevel);
    if (inlineBullets && inlineBullets.length > 0) {
      blocks.push(...inlineBullets);
      i++;
      continue;
    }

    blocks.push({
      type: 'paragraph',
      runs: parseInlineRuns(processedText),
      alignment,
      isFirstLineIndent: alignment === 'both',
    });
    i++;
  }

  return blocks;
}

/**
 * Parses markdown table lines into headers, rows, and column alignments
 */
function parseMarkdownTableLines(tableLines: string[]): ParsedTable | null {
  if (tableLines.length < 1) return null;

  const parseRow = (line: string) => {
    let clean = line.trim();
    if (clean.startsWith('|')) clean = clean.slice(1);
    if (clean.endsWith('|')) clean = clean.slice(0, -1);
    return clean.split('|').map((cell) => cell.trim());
  };

  const headerCells = parseRow(tableLines[0]);
  let alignmentLineIdx = 1;

  const isDelimiter =
    tableLines.length > 1 &&
    /^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)*\|?$/.test(tableLines[1]);
  let alignments: ('left' | 'center' | 'right')[] = headerCells.map(() => 'left');

  if (isDelimiter) {
    const rawAligns = parseRow(tableLines[1]);
    alignments = rawAligns.map((d) => {
      const leftCol = d.startsWith(':');
      const rightCol = d.endsWith(':');
      if (leftCol && rightCol) return 'center';
      if (rightCol) return 'right';
      return 'left';
    });
    alignmentLineIdx = 2;
  }

  const dataRows: string[][] = [];
  for (let r = alignmentLineIdx; r < tableLines.length; r++) {
    const row = parseRow(tableLines[r]);
    while (row.length < headerCells.length) row.push('');
    dataRows.push(row.slice(0, headerCells.length));
  }

  return {
    type: 'table',
    headers: headerCells,
    rows: dataRows,
    alignments,
  };
}

/**
 * Converts size strings (e.g. '14', '14pt', 'small', 'large', 'title') to Word half-points
 */
export function parseSizeToHalfPoints(sizeStr: string): number | undefined {
  if (!sizeStr) return undefined;
  const clean = sizeStr.trim().toLowerCase();
  if (clean === 'small' || clean === 'sm') return 18; // 9pt
  if (clean === 'base' || clean === 'normal' || clean === 'md') return 24; // 12pt
  if (clean === 'large' || clean === 'lg') return 28; // 14pt
  if (clean === 'xlarge' || clean === 'xl') return 32; // 16pt
  if (clean === 'xxlarge' || clean === '2xl' || clean === 'title') return 36; // 18pt
  if (clean === 'huge' || clean === '3xl') return 44; // 22pt
  const num = parseFloat(clean.replace('pt', ''));
  if (!isNaN(num) && num >= 6 && num <= 96) {
    return Math.round(num * 2);
  }
  return undefined;
}

/**
 * Splits a string containing inline bullets or multiple bullet items into individual ParsedBlocks
 */
export function splitSubBullets(text: string, baseLevel: number): ParsedBlock[] {
  const bulletSplitRegex = /(?:^|\s+)([•◦∙⁃➢➔➤➜►▶▪▫■□◆◇❖※✽✦✓✔☑☐\*\-–—\+]|\([ក-អ]\)|[ក-អ][\.\)]|\([០-៩\d]+\)|[០-៩\d]+[\.\)]|\[[ xX]\])\s+/g;
  const matches = Array.from(text.matchAll(bulletSplitRegex));
  if (matches.length === 0) {
    return [
      {
        type: 'paragraph',
        runs: parseInlineRuns(text),
        alignment: 'left',
      },
    ];
  }

  const results: ParsedBlock[] = [];
  for (let idx = 0; idx < matches.length; idx++) {
    const m = matches[idx];
    const marker = m[1];
    const startIndex = (m.index ?? 0) + m[0].length;
    const nextIndex = idx + 1 < matches.length ? (matches[idx + 1].index ?? text.length) : text.length;
    const itemContent = text.substring(startIndex, nextIndex).trim();
    if (!itemContent) continue;

    // Check checklist
    if (marker === '[ ]' || marker === '[x]' || marker === '[X]' || marker === '☑' || marker === '☐' || marker === '✔' || marker === '✓') {
      results.push({
        type: 'checklist',
        checked: marker.toLowerCase().includes('x') || marker === '☑' || marker === '✔' || marker === '✓',
        level: baseLevel,
        runs: parseInlineRuns(itemContent),
      });
    } else if (/^([ក-អ][\.\)]|\([ក-អ]\))$/.test(marker)) {
      results.push({
        type: 'khmer-bullet',
        marker,
        level: baseLevel,
        runs: parseInlineRuns(itemContent),
      });
    } else if (/^([០-៩\d]+[\.\)]|\([០-៩\d]+\))$/.test(marker)) {
      results.push({
        type: 'numbered',
        marker,
        level: baseLevel,
        runs: parseInlineRuns(itemContent),
      });
    } else {
      results.push({
        type: 'bullet',
        marker,
        level: baseLevel,
        runs: parseInlineRuns(itemContent),
      });
    }
  }

  return results;
}

/**
 * Checks if a paragraph line contains inline bullet points (e.g. following ៖ or : or multiple bullets)
 */
export function tryExtractInlineBullets(text: string, baseLevel: number): ParsedBlock[] | null {
  if (!text) return null;

  // Case A: Introductory text ending in colon or ៖ followed by bullet marker
  const introColonMatch = text.match(/^(.*?[៖:])\s+([•◦∙⁃➢➔➤➜►▶▪▫■□◆◇❖※✽✦✓✔☑☐\*\-–—\+]|[ក-អ][\.\)]|\([ក-អ]\)|[០-៩\d]+[\.\)]|\([០-៩\d]+\)|\[[ xX]\])\s+(.*)$/);
  if (introColonMatch) {
    const introText = introColonMatch[1].trim();
    const restBullets = introColonMatch[2] + ' ' + introColonMatch[3];
    const res: ParsedBlock[] = [];
    if (introText) {
      res.push({
        type: 'paragraph',
        runs: parseInlineRuns(introText),
        alignment: 'left',
      });
    }
    res.push(...splitSubBullets(restBullets, baseLevel));
    return res;
  }

  // Case B: Line contains 2 or more bullet points
  const bulletMatches = Array.from(text.matchAll(/(?:^|\s+)([•◦∙⁃➢➔➤➜►▶▪▫■□◆◇❖※✽✦✓✔☑☐\*\-–—\+]|\([ក-អ]\)|[ក-អ][\.\)]|\([០-៩\d]+\)|[០-៩\d]+[\.\)]|\[[ xX]\])\s+/g));
  if (bulletMatches.length >= 2) {
    const firstIndex = bulletMatches[0].index ?? 0;
    const leadingText = text.substring(0, firstIndex).trim();
    const res: ParsedBlock[] = [];
    if (leadingText) {
      res.push({
        type: 'paragraph',
        runs: parseInlineRuns(leadingText),
        alignment: 'left',
      });
    }
    res.push(...splitSubBullets(text.substring(firstIndex), baseLevel));
    return res;
  }

  return null;
}

/**
 * Parses inline formatting: [size:..], [muol], **bold**, *italic*, <u>underline</u>, [color:#hex], [bg:#hex], and ==highlight==
 */
export function parseInlineRuns(text: string): ParsedRun[] {
  if (!text) return [];

  // Remove outer alignment tags and strip any structural/layout tags so they never leak as raw text
  let clean = text
    .replace(/\[\/?(?:left|center|right|col(?::\d+)?|name|role|date|seal|footer)\]/gi, '')
    .trim();

  const runs: ParsedRun[] = [];

  // Regex handles [size:pt]...[/size], [muol]...[/muol], [color:#hex]...[/color], [bg:#hex]...[/bg], ==highlight==, **bold**, *italic*, <u>...</u>, plain text
  const regex = /(\[size:([0-9a-zA-Z\.]+)\](.*?)\[\/size\]|\[muol\](.*?)\[\/muol\]|\[color:([#a-zA-Z0-9]+)\](.*?)\[\/color\]|\[bg:([#a-zA-Z0-9]+)\](.*?)\[\/bg\]|==([^=]+)==|\*\*([^*]+)\*\*|\*([^*]+)\*|<u>(.*?)<\/u>|([^[*<=]+|\[|\]|<|>|\*|=))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(clean)) !== null) {
    if (match[2] !== undefined && match[3] !== undefined) {
      // [size:14pt]text[/size]
      const halfPoints = parseSizeToHalfPoints(match[2]);
      const innerRuns = parseInlineRuns(match[3]);
      for (const ir of innerRuns) {
        if (halfPoints) ir.size = halfPoints;
        runs.push(ir);
      }
    } else if (match[4] !== undefined) {
      // [muol]text[/muol]
      runs.push({ text: match[4], muol: true, bold: true });
    } else if (match[5] !== undefined && match[6] !== undefined) {
      // [color:hex]text[/color]
      const colorVal = match[5].replace(/^#/, '').toUpperCase();
      runs.push({ text: match[6], color: colorVal, bold: true });
    } else if (match[7] !== undefined && match[8] !== undefined) {
      // [bg:hex]text[/bg]
      const bgVal = match[7].replace(/^#/, '').toUpperCase();
      runs.push({ text: match[8], bgColor: bgVal });
    } else if (match[9] !== undefined) {
      // ==highlight==
      runs.push({ text: match[9], bgColor: 'FEF3C7', bold: true });
    } else if (match[10] !== undefined) {
      // **bold**
      runs.push({ text: match[10], bold: true });
    } else if (match[11] !== undefined) {
      // *italic*
      runs.push({ text: match[11], italic: true });
    } else if (match[12] !== undefined) {
      // <u>underline</u>
      runs.push({ text: match[12], underline: true });
    } else if (match[13]) {
      runs.push({ text: match[13] });
    }
  }

  return runs.length > 0 ? runs : [{ text: clean }];
}

/**
 * Generates a complete, beautifully laid out Microsoft Word (.docx) document as a Blob
 * with strict Khmer typography (Khmer OS Muol Light, Kantumruy Pro) and official layout.
 */
export async function createWordDocumentFromText(
  rawText: string,
  options: WordExportOptions = {}
): Promise<Blob> {
  const {
    title = 'Cambodia Official Document',
    fontFamily = 'Kantumruy Pro',
    muolFont = 'Khmer OS Muol Light',
    fontSizePt = 12,
    tableStyle = 'bordered',
    tableBorderColor = 'slate',
    tableHeaderBg = 'slate-soft',
    bulletPreset = 'auto',
    headerBannerStyle = 'none',
    headerBgColor,
    layoutPreset = 'cambodian-official',
    firstLineIndent = true,
    justifyText = true,
    marginsPreset = 'administrative',
    orientation = 'portrait',
    includePageNumbers = true,
    includeHeaderFooter = false,
    author = 'Secure PDF Studio',
  } = options;

  const halfPoints = fontSizePt * 2; // Word uses half-points (12pt = 24 half-points)
    // If pageImages are passed and embedPdfImages is enabled, ensure they are represented in blocks
  let blocks = parseDocumentContent(rawText);
  if (options.embedPdfImages && options.pageImages && options.pageImages.length > 0) {
    const hasImageBlock = blocks.some((b) => b.type === "image");
    if (!hasImageBlock) {
      const imageBlocks = options.pageImages.map((img) => ({
        type: "image" as const,
        dataUrl: img.dataUrl,
        width: Math.min(img.width || 480, 520),
        height: img.height ? Math.round(img.height * (Math.min(img.width || 480, 520) / img.width)) : 340,
        align: "center" as const,
        caption: "PDF Page " + img.pageNumber + " Image",
        pageNumber: img.pageNumber,
      }));
      blocks = [...imageBlocks, ...blocks];
    }
  }

  // Convert blocks to docx Paragraphs and Tables
  const children: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    // 1. Page Break
    if (block.type === 'page-break') {
      children.push(
        new Paragraph({
          pageBreakBefore: true,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: `--- ទំព័រទី ${block.pageNumber} ---`,
              color: '94A3B8',
              size: Math.max(16, halfPoints - 6),
              italics: true,
              font: { name: fontFamily },
            }),
          ],
        })
      );
      continue;
    }

    // 2. Divider
    if (block.type === 'divider') {
      const borderStyle =
        block.style === 'double'
          ? BorderStyle.DOUBLE
          : block.style === 'dashed'
          ? BorderStyle.DASHED
          : BorderStyle.SINGLE;
      const borderSize = block.style === 'double' ? 12 : 6;

      children.push(
        new Paragraph({
          spacing: { before: 180, after: 180 },
          border: {
            bottom: { style: borderStyle, size: borderSize, color: 'CBD5E1' },
          },
        })
      );
      continue;
    }

    // 3. Two-column Administrative Header Layout
    if (block.type === 'header-layout') {
      const headerTable = buildAdministrativeHeaderTable(
        block,
        fontFamily,
        muolFont,
        halfPoints,
        headerBannerStyle,
        headerBgColor
      );
      children.push(headerTable);
      children.push(new Paragraph({ spacing: { before: 120, after: 120 } }));
      continue;
    }

    // 4. Box / Framed Callout Block (borders, background color)
    
    // Image Block
    if (block.type === 'image') {
      const imgPara = buildImageParagraph(block);
      if (imgPara) {
        children.push(imgPara);
      }
      continue;
    }

    // Decorated Shape Block (Seal, Badge, Ribbon, Rounded Callout)
    if (block.type === 'shape') {
      const shapeTable = buildShapeBlock(block, fontFamily, muolFont, halfPoints);
      children.push(shapeTable);
      children.push(
        new Paragraph({
          spacing: { before: 0, after: 60 },
          children: [new TextRun('')],
        })
      );
      continue;
    }

    if (block.type === 'box') {
      const boxTable = buildBoxTable(block, fontFamily, muolFont, halfPoints);
      children.push(boxTable);
      children.push(new Paragraph({ spacing: { before: 120, after: 100 } }));
      continue;
    }

    // 5. Khmer Royal Motto & Official Decree Title (អក្សរមូល)
    if (block.type === 'muol-heading') {
      const isRoyal = block.level === 1;
      const headingSize = isRoyal ? halfPoints + 8 : halfPoints + 4; // 16pt or 14pt

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: {
            before: isRoyal ? 140 : 280,
            after: block.hasFlourish ? 40 : 140,
            line: 360,
          },
          children: [
            new TextRun({
              text: block.text,
              bold: true,
              size: headingSize,
              font: { name: muolFont },
              color: '0F172A',
            }),
          ],
        })
      );

      // Add decorative wave / flourish line under "ជាតិ សាសនា ព្រះមហាក្សត្រ"
      if (block.hasFlourish) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20, after: 200 },
            children: [
              new TextRun({
                text: '-----------------------------',
                color: '2563EB',
                bold: true,
                size: 18,
                font: { name: fontFamily },
              }),
            ],
          })
        );
      }
      continue;
    }

    // 6. Standard Heading (H1, H2, H3)
    if (block.type === 'heading') {
      const headingSizes: Record<1 | 2 | 3, number> = {
        1: halfPoints + 8, // +4pt
        2: halfPoints + 4, // +2pt
        3: halfPoints + 2, // +1pt
      };

      children.push(
        new Paragraph({
          alignment: block.level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 240, after: 120, line: 360 },
          children: [
            new TextRun({
              text: block.text,
              bold: true,
              size: headingSizes[block.level],
              font: { name: block.isMuol ? muolFont : fontFamily },
              color: '0F172A',
            }),
          ],
        })
      );
      continue;
    }

    // 7. Checklist Item (- [ ] or - [x] or ☑)
    if (block.type === 'checklist') {
      const markerText = block.checked ? '☑ ' : '☐ ';
      const markerColor = block.checked ? '16A34A' : '64748B';
      const indentLevel = block.level || 0;

      children.push(
        new Paragraph({
          indent: { left: indentLevel * 360 + 400, hanging: 240 },
          spacing: { before: 50, after: 50, line: 340 },
          children: [
            new TextRun({
              text: markerText,
              bold: true,
              size: halfPoints + 2,
              font: { name: 'Arial' },
              color: markerColor,
            }),
            ...block.runs.map((run) => buildTextRun(run, fontFamily, muolFont, halfPoints)),
          ],
        })
      );
      continue;
    }

    // 8. Khmer Alphabet List (ក. or (ក))
    if (block.type === 'khmer-bullet') {
      const indentLevel = block.level || 0;
      children.push(
        new Paragraph({
          indent: { left: indentLevel * 360 + 440, hanging: 260 },
          spacing: { before: 60, after: 60, line: 360 },
          children: [
            new TextRun({
              text: `${block.marker} `,
              bold: true,
              size: halfPoints,
              font: { name: muolFont },
              color: '1E3A8A',
            }),
            ...block.runs.map((run) => buildTextRun(run, fontFamily, muolFont, halfPoints)),
          ],
        })
      );
      continue;
    }

    // 9. Numbered List (១. or 1. or (១))
    if (block.type === 'numbered') {
      const indentLevel = block.level || 0;
      children.push(
        new Paragraph({
          indent: { left: indentLevel * 360 + 420, hanging: 260 },
          spacing: { before: 60, after: 60, line: 360 },
          children: [
            new TextRun({
              text: `${block.marker} `,
              bold: true,
              size: halfPoints,
              font: { name: fontFamily },
              color: '2563EB',
            }),
            ...block.runs.map((run) => buildTextRun(run, fontFamily, muolFont, halfPoints)),
          ],
        })
      );
      continue;
    }

    // 10. Bullet List (custom markers or standard disc)
    if (block.type === 'bullet') {
      const indentLevel = block.level || 0;
      let effectiveMarker = block.marker;
      if (bulletPreset === 'standard') effectiveMarker = '•';
      else if (bulletPreset === 'arrow') effectiveMarker = '➢';
      else if (bulletPreset === 'square') effectiveMarker = '▪';
      else if (bulletPreset === 'diamond') effectiveMarker = '◆';

      if (effectiveMarker && effectiveMarker !== '-' && effectiveMarker !== '*') {
        children.push(
          new Paragraph({
            indent: { left: indentLevel * 360 + 400, hanging: 220 },
            spacing: { before: 60, after: 60, line: 360 },
            children: [
              new TextRun({
                text: `${effectiveMarker} `,
                bold: true,
                size: halfPoints,
                font: { name: 'Arial' },
                color: '2563EB',
              }),
              ...block.runs.map((run) => buildTextRun(run, fontFamily, muolFont, halfPoints)),
            ],
          })
        );
      } else {
        children.push(
          new Paragraph({
            bullet: { level: indentLevel },
            spacing: { before: 60, after: 60, line: 360 },
            children: block.runs.map((run) => buildTextRun(run, fontFamily, muolFont, halfPoints)),
          })
        );
      }
      continue;
    }

    // 11. Signature Block (Date, Role, Stamp Space, Name)
    if (block.type === 'signature-layout') {
      const sigTable = buildSignatureTable(block, fontFamily, muolFont, halfPoints);
      children.push(sigTable);
      children.push(new Paragraph({ spacing: { before: 120, after: 80 } }));
      continue;
    }

    // 11b. Document Footer Block (e.g. Teacher info / page number with double border line)
    if (block.type === 'doc-footer') {
      const footerTable = buildDocFooterTable(block, fontFamily, halfPoints);
      children.push(new Paragraph({ spacing: { before: 160, after: 40 } }));
      children.push(footerTable);
      children.push(new Paragraph({ spacing: { before: 40, after: 40 } }));
      continue;
    }

    // 12. Standard Paragraph with Administrative Indentation & Justification
    if (block.type === 'paragraph') {
      let align: any = AlignmentType.LEFT;
      if (block.alignment === 'center') align = AlignmentType.CENTER;
      else if (block.alignment === 'right') align = AlignmentType.RIGHT;
      else if (block.alignment === 'both' || justifyText) align = AlignmentType.BOTH;

      const shouldIndent =
        block.isFirstLineIndent && firstLineIndent && block.alignment !== 'center' && block.alignment !== 'right';
      const isContinuation = block.isBulletContinuation;
      const indentLevel = block.indentLevel || 0;
      const indentConfig = isContinuation
        ? { left: indentLevel * 360 + 400 }
        : shouldIndent
        ? { firstLine: 480 }
        : undefined;

      children.push(
        new Paragraph({
          alignment: align,
          indent: indentConfig,
          spacing: { before: isContinuation ? 40 : 80, after: 80, line: 360 }, // 1.5 line spacing
          children: block.runs.map((run) => buildTextRun(run, fontFamily, muolFont, halfPoints)),
        })
      );
      continue;
    }

    // 13. Table with Custom Borders and Background Color
    if (block.type === 'table') {
      const table = buildDocxTable(
        block,
        fontFamily,
        muolFont,
        halfPoints,
        tableStyle,
        tableBorderColor,
        tableHeaderBg
      );
      children.push(table);
      children.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
      continue;
    }
  }

  // Paper Dimensions and Margins lookup
  const paperDimensions: Record<WordPaperSize, { width: number; height: number }> = {
    A4: { width: 11906, height: 16838 },      // 210mm x 297mm
    Letter: { width: 12240, height: 15840 },  // 8.5in x 11in
    Legal: { width: 12240, height: 20160 },   // 8.5in x 14in
    A3: { width: 16838, height: 23811 },      // 297mm x 420mm
  };

  const marginsDimensions: Record<WordMarginsPreset, { top: number; bottom: number; left: number; right: number }> = {
    'page-setup': { top: 994, bottom: 850, left: 850, right: 850 },       // Top: 0.69", Bottom: 0.59", Left: 0.59", Right: 0.59" (Word Page Setup layout)
    administrative: { top: 1418, bottom: 1418, left: 1701, right: 1134 }, // Left 3.0cm, Right 2.0cm, Top/Bottom 2.5cm
    standard: { top: 1440, bottom: 1440, left: 1440, right: 1440 },       // 1 inch all around
    narrow: { top: 720, bottom: 720, left: 720, right: 720 },             // 0.5 inch all around
    wide: { top: 1440, bottom: 1440, left: 2880, right: 2880 },           // 1 inch top/bottom, 2 inch left/right
  };

  const detectedPaperBlock = blocks.find((b): b is ParsedPaperSetting => b.type === 'paper-setting');
  const effectivePaperSize: WordPaperSize = detectedPaperBlock?.paperSize || options.paperSize || 'A4';
  const effectiveOrientation = detectedPaperBlock?.orientation || options.orientation || orientation || 'portrait';
  const effectiveMarginsPreset: WordMarginsPreset = detectedPaperBlock?.marginsPreset || options.marginsPreset || marginsPreset || 'page-setup';

  const isLandscape = effectiveOrientation === 'landscape';
  const baseDimensions = paperDimensions[effectivePaperSize] || paperDimensions.A4;
  const pageWidth = isLandscape ? baseDimensions.height : baseDimensions.width;
  const pageHeight = isLandscape ? baseDimensions.width : baseDimensions.height;
  
  let pageMargins = marginsDimensions[effectiveMarginsPreset] || marginsDimensions['page-setup'];
  const activeCustomMargins = detectedPaperBlock?.customMargins || options.customMargins;
  if (activeCustomMargins) {
    pageMargins = {
      top: Math.round(activeCustomMargins.top * 1440),
      bottom: Math.round(activeCustomMargins.bottom * 1440),
      left: Math.round(activeCustomMargins.left * 1440),
      right: Math.round(activeCustomMargins.right * 1440),
    };
  }

  const doc = new Document({
    title,
    creator: author,
    styles: {
      default: {
        document: {
          run: {
            font: { name: fontFamily },
            size: halfPoints,
            color: '1E293B',
          },
          paragraph: {
            spacing: { line: 360 }, // 1.5 line spacing
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
              width: pageWidth,
              height: pageHeight,
            },
            margin: pageMargins,
          },
        },
        // Do not add artificial document title as running header, as original document already has its own headers
        headers: undefined,
        footers: includePageNumbers
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'ទំព័រទី ',
                        size: 18,
                        color: '64748B',
                        font: { name: fontFamily },
                      }),
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        size: 18,
                        color: '64748B',
                        font: { name: fontFamily },
                      }),
                      new TextRun({
                        text: ' នៃ ',
                        size: 18,
                        color: '64748B',
                        font: { name: fontFamily },
                      }),
                      new TextRun({
                        children: [PageNumber.TOTAL_PAGES],
                        size: 18,
                        color: '64748B',
                        font: { name: fontFamily },
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        children: children.length > 0 ? children : [new Paragraph('គ្មានទិន្នន័យ')],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export interface ImageDocxItem {
  id?: string;
  name: string;
  dataUrl?: string;
  bytes?: Uint8Array;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ImageDocxOptions extends WordExportOptions {
  imagesPerPage?: 1 | 2 | 'continuous';
  imageAlignment?: 'center' | 'left' | 'right';
  addTitlePage?: boolean;
}

/**
 * Creates a Word (.docx) document containing images with custom page setup (A4/Letter, Margins: Top 0.69", Bottom/Left/Right 0.59")
 */
export async function createWordDocumentFromImages(
  images: ImageDocxItem[],
  options: ImageDocxOptions = {}
): Promise<Blob> {
  const {
    title = 'Image Document',
    author = 'PDF Management Suite',
    fontFamily = 'Kantumruy Pro',
    paperSize = 'A4',
    marginsPreset = 'page-setup',
    customMargins,
    orientation = 'portrait',
    includePageNumbers = true,
    imagesPerPage = 1,
    imageAlignment = 'center',
  } = options;

  const paperDimensions: Record<WordPaperSize, { width: number; height: number }> = {
    A4: { width: 11906, height: 16838 },
    Letter: { width: 12240, height: 15840 },
    Legal: { width: 12240, height: 20160 },
    A3: { width: 16838, height: 23811 },
  };

  const marginsDimensions: Record<WordMarginsPreset, { top: number; bottom: number; left: number; right: number }> = {
    'page-setup': { top: 994, bottom: 850, left: 850, right: 850 }, // Top: 0.69", Bottom: 0.59", Left/Right: 0.59"
    administrative: { top: 1418, bottom: 1418, left: 1701, right: 1134 },
    standard: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
    narrow: { top: 720, bottom: 720, left: 720, right: 720 },
    wide: { top: 1440, bottom: 1440, left: 2880, right: 2880 },
  };

  const isLandscape = orientation === 'landscape';
  const baseDimensions = paperDimensions[paperSize] || paperDimensions.A4;
  const pageWidth = isLandscape ? baseDimensions.height : baseDimensions.width;
  const pageHeight = isLandscape ? baseDimensions.width : baseDimensions.height;

  let pageMargins = marginsDimensions[marginsPreset] || marginsDimensions['page-setup'];
  if (customMargins) {
    pageMargins = {
      top: Math.round(customMargins.top * 1440),
      bottom: Math.round(customMargins.bottom * 1440),
      left: Math.round(customMargins.left * 1440),
      right: Math.round(customMargins.right * 1440),
    };
  }

  // Printable dimensions in points (1 pt = 20 twips)
  const printableWidthPt = Math.floor((pageWidth - pageMargins.left - pageMargins.right) / 20);
  const printableHeightPt = Math.floor((pageHeight - pageMargins.top - pageMargins.bottom) / 20);

  const docChildren: (Paragraph | Table)[] = [];

  let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER;
  if (imageAlignment === 'left') alignment = AlignmentType.LEFT;
  if (imageAlignment === 'right') alignment = AlignmentType.RIGHT;

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const bytes = item.bytes || (item.dataUrl ? decodeBase64ToUint8Array(item.dataUrl) : null);
    if (!bytes || bytes.length === 0) continue;

    const maxW = Math.min(printableWidthPt, 540);
    const maxH = imagesPerPage === 1 
      ? Math.min(printableHeightPt - 70, 720) 
      : Math.min(Math.floor(printableHeightPt / 2) - 40, 340);

    const imgW = item.width || maxW;
    const imgH = item.height || Math.round(imgW * 0.75);

    // Scale to fit maxW and maxH maintaining aspect ratio
    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    const finalW = Math.max(100, Math.round(imgW * scale));
    const finalH = Math.max(100, Math.round(imgH * scale));

    const shouldBreakBefore = i > 0 && (imagesPerPage === 1 || (imagesPerPage === 2 && i % 2 === 0));

    docChildren.push(
      new Paragraph({
        alignment,
        pageBreakBefore: shouldBreakBefore,
        spacing: { before: shouldBreakBefore ? 0 : 120, after: item.caption ? 60 : 180 },
        children: [
          new ImageRun({
            data: bytes,
            transformation: {
              width: finalW,
              height: finalH,
            },
            type: 'png',
          }),
        ],
      })
    );

    if (item.caption) {
      docChildren.push(
        new Paragraph({
          alignment,
          spacing: { before: 0, after: 180 },
          children: [
            new TextRun({
              text: item.caption,
              italics: true,
              size: 20, // 10pt
              color: '475569',
              font: { name: fontFamily },
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    title,
    creator: author,
    styles: {
      default: {
        document: {
          run: {
            font: { name: fontFamily },
            size: 24, // 12pt
            color: '1E293B',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
              width: pageWidth,
              height: pageHeight,
            },
            margin: pageMargins,
          },
        },
        footers: includePageNumbers
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'ទំព័រទី ',
                        size: 18,
                        color: '64748B',
                        font: { name: fontFamily },
                      }),
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        size: 18,
                        color: '64748B',
                        font: { name: fontFamily },
                      }),
                      new TextRun({
                        text: ' នៃ ',
                        size: 18,
                        color: '64748B',
                        font: { name: fontFamily },
                      }),
                      new TextRun({
                        children: [PageNumber.TOTAL_PAGES],
                        size: 18,
                        color: '64748B',
                        font: { name: fontFamily },
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        children: docChildren.length > 0 ? docChildren : [new Paragraph('គ្មានទិន្នន័យរូបភាព')],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Helper to build TextRun with font, color, bold, and half-point sizing
 */
function buildTextRun(
  run: ParsedRun,
  defaultFont: string,
  muolFont: string,
  baseHalfPoints: number
): TextRun {
  const chosenFont = run.muol ? muolFont : defaultFont;
  return new TextRun({
    text: run.text,
    bold: run.bold || run.muol,
    italics: run.italic,
    underline: run.underline ? {} : undefined,
    size: run.size || baseHalfPoints,
    font: { name: chosenFont },
    color: run.color || '1E293B',
    shading: run.bgColor ? { fill: run.bgColor } : undefined,
  });
}

/**
 * Builds a callout box / framed announcement with customizable border style and background color
 */

/**
 * Helper to decode base64 or data URL to Uint8Array
 */
function decodeBase64ToUint8Array(dataUrlOrBase64: string): Uint8Array | null {
  try {
    const base64 = dataUrlOrBase64.includes(',')
      ? dataUrlOrBase64.split(',')[1]
      : dataUrlOrBase64;
    const binaryString = atob(base64.trim());
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.error('Failed to decode image data:', err);
    return null;
  }
}

/**
 * Builds an Image paragraph in docx using ImageRun
 */
function buildImageParagraph(
  block: ParsedImage,
  pageWidthPt: number = 460
): Paragraph | null {
  const bytes = block.bytes || (block.dataUrl ? decodeBase64ToUint8Array(block.dataUrl) : null);
  if (!bytes || bytes.length === 0) return null;

  const maxW = Math.min(block.width || 460, 520);
  const maxH = block.height || Math.round(maxW * 0.7);

  let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER;
  if (block.align === "left") alignment = AlignmentType.LEFT;
  if (block.align === "right") alignment = AlignmentType.RIGHT;

  return new Paragraph({
    alignment,
    spacing: { before: 120, after: block.caption ? 40 : 120 },
    children: [
      new ImageRun({
        data: bytes,
        transformation: {
          width: maxW,
          height: maxH,
        },
        type: "png",
      }),
      ...(block.caption
        ? [
            new TextRun({
              text: block.caption,
              italics: true,
              size: 18, // 9pt
              color: "64748B",
            }),
          ]
        : []),
    ],
  });
}

/**
 * Formats lines inside a shape or box block into docx Paragraphs, preserving
 * line-level alignment, checklists, bullets, numbered lists, and inline styles.
 */
function buildBoxOrShapeContentParagraphs(
  content: string[],
  defaultAlign: (typeof AlignmentType)[keyof typeof AlignmentType],
  fontFamily: string,
  muolFont: string,
  halfPoints: number
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  content.forEach((rawLine) => {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ spacing: { before: 20, after: 20 } }));
      return;
    }

    // Check per-line alignment tags
    let lineAlign = defaultAlign;
    let cleanLine = trimmedLine;
    if (cleanLine.startsWith('[center]') && cleanLine.endsWith('[/center]')) {
      lineAlign = AlignmentType.CENTER;
      cleanLine = cleanLine.slice(8, -9).trim();
    } else if (cleanLine.startsWith('[right]') && cleanLine.endsWith('[/right]')) {
      lineAlign = AlignmentType.RIGHT;
      cleanLine = cleanLine.slice(7, -8).trim();
    } else if (cleanLine.startsWith('[left]') && cleanLine.endsWith('[/left]')) {
      lineAlign = AlignmentType.LEFT;
      cleanLine = cleanLine.slice(6, -7).trim();
    }

    // 1. Checklist item: - [ ] or - [x] or ☑
    const checkMatch = cleanLine.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      const isChecked = checkMatch[1].toLowerCase() === 'x';
      const runs = parseInlineRuns(checkMatch[2]);
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 360, hanging: 240 },
          spacing: { before: 30, after: 30, line: 300 },
          children: [
            new TextRun({
              text: isChecked ? '☑ ' : '☐ ',
              bold: true,
              color: isChecked ? '16A34A' : '64748B',
              font: { name: 'Arial' },
              size: halfPoints,
            }),
            ...runs.map((r) => buildTextRun(r, fontFamily, muolFont, halfPoints)),
          ],
        })
      );
      return;
    }

    // 2. Khmer Alphabet list item: ក. or (ក)
    const khmerAlphaMatch = cleanLine.match(/^([ក-អ][\.\)]|\([ក-អ]\))\s+(.*)$/);
    if (khmerAlphaMatch) {
      const runs = parseInlineRuns(khmerAlphaMatch[2]);
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 380, hanging: 260 },
          spacing: { before: 30, after: 30, line: 300 },
          children: [
            new TextRun({
              text: `${khmerAlphaMatch[1]} `,
              bold: true,
              color: '1E3A8A',
              font: { name: muolFont },
              size: halfPoints,
            }),
            ...runs.map((r) => buildTextRun(r, fontFamily, muolFont, halfPoints)),
          ],
        })
      );
      return;
    }

    // 3. Numbered list item: 1. or 01. or ០១.
    const numMatch = cleanLine.match(/^([០-៩\d]+[\.\)]|\([០-៩\d]+\))\s+(.*)$/);
    if (numMatch) {
      const runs = parseInlineRuns(numMatch[2]);
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 360, hanging: 240 },
          spacing: { before: 30, after: 30, line: 300 },
          children: [
            new TextRun({
              text: `${numMatch[1]} `,
              bold: true,
              color: '2563EB',
              font: { name: fontFamily },
              size: halfPoints,
            }),
            ...runs.map((r) => buildTextRun(r, fontFamily, muolFont, halfPoints)),
          ],
        })
      );
      return;
    }

    // 4. Custom bullet markers: •, ➢, ▪, ◆, ❖, -, *, etc.
    const bulletMatch = cleanLine.match(/^([•◦∙⁃➢➔➤➜►▶▪▫■□◆◇❖※✽✦✓✔\*\-–—\+])\s+(.*)$/);
    if (bulletMatch) {
      const marker = bulletMatch[1];
      const runs = parseInlineRuns(bulletMatch[2]);
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 340, hanging: 200 },
          spacing: { before: 30, after: 30, line: 300 },
          children: [
            new TextRun({
              text: `${marker} `,
              bold: true,
              color: '2563EB',
              font: { name: 'Arial' },
              size: halfPoints,
            }),
            ...runs.map((r) => buildTextRun(r, fontFamily, muolFont, halfPoints)),
          ],
        })
      );
      return;
    }

    // 5. Standard line with parsed inline runs (**bold**, *italic*, [color], etc.)
    const runs = parseInlineRuns(cleanLine);
    paragraphs.push(
      new Paragraph({
        alignment: lineAlign,
        spacing: { before: 30, after: 30, line: 300 },
        children: runs.map((r) => buildTextRun(r, fontFamily, muolFont, halfPoints)),
      })
    );
  });

  return paragraphs;
}

function buildShapeBlock(
  block: ParsedShape,
  fontFamily: string,
  muolFont: string,
  halfPoints: number
): Table {
  const borderColor = block.borderColor || "1D4ED8";
  const bgColor = block.bgColor || "EFF6FF";
  const textColor = block.textColor || "1E3A8A";
  const style = block.borderStyle || "double";

  const noneBorder: any = { style: BorderStyle.NONE, size: 0, color: "auto" };
  let bStyle: (typeof BorderStyle)[keyof typeof BorderStyle] = BorderStyle.DOUBLE;
  let bSize = 12;

  if (style === "single") {
    bStyle = BorderStyle.SINGLE;
    bSize = block.shapeType === "seal-box" ? 16 : 8;
  } else if (style === "dashed") {
    bStyle = BorderStyle.DASHED;
    bSize = 8;
  } else if (style === "dotted") {
    bStyle = BorderStyle.DOTTED;
    bSize = 8;
  }

  const borderObj: any = { style: bStyle, size: bSize, color: borderColor };

  let borderDef: any = {
    left: borderObj,
    top: borderObj,
    bottom: borderObj,
    right: borderObj,
    insideHorizontal: noneBorder,
    insideVertical: noneBorder,
  };

  if (block.shapeType === "ribbon") {
    borderDef = {
      left: noneBorder,
      right: noneBorder,
      top: { style: BorderStyle.DOUBLE, size: 12, color: borderColor },
      bottom: { style: BorderStyle.DOUBLE, size: 12, color: borderColor },
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  } else if (block.shapeType === "header-accent") {
    borderDef = {
      left: { style: BorderStyle.SINGLE, size: 28, color: borderColor },
      right: noneBorder,
      top: noneBorder,
      bottom: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  } else if (block.shapeType === "divider-shape") {
    borderDef = {
      left: noneBorder,
      right: noneBorder,
      top: noneBorder,
      bottom: { style: BorderStyle.DOUBLE, size: 14, color: borderColor },
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  }

  const paragraphs: Paragraph[] = [];

  let align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
  if (block.align === "center") align = AlignmentType.CENTER;
  if (block.align === "right") align = AlignmentType.RIGHT;

  if (block.title) {
    paragraphs.push(
      new Paragraph({
        alignment: align,
        spacing: { before: 40, after: block.subtitle ? 20 : 60 },
        children: [
          new TextRun({
            text: (block.icon ? block.icon + " " : "") + block.title,
            bold: true,
            size: halfPoints + 4,
            font: { name: muolFont },
            color: textColor,
          }),
        ],
      })
    );
  }

  if (block.subtitle) {
    paragraphs.push(
      new Paragraph({
        alignment: align,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({
            text: block.subtitle,
            italics: true,
            size: halfPoints - 1,
            font: { name: fontFamily },
            color: textColor,
          }),
        ],
      })
    );
  }

  if (block.content && block.content.length > 0) {
    paragraphs.push(
      ...buildBoxOrShapeContentParagraphs(block.content, align, fontFamily, muolFont, halfPoints)
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderDef,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: borderDef,
            shading: { fill: bgColor },
            margins: {
              top: block.shapeType === "ribbon" ? 120 : 180,
              bottom: block.shapeType === "ribbon" ? 120 : 180,
              left: 240,
              right: 240,
            },
            children: paragraphs.length > 0 ? paragraphs : [new Paragraph("")],
          }),
        ],
      }),
    ],
  });
}

function buildBoxTable(
  block: ParsedBox,
  fontFamily: string,
  muolFont: string,
  halfPoints: number
): Table {
  const borderColor = block.borderColor || '2563EB';
  const bgColor = block.bgColor || 'EFF6FF';
  const style = block.borderStyle || 'accent-left';
  const noneBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };

  let borderDef;
  if (style === 'accent-left') {
    borderDef = {
      left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
      top: noneBorder,
      bottom: noneBorder,
      right: noneBorder,
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  } else if (style === 'double') {
    const dBorder = { style: BorderStyle.DOUBLE, size: 12, color: borderColor };
    borderDef = {
      left: dBorder,
      top: dBorder,
      bottom: dBorder,
      right: dBorder,
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  } else if (style === 'dashed') {
    const dsBorder = { style: BorderStyle.DASHED, size: 6, color: borderColor };
    borderDef = {
      left: dsBorder,
      top: dsBorder,
      bottom: dsBorder,
      right: dsBorder,
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  } else if (style === 'dotted') {
    const dtBorder = { style: BorderStyle.DOTTED, size: 6, color: borderColor };
    borderDef = {
      left: dtBorder,
      top: dtBorder,
      bottom: dtBorder,
      right: dtBorder,
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  } else if (style === 'none') {
    borderDef = {
      left: noneBorder,
      top: noneBorder,
      bottom: noneBorder,
      right: noneBorder,
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  } else {
    const sBorder = { style: BorderStyle.SINGLE, size: 6, color: borderColor };
    borderDef = {
      left: sBorder,
      top: sBorder,
      bottom: sBorder,
      right: sBorder,
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  }

  const paragraphs: Paragraph[] = [];
  let boxAlign: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
  if (block.align === 'center') boxAlign = AlignmentType.CENTER;
  if (block.align === 'right') boxAlign = AlignmentType.RIGHT;

  if (block.title) {
    paragraphs.push(
      new Paragraph({
        alignment: boxAlign,
        spacing: { before: 20, after: 60 },
        children: [
          new TextRun({
            text: block.title,
            bold: true,
            size: halfPoints + 2,
            font: { name: muolFont },
            color: '0F172A',
          }),
        ],
      })
    );
  }

  if (block.content && block.content.length > 0) {
    paragraphs.push(
      ...buildBoxOrShapeContentParagraphs(block.content, boxAlign, fontFamily, muolFont, halfPoints)
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderDef,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: borderDef.top,
              bottom: borderDef.bottom,
              left: borderDef.left,
              right: borderDef.right,
            },
            shading: { fill: bgColor },
            margins: { top: 160, bottom: 160, left: 240, right: 240 },
            children: paragraphs.length > 0 ? paragraphs : [new Paragraph('')],
          }),
        ],
      }),
    ],
  });
}

/**
 * Builds a 2-column header table for official Cambodian administrative letters
 * with optional background shading and bottom border line
 */
function buildAdministrativeHeaderTable(
  block: ParsedHeaderLayout,
  fontFamily: string,
  muolFont: string,
  halfPoints: number,
  headerBannerStyle: WordHeaderBannerStyle = 'none',
  customHeaderBg?: string
): Table {
  const noneBorder: { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string } = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'auto',
  };

  let bottomBorder: { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string } = noneBorder;
  if (block.borderBottom === 'double' || headerBannerStyle === 'bordered-double') {
    bottomBorder = { style: BorderStyle.DOUBLE, size: 12, color: '2563EB' };
  } else if (block.borderBottom === 'single' || headerBannerStyle === 'bordered-single') {
    bottomBorder = { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' };
  } else if (block.borderBottom === 'dashed') {
    bottomBorder = { style: BorderStyle.DASHED, size: 6, color: 'CBD5E1' };
  }

  const borders = {
    top: noneBorder,
    bottom: bottomBorder,
    left: noneBorder,
    right: noneBorder,
    insideHorizontal: noneBorder,
    insideVertical: noneBorder,
  };

  const effectiveBgColor =
    block.bgColor ||
    customHeaderBg ||
    (headerBannerStyle === 'tinted' ? 'F8FAFC' : undefined);

  // Left column paragraphs
  const leftChildren = block.leftLines.map((line, idx) => {
    const isFirst = idx === 0;
    return new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 20, after: 20, line: 320 },
      children: [
        new TextRun({
          text: line,
          bold: isFirst,
          size: isFirst ? halfPoints + 2 : halfPoints,
          font: { name: isFirst ? muolFont : fontFamily },
          color: '0F172A',
        }),
      ],
    });
  });

  // Right column paragraphs
  const rightChildren: Paragraph[] = [];
  block.rightLines.forEach((line) => {
    const isMotto = line.includes('ព្រះរាជាណាចក្រកម្ពុជា') || line.includes('ជាតិ  សាសនា  ព្រះមហាក្សត្រ');
    const isDate = line.includes('ថ្ងៃទី') || line.includes('រាជធានីភ្នំពេញ');

    rightChildren.push(
      new Paragraph({
        alignment: isMotto ? AlignmentType.CENTER : isDate ? AlignmentType.CENTER : AlignmentType.RIGHT,
        spacing: { before: 20, after: 20, line: 320 },
        children: [
          new TextRun({
            text: line.replace(/\[\/?muol\]/g, ''),
            bold: isMotto,
            size: isMotto ? halfPoints + 4 : halfPoints,
            font: { name: isMotto ? muolFont : fontFamily },
            color: '0F172A',
          }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders,
            shading: effectiveBgColor ? { fill: effectiveBgColor } : undefined,
            margins: effectiveBgColor ? { top: 120, bottom: 120, left: 140, right: 140 } : undefined,
            children: leftChildren.length > 0 ? leftChildren : [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders,
            shading: effectiveBgColor ? { fill: effectiveBgColor } : undefined,
            margins: effectiveBgColor ? { top: 120, bottom: 120, left: 140, right: 140 } : undefined,
            children: rightChildren.length > 0 ? rightChildren : [new Paragraph('')],
          }),
        ],
      }),
    ],
  });
}

/**
 * Builds a borderless signature table (supports 1, 2, or 3 columns matching original layout)
 */
function buildSignatureTable(
  block: ParsedSignatureBlock,
  fontFamily: string,
  muolFont: string,
  halfPoints: number
): Table {
  const noneBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const borders = {
    top: noneBorder,
    bottom: noneBorder,
    left: noneBorder,
    right: noneBorder,
    insideHorizontal: noneBorder,
    insideVertical: noneBorder,
  };

  // Multi-column signature layout (e.g. 3 columns: Left Approval, Center Verification, Right Author)
  if (block.columns && block.columns.length > 0) {
    const colCount = block.columns.length;
    const colWidth = Math.floor(100 / colCount);

    const cells: TableCell[] = block.columns.map((col) => {
      const children: Paragraph[] = [];

      // 1. Date lines (if present)
      if (col.date) {
        const dLines = col.date.split('\n');
        dLines.forEach((dl) => {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 20, after: 20, line: 280 },
              children: [
                new TextRun({
                  text: dl.trim(),
                  italics: true,
                  size: halfPoints - 2,
                  font: { name: fontFamily },
                  color: '334155',
                }),
              ],
            })
          );
        });
      }

      // 2. Title / Approval header (e.g. បានឃើញ និងឯកភាព, ពិនិត្យ និងផ្ទៀងផ្ទាត់)
      if (col.title) {
        const cleanTitle = col.title.replace(/^\*\*|\*\*$/g, '').replace(/\[\/?(?:muol|bold)\]/g, '').trim();
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 30, line: 300 },
            children: [
              new TextRun({
                text: cleanTitle,
                bold: true,
                size: halfPoints + 1,
                font: { name: muolFont || fontFamily },
                color: '0F172A',
              }),
            ],
          })
        );
      }

      // 3. Role / Position (e.g. នាយកសាលា, ប្រធានក្រុមបច្ចេកទេស, បង្រៀនដោយ)
      if (col.role) {
        const rLines = col.role.split('\n');
        rLines.forEach((rl) => {
          const cleanRole = rl.replace(/\[\/?(?:muol|bold)\]/g, '').trim();
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 20, after: 30, line: 300 },
              children: [
                new TextRun({
                  text: cleanRole,
                  bold: true,
                  size: halfPoints,
                  font: { name: muolFont || fontFamily },
                  color: '0F172A',
                }),
              ],
            })
          );
        });
      }

      // 4. Authentic Clean Space for handwritten signature and official stamp
      // No artificial text or dashed border! Clean space matching original document.
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 450, after: 450 }, // ~60pt clearance
          children: [
            new TextRun({
              text: '',
            }),
          ],
        })
      );

      // 5. Signer's Name at bottom (e.g. នាក់ យឿន, ឡោម មនីវង្ស)
      if (col.name) {
        const cleanName = col.name.replace(/\[\/?name\]/g, '').replace(/^\*\*|\*\*$/g, '').trim();
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 30, after: 40, line: 300 },
            children: [
              new TextRun({
                text: cleanName,
                bold: true,
                size: halfPoints + 2,
                font: { name: muolFont || fontFamily },
                color: '0F172A',
              }),
            ],
          })
        );
      }

      return new TableCell({
        width: { size: colWidth, type: WidthType.PERCENTAGE },
        borders,
        children: children.length > 0 ? children : [new Paragraph('')],
      });
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders,
      rows: [
        new TableRow({
          children: cells,
        }),
      ],
    });
  }

  // Left cell (CC / Distribution)
  const leftChildren: Paragraph[] = [];
  if (block.ccList && block.ccList.length > 0) {
    leftChildren.push(
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: 'កន្លែងទទួល៖',
            bold: true,
            size: halfPoints - 2,
            font: { name: fontFamily },
            underline: {},
          }),
        ],
      })
    );
    block.ccList.forEach((cc) => {
      leftChildren.push(
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({
              text: `- ${cc}`,
              size: halfPoints - 4,
              font: { name: fontFamily },
              color: '475569',
            }),
          ],
        })
      );
    });
  }

  // Right cell (Signature block)
  const rightChildren: Paragraph[] = [];

  if (block.date) {
    rightChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 60 },
        children: [
          new TextRun({
            text: block.date,
            italics: true,
            size: halfPoints,
            font: { name: fontFamily },
            color: '1E293B',
          }),
        ],
      })
    );
  }

  if (block.role) {
    rightChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: block.role,
            bold: true,
            size: halfPoints + 2,
            font: { name: muolFont },
            color: '0F172A',
          }),
        ],
      })
    );
  }

  // Clean clearance for signature
  rightChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 450, after: 450 },
      children: [
        new TextRun({
          text: '',
        }),
      ],
    })
  );

  if (block.name) {
    rightChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: block.name,
            bold: true,
            size: halfPoints + 2,
            font: { name: fontFamily },
            color: '0F172A',
          }),
        ],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders,
            children: leftChildren.length > 0 ? leftChildren : [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders,
            children: rightChildren.length > 0 ? rightChildren : [new Paragraph('')],
          }),
        ],
      }),
    ],
  });
}

/**
 * Builds a 2-column footer table with a top double border
 * (Left: teacher/computerized info; Right: Page number)
 */
function buildDocFooterTable(
  block: ParsedDocFooter,
  fontFamily: string,
  halfPoints: number
): Table {
  const noneBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const doubleTopBorder = { style: BorderStyle.DOUBLE, size: 12, color: '334155' };
  const borders = {
    top: doubleTopBorder,
    bottom: noneBorder,
    left: noneBorder,
    right: noneBorder,
    insideHorizontal: noneBorder,
    insideVertical: noneBorder,
  };

  const leftChildren: Paragraph[] = [];
  block.leftLines.forEach((line, idx) => {
    leftChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 20, after: 20, line: 260 },
        children: [
          new TextRun({
            text: line,
            bold: idx === 0,
            size: halfPoints - 4,
            font: { name: fontFamily },
            color: idx === 0 ? '0F172A' : '475569',
          }),
        ],
      })
    );
  });

  const rightChildren: Paragraph[] = [];
  block.rightLines.forEach((line) => {
    rightChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 20, after: 20, line: 260 },
        children: [
          new TextRun({
            text: line,
            bold: true,
            size: halfPoints - 4,
            font: { name: fontFamily },
            color: '0F172A',
          }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders,
            children: leftChildren.length > 0 ? leftChildren : [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders,
            children: rightChildren.length > 0 ? rightChildren : [new Paragraph('')],
          }),
        ],
      }),
    ],
  });
}

/**
 * Builds rich paragraphs for a table cell, preserving multi-line breaks (<br>),
 * bullet lists (•, ➢, numbers), shapes/boxes ([box], [badge]), images,
 * and inline text formatting (bold, italic, muol, color).
 */
function buildTableCellParagraphs(
  rawCellText: string,
  alignType: (typeof AlignmentType)[keyof typeof AlignmentType],
  fontFamily: string,
  muolFont: string,
  halfPoints: number
): Paragraph[] {
  // Normalize line breaks: <br>, <br/>, <br />, or actual newlines
  const rawLines = rawCellText
    .split(/(?:<br\s*\/?>|\r?\n)/gi)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    return [
      new Paragraph({
        alignment: alignType,
        spacing: { before: 20, after: 20, line: 260 },
        children: [new TextRun('')],
      }),
    ];
  }

  const paragraphs: Paragraph[] = [];

  for (const line of rawLines) {
    // 1. Check for bullet item: •, ➢, ▪, ◆, ❖, -, *, +, or numbers 1., 01., ០១., ក., (ក)
    const bulletMatch = line.match(/^([•➢➔➤➜►▶▪▫■□◆◇❖※✽✦✓✔\*\-–—\+]|(?:\d+|[០-៩]+|[ក-អ])[\.\)]|\([ក-អ]\))\s*(.*)$/);
    if (bulletMatch) {
      const marker = bulletMatch[1];
      const content = bulletMatch[2];
      const isSymbolBullet = /[•➢➔➤➜►▶▪▫■□◆◇❖※✽✦✓✔\*\-–—\+]/.test(marker);

      const markerRun = new TextRun({
        text: `${marker} `,
        bold: true,
        size: halfPoints - 2,
        font: { name: isSymbolBullet ? 'Arial' : fontFamily },
        color: '2563EB',
      });

      const runs = parseInlineRuns(content).map((r) =>
        buildTextRun(r, fontFamily, muolFont, halfPoints - 2)
      );

      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 240, hanging: 240 },
          spacing: { before: 20, after: 20, line: 260 },
          children: [markerRun, ...(runs.length > 0 ? runs : [new TextRun('')])],
        })
      );
      continue;
    }

    // 2. Check for embedded shapes/badges: [box]...[/box], [badge]...[/badge], [shape]...[/shape]
    const boxMatch = line.match(/^\[(?:box|badge|shape)\](.*?)\[\/(?:box|badge|shape)\]$/i);
    if (boxMatch) {
      const runs = parseInlineRuns(boxMatch[1]).map((r) =>
        buildTextRun(r, fontFamily, muolFont, halfPoints - 2)
      );
      paragraphs.push(
        new Paragraph({
          alignment: alignType,
          spacing: { before: 30, after: 30, line: 260 },
          shading: { fill: 'EFF6FF' },
          children: runs.length > 0 ? runs : [new TextRun('')],
        })
      );
      continue;
    }

    // 3. Check for images inside cell: ![alt](url) or [image:...] or [រូបភាព:...]
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)|\[(?:image|រូបភាព)(?::(.*?))?\]/i);
    if (imgMatch) {
      const altOrTitle = imgMatch[1] || imgMatch[3] || 'រូបភាព';
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 30, after: 30, line: 260 },
          children: [
            new TextRun({
              text: `🖼️ [${altOrTitle}]`,
              bold: true,
              size: halfPoints - 2,
              font: { name: fontFamily },
              color: '2563EB',
              italics: true,
            }),
          ],
        })
      );
      continue;
    }

    // 4. Standard text line with inline formatting
    const runs = parseInlineRuns(line).map((r) =>
      buildTextRun(r, fontFamily, muolFont, halfPoints - 2)
    );

    paragraphs.push(
      new Paragraph({
        alignment: alignType,
        spacing: { before: 20, after: 20, line: 260 },
        children: runs.length > 0 ? runs : [new TextRun('')],
      })
    );
  }

  return paragraphs;
}

/**
 * Builds a docx Table instance with customizable border styles (single, double, dashed, dotted, thick, minimal, borderless)
 * and background color shading for header and rows.
 * Uses cantSplit: true to ensure rows do not break cleanly across page boundaries,
 * and tableHeader: true so header row repeats across pages in Microsoft Word.
 */
function buildDocxTable(
  parsed: ParsedTable,
  fontFamily: string,
  muolFont: string,
  halfPoints: number,
  tableStyle: WordTableStyle = 'bordered',
  borderColorPreset: WordTableBorderColor = 'slate',
  headerBgPreset: WordTableBgColor = 'slate-soft'
): Table {
  const colCount = Math.max(parsed.headers.length, 1);

  // Compute smart column width percentages
  const colWidthPcts: number[] = [];
  let remainingPct = 100;
  for (let c = 0; c < colCount; c++) {
    const headerName = parsed.headers[c] || '';
    if (/^(?:ល\.?រ|no\.?|id)$/i.test(headerName.trim())) {
      colWidthPcts.push(10);
      remainingPct -= 10;
    } else if (/^(?:ស្ថានភាព|កាលបរិច្ឆេទ|status|date)$/i.test(headerName.trim())) {
      colWidthPcts.push(18);
      remainingPct -= 18;
    } else {
      colWidthPcts.push(0); // Will calculate remaining
    }
  }
  const unassignedCount = colWidthPcts.filter((w) => w === 0).length;
  const sharedWidth = unassignedCount > 0 ? Math.floor(remainingPct / unassignedCount) : Math.floor(100 / colCount);
  for (let c = 0; c < colCount; c++) {
    if (colWidthPcts[c] === 0) colWidthPcts[c] = sharedWidth;
  }

  // Border Color Hex
  const colorMap: Record<WordTableBorderColor, string> = {
    slate: 'CBD5E1',
    blue: '2563EB',
    amber: 'D97706',
    emerald: '16A34A',
    crimson: 'DC2626',
    dark: '1E293B',
  };
  const borderColorHex = parsed.borderColor || colorMap[borderColorPreset] || 'CBD5E1';

  // Header Background Hex
  const headerBgMap: Record<WordTableBgColor, string> = {
    'slate-soft': 'F1F5F9',
    'blue-soft': 'EFF6FF',
    'amber-soft': 'FEF3C7',
    'emerald-soft': 'ECFDF5',
    'navy-royal': '1E293B',
    white: 'FFFFFF',
  };
  const headerBgHex = parsed.headerBgColor || headerBgMap[headerBgPreset] || 'F1F5F9';
  const headerTextColor = headerBgHex === '1E293B' ? 'FFFFFF' : '0F172A';

  // Configure borders according to selected style
  const thinBorder = { style: BorderStyle.SINGLE, size: 2, color: borderColorHex };
  const doubleBorder = { style: BorderStyle.DOUBLE, size: 12, color: borderColorHex };
  const dashedBorder = { style: BorderStyle.DASHED, size: 6, color: borderColorHex };
  const dottedBorder = { style: BorderStyle.DOTTED, size: 6, color: borderColorHex };
  const thickBorder = { style: BorderStyle.THICK, size: 16, color: borderColorHex };
  const noneBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };

  const effectiveStyle = parsed.borderStyle || tableStyle;
  let bordersConfig;

  if (effectiveStyle === 'double') {
    bordersConfig = {
      top: doubleBorder,
      bottom: doubleBorder,
      left: doubleBorder,
      right: doubleBorder,
      insideHorizontal: thinBorder,
      insideVertical: thinBorder,
    };
  } else if (effectiveStyle === 'dashed') {
    bordersConfig = {
      top: dashedBorder,
      bottom: dashedBorder,
      left: dashedBorder,
      right: dashedBorder,
      insideHorizontal: dashedBorder,
      insideVertical: dashedBorder,
    };
  } else if (effectiveStyle === 'dotted') {
    bordersConfig = {
      top: dottedBorder,
      bottom: dottedBorder,
      left: dottedBorder,
      right: dottedBorder,
      insideHorizontal: dottedBorder,
      insideVertical: dottedBorder,
    };
  } else if (effectiveStyle === 'thick') {
    bordersConfig = {
      top: thickBorder,
      bottom: thickBorder,
      left: thickBorder,
      right: thickBorder,
      insideHorizontal: thinBorder,
      insideVertical: thinBorder,
    };
  } else if (effectiveStyle === 'minimal') {
    bordersConfig = {
      top: { style: BorderStyle.SINGLE, size: 6, color: borderColorHex },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: borderColorHex },
      left: noneBorder,
      right: noneBorder,
      insideHorizontal: thinBorder,
      insideVertical: noneBorder,
    };
  } else if (effectiveStyle === 'borderless') {
    bordersConfig = {
      top: noneBorder,
      bottom: noneBorder,
      left: noneBorder,
      right: noneBorder,
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    };
  } else if (effectiveStyle === 'striped') {
    bordersConfig = {
      top: thinBorder,
      bottom: thinBorder,
      left: noneBorder,
      right: noneBorder,
      insideHorizontal: thinBorder,
      insideVertical: noneBorder,
    };
  } else {
    // Default 'bordered'
    bordersConfig = {
      top: thinBorder,
      bottom: thinBorder,
      left: thinBorder,
      right: thinBorder,
      insideHorizontal: thinBorder,
      insideVertical: thinBorder,
    };
  }

  const tableRows: TableRow[] = [];

  // Header Row - repeats across page breaks with tableHeader: true, and stays together with cantSplit: true
  const headerCells = parsed.headers.map((h, i) => {
    const align = parsed.alignments[i] || 'left';
    const alignType =
      align === 'center'
        ? AlignmentType.CENTER
        : align === 'right'
        ? AlignmentType.RIGHT
        : AlignmentType.LEFT;

    return new TableCell({
      width: { size: colWidthPcts[i] || 25, type: WidthType.PERCENTAGE },
      shading: { fill: headerBgHex },
      margins: { top: 140, bottom: 140, left: 160, right: 160 },
      children: [
        new Paragraph({
          alignment: alignType,
          spacing: { line: 280 },
          children: [
            new TextRun({
              text: h,
              bold: true,
              size: halfPoints,
              font: { name: fontFamily },
              color: headerTextColor,
            }),
          ],
        }),
      ],
    });
  });

  tableRows.push(
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: headerCells,
    })
  );

  // Data Rows - rendered with rich multi-line paragraphs (bullets, shapes, images) and cantSplit: true
  parsed.rows.forEach((row, rowIdx) => {
    const isZebra = effectiveStyle === 'striped' && rowIdx % 2 === 1;

    const dataCells = row.map((rawCellText, colIdx) => {
      const align = parsed.alignments[colIdx] || 'left';
      const alignType =
        align === 'center'
          ? AlignmentType.CENTER
          : align === 'right'
          ? AlignmentType.RIGHT
          : AlignmentType.LEFT;

      // Check cell-level background tag: [bg:#HEX]...[/bg]
      const bgMatch = rawCellText.match(/\[bg:([#a-zA-Z0-9]+)\](.*?)\[\/bg\]/i);
      let cellBg: string | undefined = undefined;
      let cellText = rawCellText;

      if (bgMatch) {
        cellBg = bgMatch[1].replace(/^#/, '').toUpperCase();
        cellText = rawCellText.replace(/\[bg:[#a-zA-Z0-9]+\]/gi, '').replace(/\[\/bg\]/gi, '');
      } else if (isZebra) {
        cellBg = 'F8FAFC';
      }

      const cellParagraphs = buildTableCellParagraphs(
        cellText,
        alignType,
        fontFamily,
        muolFont,
        halfPoints
      );

      return new TableCell({
        width: { size: colWidthPcts[colIdx] || 25, type: WidthType.PERCENTAGE },
        shading: cellBg ? { fill: cellBg } : undefined,
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: cellParagraphs,
      });
    });

    tableRows.push(
      new TableRow({
        cantSplit: true,
        children: dataCells,
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: bordersConfig,
    rows: tableRows,
  });
}
