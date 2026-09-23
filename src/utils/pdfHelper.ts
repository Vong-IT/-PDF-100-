import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import type { ImageConvertOptions, WatermarkOptions } from '../types';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/**
 * Load a PDF document using PDF.js with optional password support
 */
export async function loadPdfJsDoc(data: Uint8Array, password?: string) {
  const loadingTask = pdfjsLib.getDocument({
    data: data.slice(),
    password: password || undefined,
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
    cMapPacked: true,
  });

  return await loadingTask.promise;
}

/**
 * Render a single page to HTML Canvas with high precision
 */
export async function renderPageToCanvas(
  pdfDoc: any,
  pageNumber: number,
  scale = 1.5,
  customRotation = 0
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number; dataUrl: string }> {
  const page = await pdfDoc.getPage(pageNumber);
  const totalRotation = (page.rotate + customRotation) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not get 2D canvas context');

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // Fill white background for crisp document reading
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    dataUrl: canvas.toDataURL('image/png'),
  };
}

/**
 * Convert canvas to specific image format (PNG, JPEG, WebP) with quality
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' | 'webp',
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Extract native embedded text from a PDF page while preserving
 * Khmer font styles (Muol, bold), alignments, and administrative layout blocks.
 */
export async function extractNativePageText(pdfDoc: any, pageNumber: number): Promise<string> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width || 595.28; // Standard A4 width in pt
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];
    if (!items || items.length === 0) return '';

    // Group items into horizontal lines (within 5pt Y threshold)
    interface TextItem {
      str: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontName: string;
      fontSize: number;
    }

    const rawItems: TextItem[] = [];
    for (const item of items) {
      if (typeof item.str !== 'string' || !item.str.trim()) continue;
      const x = item.transform ? item.transform[4] : 0;
      const y = item.transform ? item.transform[5] : 0;
      const fontSize = item.transform ? Math.abs(item.transform[0] || item.transform[3] || item.height || 12) : 12;
      rawItems.push({
        str: item.str,
        x,
        y,
        width: item.width || 0,
        height: item.height || fontSize,
        fontName: item.fontName || '',
        fontSize,
      });
    }

    if (rawItems.length === 0) return '';

    // Sort items by Y descending (top of page first), then X ascending
    rawItems.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.x - b.x;
    });

    // Group into distinct lines
    const lines: TextItem[][] = [];
    let currentLine: TextItem[] = [];
    let currentY: number | null = null;

    for (const item of rawItems) {
      if (currentY === null || Math.abs(item.y - currentY) <= 5) {
        currentLine.push(item);
        if (currentY === null) currentY = item.y;
      } else {
        if (currentLine.length > 0) {
          // Sort items in line by X ascending
          currentLine.sort((a, b) => a.x - b.x);
          lines.push(currentLine);
        }
        currentLine = [item];
        currentY = item.y;
      }
    }
    if (currentLine.length > 0) {
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine);
    }

    // Process each line into formatted text with layout tags
    const outputLines: string[] = [];
    let inHeaderLayout = false;
    let headerLeft: string[] = [];
    let headerRight: string[] = [];

    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const lineItems = lines[lIdx];
      const minX = lineItems[0].x;
      const lastItem = lineItems[lineItems.length - 1];
      const maxX = lastItem.x + lastItem.width;
      const lineWidth = maxX - minX;
      const lineCenter = (minX + maxX) / 2;
      const fullLineStr = lineItems.map((it) => it.str).join(' ').trim();

      // Check if line has items split between far-left and far-right (2-column layout)
      const leftCluster = lineItems.filter((it) => it.x < pageWidth * 0.45);
      const rightCluster = lineItems.filter((it) => it.x > pageWidth * 0.52);

      if (leftCluster.length > 0 && rightCluster.length > 0 && leftCluster.length + rightCluster.length === lineItems.length) {
        // Two-column administrative line!
        const leftStr = leftCluster.map((it) => it.str).join(' ').trim();
        const rightStr = rightCluster.map((it) => it.str).join(' ').trim();

        if (!inHeaderLayout) {
          inHeaderLayout = true;
          headerLeft = [];
          headerRight = [];
        }
        if (leftStr) headerLeft.push(leftStr);
        if (rightStr) headerRight.push(rightStr);
        continue;
      } else if (inHeaderLayout) {
        // Close 2-column header layout block
        outputLines.push(':::header-layout');
        outputLines.push('[left]');
        outputLines.push(headerLeft.join('\n'));
        outputLines.push('[/left]');
        outputLines.push('[right]');
        outputLines.push(headerRight.join('\n'));
        outputLines.push('[/right]');
        outputLines.push(':::');
        outputLines.push('');
        inHeaderLayout = false;
        headerLeft = [];
        headerRight = [];
      }

      // Check for table row (multiple large horizontal gaps between words)
      const columnCells: string[] = [];
      let currentCell = lineItems[0].str;
      for (let i = 1; i < lineItems.length; i++) {
        const prev = lineItems[i - 1];
        const curr = lineItems[i];
        const gap = curr.x - (prev.x + prev.width);
        if (gap > 28) {
          columnCells.push(currentCell.trim());
          currentCell = curr.str;
        } else {
          currentCell += ' ' + curr.str;
        }
      }
      columnCells.push(currentCell.trim());

      if (columnCells.length >= 3) {
        // Format as Markdown table row
        outputLines.push(`| ${columnCells.join(' | ')} |`);
        // If this is the first table row, add delimiter row
        if (outputLines.length === 1 || !outputLines[outputLines.length - 2].startsWith('|')) {
          const delimiter = columnCells.map(() => ':---').join(' | ');
          outputLines.push(`| ${delimiter} |`);
        }
        continue;
      }

      // Check for Khmer Royal Mottos or decree titles (អក្សរមូល)
      const isRoyalMotto =
        fullLineStr.includes('ព្រះរាជាណាចក្រកម្ពុជា') ||
        fullLineStr.includes('ជាតិ  សាសនា  ព្រះមហាក្សត្រ') ||
        fullLineStr.includes('ជាតិ សាសនា ព្រះមហាក្សត្រ');

      const isMuolFont = lineItems.some(
        (it) =>
          it.fontName.toLowerCase().includes('muol') ||
          it.fontName.toLowerCase().includes('moul') ||
          (it.fontSize >= 16 && isRoyalMotto)
      );

      const isCentered =
        Math.abs(lineCenter - pageWidth / 2) < 40 && lineWidth < pageWidth * 0.75;
      const isRightAligned = minX > pageWidth * 0.52;

      let formattedText = fullLineStr;

      if (isRoyalMotto || isMuolFont) {
        formattedText = `[muol]${formattedText}[/muol]`;
      } else if (lineItems[0].fontSize >= 14 || lineItems[0].fontName.toLowerCase().includes('bold')) {
        formattedText = `**${formattedText}**`;
      }

      if (isCentered) {
        formattedText = `[center]${formattedText}[/center]`;
      } else if (isRightAligned) {
        formattedText = `[right]${formattedText}[/right]`;
      }

      outputLines.push(formattedText);
    }

    if (inHeaderLayout) {
      outputLines.push(':::header-layout');
      outputLines.push('[left]');
      outputLines.push(headerLeft.join('\n'));
      outputLines.push('[/left]');
      outputLines.push('[right]');
      outputLines.push(headerRight.join('\n'));
      outputLines.push('[/right]');
      outputLines.push(':::');
    }

    return outputLines.join('\n').trim();
  } catch (err) {
    console.warn('Native text extraction error on page', pageNumber, err);
    return '';
  }
}

/**
 * Apply security watermark to PDF pages
 */
export async function applyWatermarkToPdf(
  pdfBytes: Uint8Array,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  // Parse color hex into rgb
  let r = 0.7, g = 0.1, b = 0.1;
  if (options.color.startsWith('#') && options.color.length === 7) {
    r = parseInt(options.color.slice(1, 3), 16) / 255;
    g = parseInt(options.color.slice(3, 5), 16) / 255;
    b = parseInt(options.color.slice(5, 7), 16) / 255;
  }

  const watermarkText = options.text || 'CONFIDENTIAL';
  const fontSize = options.fontSize || 42;
  const opacity = options.opacity || 0.25;
  const rotationAngle = degrees(options.rotation || -35);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    if (options.repeat) {
      // Repeat diagonally
      const stepX = width / 2;
      const stepY = height / 3;
      for (let x = 50; x < width; x += stepX) {
        for (let y = 100; y < height; y += stepY) {
          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize * 0.7,
            font,
            color: rgb(r, g, b),
            opacity: opacity * 0.8,
            rotate: rotationAngle,
          });
        }
      }
    } else {
      // Center watermark
      const x = (width - textWidth) / 2;
      const y = (height - textHeight) / 2;

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(r, g, b),
        opacity,
        rotate: rotationAngle,
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Rotate specific pages in a PDF
 */
export async function rotatePdfPages(
  pdfBytes: Uint8Array,
  pageRotations: { [pageIndex: number]: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const rot = pageRotations[i];
    if (rot !== undefined && rot !== 0) {
      const currentRot = pages[i].getRotation().angle;
      pages[i].setRotation(degrees((currentRot + rot) % 360));
    }
  }

  return await pdfDoc.save();
}

/**
 * Reorder and/or delete pages
 */
export async function rearrangePdfPages(
  pdfBytes: Uint8Array,
  pageIndicesToKeep: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const copiedPages = await newDoc.copyPages(srcDoc, pageIndicesToKeep);
  for (const p of copiedPages) {
    newDoc.addPage(p);
  }

  return await newDoc.save();
}

/**
 * Merge multiple PDF documents into one
 */
export async function mergePdfDocuments(
  pdfList: { name: string; data: Uint8Array }[]
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const item of pdfList) {
    try {
      const doc = await PDFDocument.load(item.data, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (e) {
      console.warn('Skipping unreadable document in merge:', item.name, e);
    }
  }

  return await mergedPdf.save();
}

/**
 * Convert user uploaded images into a PDF document
 */
export async function convertImagesToPdf(
  images: { name: string; data: Uint8Array; mimeType: string }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    let embeddedImg;
    if (img.mimeType === 'image/png') {
      embeddedImg = await pdfDoc.embedPng(img.data);
    } else {
      embeddedImg = await pdfDoc.embedJpg(img.data);
    }

    const { width, height } = embeddedImg;
    // Standard A4 ratio fitting or native image dimensions
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return await pdfDoc.save();
}

/**
 * Trigger browser file download
 */
export function triggerDownload(data: Blob | Uint8Array, fileName: string, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data as any], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
