import * as XLSX from 'xlsx';

export interface ExcelTable {
  title?: string;
  headers: string[];
  rows: string[][];
  alignments?: ('left' | 'center' | 'right')[];
}

export interface ExcelExportOptions {
  fileName?: string;
  title?: string;
  sheetMode?: 'auto' | 'tables-only' | 'structured-all' | 'split-tables';
  includeDocumentInfo?: boolean;
}

/**
 * Excel has a strict architectural limit: maximum 32,767 characters per cell.
 * Exceeding this causes `Error: Text length must not exceed 32767 characters`.
 * We keep our safety threshold strictly at 32,000 to leave safety headroom.
 */
export const MAX_EXCEL_CELL_CHARS = 32000;

/**
 * Ensures any string inserted into an Excel cell never exceeds 32,000 characters.
 */
export function safeTruncate(text: string, maxLen: number = MAX_EXCEL_CELL_CHARS): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen);
}

/**
 * Splits large paragraphs or unbroken text blocks into multiple safe chunks
 * to avoid losing content while respecting Excel's 32,767 character-per-cell limit.
 */
export function splitIntoSafeChunks(text: string, maxLen: number = 30000): string[] {
  if (!text) return [];
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Attempt to break gracefully on newline, space, or Khmer khan punctuation (។)
    let breakPoint = remaining.lastIndexOf('\n', maxLen);
    if (breakPoint === -1 || breakPoint < maxLen * 0.6) {
      breakPoint = remaining.lastIndexOf('។', maxLen);
    }
    if (breakPoint === -1 || breakPoint < maxLen * 0.6) {
      breakPoint = remaining.lastIndexOf(' ', maxLen);
    }
    if (breakPoint === -1 || breakPoint < maxLen * 0.4) {
      breakPoint = maxLen;
    } else {
      breakPoint += 1; // Include delimiter
    }

    const chunk = remaining.slice(0, breakPoint).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    remaining = remaining.slice(breakPoint).trim();
  }

  return chunks.length > 0 ? chunks : [safeTruncate(text, maxLen)];
}

/**
 * Strips markdown tags and formatting, returning clean plain text suitable for Excel cells
 */
export function cleanMarkdownCell(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();

  // Replace <br> and <br/> with newline
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip muol tags
  text = text.replace(/\[\/?muol\]/gi, '');

  // Strip alignment tags
  text = text.replace(/\[\/?(?:left|center|right|justify)\]/gi, '');

  // Strip seal tags
  text = text.replace(/\[seal\](.*?)\[\/seal\]/gi, '$1 (ត្រា)');

  // Strip bold and italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');

  // Strip code ticks
  text = text.replace(/`([^`]+)`/g, '$1');

  // Clean remaining shape directives
  text = text.replace(/:::shape[^:]*:::/gi, '');
  text = text.replace(/:::[a-zA-Z0-9_-]*/gi, '');
  text = text.replace(/:::/g, '');

  return safeTruncate(text.trim());
}

/**
 * Sanitizes all rows and cells in a 2D sheet array to guarantee that NO cell
 * ever exceeds the Excel 32,767 character limit.
 */
export function sanitizeSheetData(sheetData: (string | number)[][]): (string | number)[][] {
  return sheetData.map((row) =>
    row.map((cell) => {
      if (typeof cell === 'string') {
        if (cell.length > MAX_EXCEL_CELL_CHARS) {
          return cell.slice(0, MAX_EXCEL_CELL_CHARS);
        }
        return cell;
      }
      return cell;
    })
  );
}

/**
 * Parses markdown tables from a block of text
 */
export function extractMarkdownTables(text: string): ExcelTable[] {
  if (!text) return [];
  const lines = text.split('\n');
  const tables: ExcelTable[] = [];

  let i = 0;
  let recentHeading = '';

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Track headings as potential table titles
    if (trimmed.startsWith('#')) {
      recentHeading = cleanMarkdownCell(trimmed.replace(/^#+\s*/, ''));
    }

    // Detect markdown table start
    if (trimmed.startsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = [];
      const tableTitle = recentHeading;

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
          !curTrim.startsWith('===')
        ) {
          // Continuation line of multi-line cell
          const lastIdx = tableLines.length - 1;
          const combined = tableLines[lastIdx] + '<br>' + curTrim;
          // Guard against infinite cell expansion
          tableLines[lastIdx] = safeTruncate(combined, MAX_EXCEL_CELL_CHARS);
          i++;
        } else {
          break;
        }
      }

      const parsed = parseSingleMarkdownTable(tableLines, tableTitle);
      if (parsed && (parsed.headers.length > 0 || parsed.rows.length > 0)) {
        tables.push(parsed);
      }
      recentHeading = '';
      continue;
    }

    // Detect Tab-separated pseudo-tables
    if (trimmed.includes('\t') && !trimmed.startsWith('#')) {
      const tsvLines: string[] = [];
      const tableTitle = recentHeading;
      while (i < lines.length && lines[i].includes('\t')) {
        tsvLines.push(lines[i]);
        i++;
      }
      if (tsvLines.length >= 2) {
        const rows = tsvLines.map((l) => l.split('\t').map((c) => cleanMarkdownCell(c)));
        tables.push({
          title: tableTitle ? safeTruncate(tableTitle, 200) : undefined,
          headers: rows[0],
          rows: rows.slice(1),
        });
      }
      recentHeading = '';
      continue;
    }

    i++;
  }

  return tables;
}

/**
 * Parses markdown table rows into headers and rows
 */
function parseSingleMarkdownTable(tableLines: string[], title?: string): ExcelTable | null {
  if (tableLines.length === 0) return null;

  // Split lines into cells
  const parsedRows: string[][] = [];
  let separatorIndex = -1;

  for (let idx = 0; idx < tableLines.length; idx++) {
    const line = tableLines[idx];
    const rawCells = line.split('|');
    // Remove first and last empty elements caused by leading/trailing pipes
    if (rawCells.length > 0 && rawCells[0].trim() === '') rawCells.shift();
    if (rawCells.length > 0 && rawCells[rawCells.length - 1].trim() === '') rawCells.pop();

    const isSep = rawCells.every((c) => /^[\s:-]+$/.test(c.trim()));
    if (isSep) {
      separatorIndex = idx;
      continue;
    }

    const cleanCells = rawCells.map((c) => cleanMarkdownCell(c));
    parsedRows.push(cleanCells);
  }

  if (parsedRows.length === 0) return null;

  let headers: string[] = [];
  let rows: string[][] = [];

  if (separatorIndex === 1 && parsedRows.length >= 1) {
    headers = parsedRows[0];
    rows = parsedRows.slice(1);
  } else if (separatorIndex > 1) {
    headers = parsedRows[0];
    rows = parsedRows.slice(1);
  } else {
    // If no explicit separator, treat first row as header if more than 1 row exists
    if (parsedRows.length > 1) {
      headers = parsedRows[0];
      rows = parsedRows.slice(1);
    } else {
      headers = parsedRows[0].map((_, idx) => `ជួរឈរទី ${idx + 1}`);
      rows = parsedRows;
    }
  }

  // Normalize column count
  const colCount = Math.max(headers.length, ...rows.map((r) => r.length));
  while (headers.length < colCount) {
    headers.push(`ជួរឈរទី ${headers.length + 1}`);
  }
  rows = rows.map((r) => {
    const padded = [...r];
    while (padded.length < colCount) padded.push('');
    return padded;
  });

  return {
    title: title ? safeTruncate(title, 200) : undefined,
    headers,
    rows,
  };
}

/**
 * Extracts structured line-items from non-table document sections.
 * Guarantees each chunk fits safely within Excel's 32,767 character ceiling.
 */
export function extractStructuredRows(text: string, pageNumber: number = 1): Array<{ no: number; category: string; content: string; page: number }> {
  if (!text) return [];
  const lines = text.split('\n');
  const results: Array<{ no: number; category: string; content: string; page: number }> = [];
  let counter = 1;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('|') || trimmed.startsWith(':::') || trimmed === '---') continue;

    // Check for Heading
    if (trimmed.startsWith('#')) {
      const headingText = cleanMarkdownCell(trimmed.replace(/^#+\s*/, ''));
      results.push({
        no: counter++,
        category: 'ចំណងជើង (Heading)',
        content: safeTruncate(headingText, 5000),
        page: pageNumber,
      });
      continue;
    }

    // Check for Key-Value pair (e.g. "ឈ្មោះ ៖ ...", "កាលបរិច្ឆេទ : ...")
    const kvMatch = trimmed.match(/^([^:៖]{2,30})[:៖]\s*(.*)$/);
    if (kvMatch && kvMatch[2].trim()) {
      const cat = safeTruncate(cleanMarkdownCell(kvMatch[1]), 200);
      const val = cleanMarkdownCell(kvMatch[2]);
      const chunks = splitIntoSafeChunks(val, 30000);
      chunks.forEach((chunk, cIdx) => {
        results.push({
          no: counter++,
          category: chunks.length > 1 ? `${cat} [${cIdx + 1}]` : cat,
          content: chunk,
          page: pageNumber,
        });
      });
      continue;
    }

    // Check for List Item (bullets, numbering)
    const bulletMatch = trimmed.match(/^([•\-\*➢\+✓]|[០-៩0-9]+[\.\)])\s*(.*)$/);
    if (bulletMatch && bulletMatch[2].trim()) {
      const cat = `បញ្ជី (${bulletMatch[1]})`;
      const val = cleanMarkdownCell(bulletMatch[2]);
      const chunks = splitIntoSafeChunks(val, 30000);
      chunks.forEach((chunk, cIdx) => {
        results.push({
          no: counter++,
          category: chunks.length > 1 ? `${cat} [${cIdx + 1}]` : cat,
          content: chunk,
          page: pageNumber,
        });
      });
      continue;
    }

    // Regular paragraph
    const cleaned = cleanMarkdownCell(trimmed);
    if (cleaned.length > 0) {
      const chunks = splitIntoSafeChunks(cleaned, 30000);
      chunks.forEach((chunk, chunkIdx) => {
        results.push({
          no: counter++,
          category: chunks.length > 1 ? `កថាខណ្ឌ [ផ្នែក ${chunkIdx + 1}]` : 'កថាខណ្ឌ (Paragraph)',
          content: chunk,
          page: pageNumber,
        });
      });
    }
  }

  return results;
}

/**
 * Calculates optimal column widths for Excel worksheets
 */
function calculateColWidths(data: (string | number)[][]): Array<{ wch: number }> {
  if (data.length === 0) return [];
  const colCount = Math.max(...data.map((r) => r.length));
  const widths: number[] = new Array(colCount).fill(12);

  for (const row of data) {
    for (let c = 0; c < row.length; c++) {
      const val = row[c] != null ? String(row[c]) : '';
      const len = Math.min(Math.max(val.length + 3, 12), 60);
      if (len > widths[c]) {
        widths[c] = len;
      }
    }
  }

  return widths.map((w) => ({ wch: w }));
}

/**
 * Builds an Excel Workbook (.xlsx) from extracted document text or multi-page array
 */
export function buildExcelWorkbook(
  input: string | Array<{ pageNumber: number; text: string }>,
  _options: ExcelExportOptions = {}
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const pages: Array<{ pageNumber: number; text: string }> = Array.isArray(input)
    ? input
    : [{ pageNumber: 1, text: input || '' }];

  // Collect all tables across pages
  const allTables: Array<ExcelTable & { pageNumber: number }> = [];
  const allStructuredRows: Array<{ no: number; category: string; content: string; page: number }> = [];

  for (const p of pages) {
    const pageTables = extractMarkdownTables(p.text);
    for (const t of pageTables) {
      allTables.push({ ...t, pageNumber: p.pageNumber });
    }

    const structured = extractStructuredRows(p.text, p.pageNumber);
    for (const item of structured) {
      allStructuredRows.push(item);
    }
  }

  // 1. If tables are found, create primary "តារាងទិន្នន័យ (Tables)" sheet
  if (allTables.length > 0) {
    if (allTables.length === 1) {
      const t = allTables[0];
      const sheetData: (string | number)[][] = [];

      if (t.title) {
        sheetData.push([safeTruncate(t.title, 200)]);
        sheetData.push([]);
      }

      sheetData.push(t.headers);
      for (const row of t.rows) {
        sheetData.push(row);
      }

      const safeData = sanitizeSheetData(sheetData);
      const ws = XLSX.utils.aoa_to_sheet(safeData);
      ws['!cols'] = calculateColWidths(safeData);
      XLSX.utils.book_append_sheet(wb, ws, 'តារាង (Table 1)');
    } else {
      // Multiple tables: Create individual sheets for clean separation
      allTables.forEach((t, idx) => {
        const sheetData: (string | number)[][] = [];
        const sheetTitle = t.title || `តារាងទី ${idx + 1} (ទំព័រ ${t.pageNumber})`;

        sheetData.push([safeTruncate(sheetTitle, 200)]);
        sheetData.push([]);
        sheetData.push(t.headers);
        for (const row of t.rows) {
          sheetData.push(row);
        }

        const safeData = sanitizeSheetData(sheetData);
        const ws = XLSX.utils.aoa_to_sheet(safeData);
        ws['!cols'] = calculateColWidths(safeData);

        // Sheet name max 31 characters, avoid illegal chars \ / ? * : [ ]
        let safeSheetName = `តារាងទី ${idx + 1}`;
        if (t.title) {
          safeSheetName = t.title.slice(0, 25).trim() || `តារាងទី ${idx + 1}`;
        }
        safeSheetName = safeSheetName.replace(/[\\/?*:[\]]/g, ' ').trim().slice(0, 31) || `តារាង ${idx + 1}`;

        let finalName = safeSheetName;
        let count = 2;
        while (wb.SheetNames.includes(finalName)) {
          finalName = `${safeSheetName.slice(0, 27)}_${count++}`;
        }

        XLSX.utils.book_append_sheet(wb, ws, finalName);
      });

      // Also create a combined "តារាងសរុប (All Tables)" sheet
      const combinedData: (string | number)[][] = [];
      allTables.forEach((t, idx) => {
        if (idx > 0) {
          combinedData.push([]);
          combinedData.push([]);
        }
        const titleStr = `=== ${t.title || `តារាងទី ${idx + 1}`} (ទំព័រទី ${t.pageNumber}) ===`;
        combinedData.push([safeTruncate(titleStr, 200)]);
        combinedData.push(t.headers);
        for (const r of t.rows) {
          combinedData.push(r);
        }
      });

      const safeCombined = sanitizeSheetData(combinedData);
      const combinedWs = XLSX.utils.aoa_to_sheet(safeCombined);
      combinedWs['!cols'] = calculateColWidths(safeCombined);
      XLSX.utils.book_append_sheet(wb, combinedWs, 'តារាងសរុប (All Tables)');
    }
  }

  // 2. Add "ខ្លឹមសារឯកសារ (Data)" sheet
  if (allStructuredRows.length > 0) {
    const structSheetData: (string | number)[][] = [
      ['ល.រ (No.)', 'ទំព័រ (Page)', 'ប្រភេទ/ចំណងជើង (Category)', 'ខ្លឹមសារ (Content)'],
    ];

    let rowIdx = 1;
    for (const item of allStructuredRows) {
      structSheetData.push([rowIdx++, item.page, item.category, item.content]);
    }

    const safeStruct = sanitizeSheetData(structSheetData);
    const wsStruct = XLSX.utils.aoa_to_sheet(safeStruct);
    wsStruct['!cols'] = [
      { wch: 10 },
      { wch: 12 },
      { wch: 25 },
      { wch: 65 },
    ];
    XLSX.utils.book_append_sheet(wb, wsStruct, 'ខ្លឹមសារឯកសារ (Data)');
  }

  // Fallback: If document was completely empty
  if (wb.SheetNames.length === 0) {
    const emptyWs = XLSX.utils.aoa_to_sheet([['គ្មានទិន្នន័យ (No Data)']]);
    XLSX.utils.book_append_sheet(wb, emptyWs, 'ទិន្នន័យ (Sheet1)');
  }

  return wb;
}

/**
 * Generates an Excel .xlsx Blob and triggers browser download.
 * Guarantees no cell exceeds 32,767 characters under all circumstances.
 */
export function exportToExcelFile(
  input: string | Array<{ pageNumber: number; text: string }>,
  fileName: string = 'ឯកសារទិន្នន័យ.xlsx',
  options: ExcelExportOptions = {}
): { blob: Blob; tableCount: number; fileName: string } {
  const wb = buildExcelWorkbook(input, options);

  // Write workbook to array buffer
  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  let safeName = fileName;
  if (!safeName.toLowerCase().endsWith('.xlsx')) {
    safeName += '.xlsx';
  }

  return {
    blob,
    tableCount: wb.SheetNames.length,
    fileName: safeName,
  };
}
