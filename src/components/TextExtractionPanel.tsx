import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Cpu,
  Layers,
  FileCheck2,
  Table as TableIcon,
  Settings2,
  Eye,
  Columns,
  Code,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  XCircle,
  BookOpen,
  RotateCcw,
  PanelLeftOpen,
  PanelLeftClose,
  StopCircle,
  SlidersHorizontal,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';
import type { Language } from '../types';
import { extractNativePageText, renderPageToCanvas, triggerDownload } from '../utils/pdfHelper';
import {
  createWordDocumentFromText,
  WordExportOptions,
  WordTableStyle,
  WordLayoutPreset,
} from '../utils/docxExport';
import { exportToExcelFile, extractMarkdownTables } from '../utils/excelExport';
import { WordPreview } from './WordPreview';
import { WordPageSetupModal } from './WordPageSetupModal';

interface TextExtractionPanelProps {
  lang: Language;
  pdfDoc: any;
  totalPages: number;
  currentPage: number;
  fileName: string;
}

export const TextExtractionPanel: React.FC<TextExtractionPanelProps> = ({
  lang,
  pdfDoc,
  totalPages,
  currentPage,
  fileName,
}) => {
  const isKm = lang === 'km';

  // Mode and view state
  const [activeMode, setActiveMode] = useState<'ai' | 'native'>('ai');
  const [activeView, setActiveView] = useState<'preview' | 'raw' | 'split'>('preview');
  const [viewScope, setViewScope] = useState<'single' | 'all'>('single');
  const [targetPage, setTargetPage] = useState<number>(currentPage || 1);
  const [extractedText, setExtractedText] = useState<string>('');
  const [nativeText, setNativeText] = useState<string>('');
  const [aiText, setAiText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(false);

  // Left menu collapse state and page thumbnails
  const [isLeftMenuCollapsed, setIsLeftMenuCollapsed] = useState<boolean>(false);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  // Per-page cache & status map
  const [pageAiCache, setPageAiCache] = useState<Record<number, string>>({});
  const [pageNativeCache, setPageNativeCache] = useState<Record<number, string>>({});
  const [pageStatus, setPageStatus] = useState<Record<number, 'idle' | 'generating' | 'done' | 'error'>>({});

  // Batch generation state
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    isActive: boolean;
    currentPage: number;
    completedCount: number;
    totalCount: number;
    percent: number;
    errorCount: number;
    statusText: string;
  }>({
    isActive: false,
    currentPage: 1,
    completedCount: 0,
    totalCount: totalPages || 1,
    percent: 0,
    errorCount: 0,
    statusText: '',
  });

  const cancelBatchRef = useRef<boolean>(false);

  // Word export options state (with page-setup layout as requested by user)
  const [wordOptions, setWordOptions] = useState<WordExportOptions>(() => {
    let savedDefaults: any = null;
    try {
      const stored = localStorage.getItem('word_page_setup_defaults');
      if (stored) savedDefaults = JSON.parse(stored);
    } catch {
      // ignore
    }

    return {
      title: fileName.replace(/\.pdf$/i, ''),
      fontFamily: 'Kantumruy Pro',
      muolFont: 'Khmer OS Muol Light',
      fontSizePt: 12,
      paperSize: savedDefaults?.paperSize || 'A4',
      marginsPreset: savedDefaults?.marginsPreset || 'page-setup',
      customMargins: savedDefaults?.customMargins || {
        top: 0.69,
        bottom: 0.59,
        left: 0.59,
        right: 0.59,
        gutter: 0,
      },
      bulletPreset: 'auto',
      tableStyle: 'bordered',
      layoutPreset: 'cambodian-official',
      firstLineIndent: true,
      justifyText: true,
      orientation: savedDefaults?.orientation || 'portrait',
      includePageNumbers: true,
      includeHeaderFooter: false,
      embedPdfImages: true,
    };
  });
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [showWordSettingsModal, setShowWordSettingsModal] = useState<boolean>(false);
  const [showPageSetupModal, setShowPageSetupModal] = useState<boolean>(false);

  // Auto-detect tables in current extracted text for quick count & export
  const detectedTables = React.useMemo(() => {
    return extractMarkdownTables(extractedText);
  }, [extractedText]);

  // Synchronize targetPage with parent currentPage initially
  useEffect(() => {
    setTargetPage(currentPage || 1);
  }, [currentPage]);

  // Generate lightweight thumbnails for Left Page Menu
  useEffect(() => {
    let isCancelled = false;
    async function loadThumbnails() {
      if (!pdfDoc || totalPages <= 0) return;
      for (let p = 1; p <= Math.min(totalPages, 50); p++) {
        if (isCancelled) break;
        try {
          const { canvas } = await renderPageToCanvas(pdfDoc, p, 0.22);
          if (!isCancelled) {
            const url = canvas.toDataURL('image/jpeg', 0.6);
            setThumbnails((prev) => ({ ...prev, [p]: url }));
          }
        } catch (_) {
          // ignore thumbnail errors
        }
      }
    }
    loadThumbnails();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, totalPages]);

  // Helper: Build concatenated text for all pages
  const buildAllPagesText = (
    aiMap: Record<number, string>,
    nativeMap: Record<number, string>,
    mode: 'ai' | 'native'
  ) => {
    let combined = '';
    for (let p = 1; p <= totalPages; p++) {
      const pText = mode === 'ai' ? (aiMap[p] || nativeMap[p] || '') : (nativeMap[p] || '');
      if (p > 1) combined += '\n\n';
      combined += `--- [ទំព័រទី ${p} / Page ${p}] ---\n\n` + (pText || (isKm ? `(ទំព័រទី ${p} មិនទាន់បាន Generate នៅឡើយ)` : `(Page ${p} not yet generated)`));
    }
    return combined;
  };

  // Run extraction when page or mode changes in single page mode
  useEffect(() => {
    let isCancelled = false;

    async function process() {
      if (!pdfDoc) return;
      setErrorMessage(null);

      // Extract native text if not cached
      let curNative = pageNativeCache[targetPage];
      if (!curNative) {
        try {
          curNative = await extractNativePageText(pdfDoc, targetPage);
          if (!isCancelled) {
            setPageNativeCache((prev) => ({ ...prev, [targetPage]: curNative }));
          }
        } catch (e) {
          console.warn('Native extraction error:', e);
        }
      }

      if (isCancelled) return;
      setNativeText(curNative || '');

      if (viewScope === 'all') {
        setExtractedText(buildAllPagesText(pageAiCache, { ...pageNativeCache, [targetPage]: curNative || '' }, activeMode));
        return;
      }

      if (activeMode === 'native') {
        setExtractedText(curNative || '');
      } else {
        // If AI mode: check cache first!
        const cachedAi = pageAiCache[targetPage];
        if (cachedAi) {
          setAiText(cachedAi);
          setExtractedText(cachedAi);
        } else {
          // Auto-run AI OCR on first view of page
          runAiOcr(targetPage);
        }
      }
    }

    process();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, targetPage, activeMode, viewScope]);

  // Run AI OCR on single page
  const runAiOcr = async (pageNum: number, force = false) => {
    if (!pdfDoc || isBatchGenerating) return;

    if (!force && pageAiCache[pageNum]) {
      setAiText(pageAiCache[pageNum]);
      if (viewScope === 'single' && targetPage === pageNum) {
        setExtractedText(pageAiCache[pageNum]);
      }
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Render page at 2.0x high resolution for optimal OCR on Khmer subscript consonants
      const { canvas } = await renderPageToCanvas(pdfDoc, pageNum, 2.0);
      const imageBase64 = canvas.toDataURL('image/png');

      const response = await fetch('/api/pdf/ocr-khmer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          pageNumber: pageNum,
          mimeType: 'image/png',
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (_e) {
        throw new Error(
          isKm
            ? 'មិនអាចតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ (Backend API) បានទេ។ ប្រសិនបើអ្នកកំពុងដំណើរការលើ GitHub Pages សូមដំណើរការតាមរយៈ Node.js (npm run dev ឬ server)។'
            : 'Cannot connect to backend API. If hosting on static GitHub Pages, run via Node.js server (npm run dev/start).'
        );
      }
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to perform AI OCR');
      }

      const text = data.text;
      setAiText(text);
      setPageAiCache((prev) => {
        const next = { ...prev, [pageNum]: text };
        if (viewScope === 'all') {
          setExtractedText(buildAllPagesText(next, pageNativeCache, 'ai'));
        }
        return next;
      });
      setPageStatus((prev) => ({ ...prev, [pageNum]: 'done' }));

      if (viewScope === 'single' && targetPage === pageNum) {
        setExtractedText(text);
      }
    } catch (err: any) {
      console.error('AI OCR error:', err);
      setErrorMessage(err.message || 'Error communicating with AI OCR engine');
      setPageStatus((prev) => ({ ...prev, [pageNum]: 'error' }));
      // Fallback to native text if available
      const fallback = pageNativeCache[pageNum] || nativeText;
      if (fallback && viewScope === 'single') {
        setExtractedText(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Batch Generate All Pages via Gemini AI OCR with parallel concurrency
  const handleGenerateAllPages = async (forceRefresh = false) => {
    if (!pdfDoc || totalPages <= 0 || isBatchGenerating) return;

    setIsBatchGenerating(true);
    setErrorMessage(null);
    setShowSuccessBanner(false);
    cancelBatchRef.current = false;

    const newAiMap = { ...pageAiCache };
    const newNativeMap = { ...pageNativeCache };
    const newStatusMap = { ...pageStatus };

    const pagesToRun: number[] = [];
    let alreadyDone = 0;
    for (let p = 1; p <= totalPages; p++) {
      if (!forceRefresh && newAiMap[p]) {
        alreadyDone++;
        newStatusMap[p] = 'done';
      } else {
        newStatusMap[p] = 'idle';
        pagesToRun.push(p);
      }
    }

    setPageStatus(newStatusMap);
    setBatchProgress({
      isActive: true,
      currentPage: pagesToRun[0] || 1,
      completedCount: alreadyDone,
      totalCount: totalPages,
      percent: Math.round((alreadyDone / totalPages) * 100),
      errorCount: 0,
      statusText: isKm
        ? `កំពុងចាប់ផ្តើម Generate ម្ដងគ្រប់ ${totalPages} ទំព័រ (${pagesToRun.length} ទំព័រត្រូវដំណើរការ)...`
        : `Starting batch generation for all ${totalPages} pages (${pagesToRun.length} to process)...`,
    });

    let completed = alreadyDone;
    let errors = 0;

    // Process with concurrency limit of 2 for maximum speed while preserving API safety
    const CONCURRENCY = 2;
    let queueIndex = 0;

    const worker = async () => {
      while (queueIndex < pagesToRun.length) {
        if (cancelBatchRef.current) break;
        const p = pagesToRun[queueIndex++];
        if (!p) break;

        setBatchProgress((prev) => ({
          ...prev,
          currentPage: p,
          statusText: isKm
            ? `កំពុងដំណើរការ Gemini AI OCR លើទំព័រទី ${p} នៃ ${totalPages}...`
            : `Running Gemini AI OCR on Page ${p} of ${totalPages}...`,
        }));

        setPageStatus((prev) => ({ ...prev, [p]: 'generating' }));

        try {
          // High-res canvas 2.0x for crisp Khmer characters, tables & vector shapes
          const { canvas } = await renderPageToCanvas(pdfDoc, p, 2.0);
          const imageBase64 = canvas.toDataURL('image/png');

          const response = await fetch('/api/pdf/ocr-khmer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64,
              pageNumber: p,
              mimeType: 'image/png',
            }),
          });

          let data: any = null;
          try {
            data = await response.json();
          } catch (_e) {
            throw new Error(
              isKm
                ? 'មិនអាចតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ (Backend API) បានទេ។ ប្រសិនបើអ្នកកំពុងដំណើរការលើ GitHub Pages សូមដំណើរការតាមរយៈ Node.js (npm run dev ឬ server)។'
                : 'Cannot connect to backend API. If hosting on static GitHub Pages, run via Node.js server (npm run dev/start).'
            );
          }
          if (!response.ok || !data?.success) {
            throw new Error(data?.error || `Failed to OCR page ${p}`);
          }

          newAiMap[p] = data.text;
          setPageAiCache((prev) => ({ ...prev, [p]: data.text }));
          setPageStatus((prev) => ({ ...prev, [p]: 'done' }));
          completed++;

          // Live text stream update
          if (viewScope === 'all') {
            setExtractedText(buildAllPagesText(newAiMap, newNativeMap, 'ai'));
          } else if (p === targetPage) {
            setAiText(data.text);
            setExtractedText(data.text);
          }

          setBatchProgress((prev) => ({
            ...prev,
            completedCount: completed,
            percent: Math.round((completed / totalPages) * 100),
          }));

          // Brief delay between calls
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (err: any) {
          console.error(`Error on page ${p}:`, err);
          errors++;
          setPageStatus((prev) => ({ ...prev, [p]: 'error' }));

          // Fallback to native text
          let fallbackText = newNativeMap[p];
          if (!fallbackText) {
            try {
              fallbackText = await extractNativePageText(pdfDoc, p);
              newNativeMap[p] = fallbackText;
              setPageNativeCache((prev) => ({ ...prev, [p]: fallbackText }));
            } catch (_) {}
          }
          if (fallbackText) {
            newAiMap[p] = fallbackText;
            setPageAiCache((prev) => ({ ...prev, [p]: fallbackText }));
          }

          setBatchProgress((prev) => ({
            ...prev,
            errorCount: errors,
          }));
        }
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, Math.max(1, pagesToRun.length)) }, () => worker());
    await Promise.all(workers);

    const wasCancelled = cancelBatchRef.current;
    setIsBatchGenerating(false);

    // Switch view scope to all pages so the user immediately sees the entire generated multi-page document
    setViewScope('all');
    const combinedAll = buildAllPagesText(newAiMap, newNativeMap, 'ai');
    setExtractedText(combinedAll);

    if (wasCancelled) {
      setBatchProgress((prev) => ({
        ...prev,
        isActive: false,
        statusText: isKm ? 'បានបោះបង់ការ Generate គ្រប់ទំព័រ' : 'Batch generation stopped by user',
      }));
    } else {
      setBatchProgress((prev) => ({
        ...prev,
        isActive: false,
        percent: 100,
        completedCount: totalPages,
        statusText: isKm
          ? `បាន Generate ជោគជ័យគ្រប់ ${totalPages} ទំព័ររួចរាល់!`
          : `Successfully generated all ${totalPages} pages!`,
      }));
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
  };

  // Cancel running batch generation
  const handleCancelBatch = () => {
    cancelBatchRef.current = true;
    setIsBatchGenerating(false);
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Microsoft Word document (.docx) with table and Khmer font preservation
  const handleDownloadWord = async (forceAllPages = false) => {
    const isAll = forceAllPages || viewScope === 'all';
    if (!extractedText && !isAll) return;
    setIsExportingWord(true);
    try {
      let textToExport = extractedText;

      // If exporting all pages
      if (isAll && totalPages > 1) {
        if (viewScope === 'all' && extractedText) {
          textToExport = extractedText;
        } else {
          textToExport = buildAllPagesText(pageAiCache, pageNativeCache, activeMode);
        }
      }

      const cleanDocTitle = fileName.replace(/\.pdf$/i, '');

      // Collect pageImages snapshots if embedPdfImages is true
      let pageImages: { pageNumber: number; dataUrl: string; width: number; height: number }[] = [];
      if (wordOptions.embedPdfImages && pdfDoc) {
        try {
          if (isAll) {
            for (let p = 1; p <= totalPages; p++) {
              const { canvas } = await renderPageToCanvas(pdfDoc, p, 1.5);
              pageImages.push({
                pageNumber: p,
                dataUrl: canvas.toDataURL('image/png'),
                width: canvas.width / 1.5,
                height: canvas.height / 1.5,
              });
            }
          } else {
            const { canvas } = await renderPageToCanvas(pdfDoc, targetPage, 1.5);
            pageImages.push({
              pageNumber: targetPage,
              dataUrl: canvas.toDataURL('image/png'),
              width: canvas.width / 1.5,
              height: canvas.height / 1.5,
            });
          }
        } catch (imgErr) {
          console.warn('Could not capture page image snapshot:', imgErr);
        }
      }

      const blob = await createWordDocumentFromText(textToExport, {
        ...wordOptions,
        title: cleanDocTitle,
        pageImages: pageImages.length > 0 ? pageImages : undefined,
      });

      const exportFileName = isAll
        ? `${cleanDocTitle}_all_pages.docx`
        : `${cleanDocTitle}_page_${targetPage}.docx`;

      triggerDownload(
        blob,
        exportFileName,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    } catch (err: any) {
      console.error('Word export error:', err);
      setErrorMessage(err.message || 'Failed to export Word document');
    } finally {
      setIsExportingWord(false);
    }
  };

  // Download Microsoft Excel spreadsheet (.xlsx) with preserved tables and structured data
  const handleDownloadExcel = (forceAllPages = false) => {
    const isAll = forceAllPages || viewScope === 'all';
    if (!extractedText && !isAll) return;
    setIsExportingExcel(true);
    try {
      const cleanDocTitle = fileName.replace(/\.pdf$/i, '');
      let excelResult;

      if (isAll && totalPages > 1) {
        // Collect text across all generated pages
        const pagesList: Array<{ pageNumber: number; text: string }> = [];
        for (let p = 1; p <= totalPages; p++) {
          const pText = activeMode === 'ai' ? (pageAiCache[p] || '') : (pageNativeCache[p] || '');
          if (pText) {
            pagesList.push({ pageNumber: p, text: pText });
          }
        }
        if (pagesList.length === 0 && extractedText) {
          pagesList.push({ pageNumber: targetPage, text: extractedText });
        }
        const exportFileName = `${cleanDocTitle}_all_pages.xlsx`;
        excelResult = exportToExcelFile(pagesList, exportFileName);
      } else {
        const exportFileName = `${cleanDocTitle}_page_${targetPage}.xlsx`;
        excelResult = exportToExcelFile(extractedText, exportFileName);
      }

      triggerDownload(
        excelResult.blob,
        excelResult.fileName,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
    } catch (err: any) {
      console.error('Excel export error:', err);
      setErrorMessage(err.message || 'Failed to export Excel spreadsheet');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Download text file
  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const cleanName = fileName.replace(/\.pdf$/i, '');
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const suffix = viewScope === 'all' ? 'all_pages' : `page_${targetPage}`;
    triggerDownload(blob, `${cleanName}_${suffix}_text.txt`, 'text/plain');
  };

  // Download markdown file
  const handleDownloadMd = () => {
    if (!extractedText) return;
    const cleanName = fileName.replace(/\.pdf$/i, '');
    const blob = new Blob([extractedText], { type: 'text/markdown;charset=utf-8' });
    const suffix = viewScope === 'all' ? 'all_pages' : `page_${targetPage}`;
    triggerDownload(blob, `${cleanName}_${suffix}_transcription.md`, 'text/markdown');
  };

  // Switch between Single Page and All Pages scope
  const handleScopeChange = (newScope: 'single' | 'all') => {
    setViewScope(newScope);
    if (newScope === 'single') {
      const singleText = activeMode === 'ai' ? (pageAiCache[targetPage] || '') : (pageNativeCache[targetPage] || '');
      setExtractedText(singleText);
      if (!singleText && activeMode === 'ai') {
        runAiOcr(targetPage);
      }
    } else {
      const allText = buildAllPagesText(pageAiCache, pageNativeCache, activeMode);
      setExtractedText(allText);
    }
  };

  // Count how many pages have been generated with AI
  const generatedAiCount = Object.keys(pageAiCache).length;

  return (
    <div className="max-w-[1680px] mx-auto px-2 sm:px-4 py-4">
      {/* Compact Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLeftMenuCollapsed(!isLeftMenuCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title={
              isLeftMenuCollapsed
                ? isKm ? 'បង្ហាញម៉ឺនុយឆ្វេង' : 'Show Left Menu'
                : isKm ? 'បង្រួមម៉ឺនុយឆ្វេង' : 'Collapse Left Menu'
            }
          >
            {isLeftMenuCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-600" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-500" />
            )}
            <span className="hidden sm:inline">
              {isLeftMenuCollapsed
                ? isKm ? 'បើកម៉ឺនុយ' : 'Show Menu'
                : isKm ? 'បង្រួមម៉ឺនុយ' : 'Hide Menu'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{isKm ? 'បម្លែងទៅជា Microsoft Word (.docx)' : 'Convert to Microsoft Word (.docx)'}</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {viewScope === 'all'
                ? isKm ? `ឯកសារពេញ ${totalPages} ទំព័រ` : `All ${totalPages} Pages`
                : isKm ? `ទំព័រទី ${targetPage}` : `Page ${targetPage}`}
            </span>
          </div>
        </div>

        {/* Right Quick Actions Bar */}
        <div className="flex items-center gap-2">
          {/* Main Word (.docx) Download Button */}
          <button
            id="btn-download-word"
            onClick={() => handleDownloadWord(false)}
            disabled={!extractedText || isExportingWord}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer ring-2 ring-blue-100"
            title={
              viewScope === 'all'
                ? isKm ? `ទាញយកទាំង ${totalPages} ទំព័រជាឯកសារ Word (.docx)` : `Download all ${totalPages} pages as Word (.docx)`
                : isKm ? 'ទាញយកទំព័រនេះជាឯកសារ Word (.docx)' : 'Download current page as Microsoft Word (.docx)'
            }
          >
            <div className="w-4 h-4 rounded bg-white text-blue-700 flex items-center justify-center font-bold text-[10px] leading-none">
              W
            </div>
            <span>
              {isExportingWord
                ? isKm ? 'កំពុងបង្កើត Word...' : 'Generating Word...'
                : viewScope === 'all'
                ? isKm ? `ទាញយក Word គ្រប់ ${totalPages} ទំព័រ` : `Download All ${totalPages} Pages`
                : isKm ? 'ទាញយកជា Word (.docx)' : 'Export to Word (.docx)'}
            </span>
          </button>

          {/* Export to Excel (.xlsx) */}
          <button
            id="btn-export-excel"
            onClick={() => handleDownloadExcel(false)}
            disabled={!extractedText || isExportingExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
            title={
              viewScope === 'all'
                ? isKm ? `ទាញយកទាំង ${totalPages} ទំព័រជាឯកសារ Excel (.xlsx)` : `Download all ${totalPages} pages as Excel (.xlsx)`
                : isKm ? 'ទាញយកតារាង និងទិន្នន័យជាឯកសារ Excel (.xlsx)' : 'Download tables & data as Excel (.xlsx)'
            }
          >
            <div className="w-4 h-4 rounded bg-white text-emerald-700 flex items-center justify-center font-bold text-[10px] leading-none">
              X
            </div>
            <span>
              {isExportingExcel
                ? isKm ? 'កំពុងបង្កើត Excel...' : 'Creating Excel...'
                : viewScope === 'all'
                ? isKm ? `ទាញយក Excel គ្រប់ ${totalPages} ទំព័រ` : `All Pages Excel (.xlsx)`
                : isKm ? 'ទាញយកជា Excel (.xlsx)' : 'Export to Excel (.xlsx)'}
            </span>
            {detectedTables.length > 0 && (
              <span className="hidden sm:inline-flex text-[10px] bg-emerald-900/60 text-emerald-100 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {detectedTables.length} {isKm ? 'តារាង' : 'tbl'}
              </span>
            )}
          </button>

          {/* Copy Text */}
          <button
            id="btn-copy-text"
            onClick={handleCopy}
            disabled={!extractedText}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? (isKm ? 'បានចម្លង!' : 'Copied!') : isKm ? 'ចម្លង' : 'Copy'}</span>
          </button>

          {/* Word Page Setup (Direct dialog requested by user with Margins, Paper, Layout) */}
          <button
            id="btn-word-page-setup"
            onClick={() => setShowPageSetupModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title={isKm ? 'កំណត់ទំព័រ (Page Setup): រឹម Top 0.69", Bottom/Left/Right 0.59", ក្រដាស, Layout' : 'Word Page Setup (Margins, Paper, Layout)'}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>{isKm ? 'កំណត់ទំព័រ' : 'Page Setup'}</span>
            <span className="hidden xl:inline text-[10px] bg-blue-200/70 text-blue-800 px-1 py-0.2 rounded font-mono font-normal">
              0.69"/0.59"
            </span>
          </button>

          {/* Word Settings */}
          <button
            id="btn-word-options"
            onClick={() => setShowWordSettingsModal(!showWordSettingsModal)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            title={isKm ? 'កំណត់ទម្រង់ Word (ក្រដាស, រឹម, Bullet, អក្សរ)' : 'Word Formatting Options'}
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">{isKm ? 'កំណត់ Word' : 'Settings'}</span>
          </button>

          {/* Plain Text Download */}
          <button
            id="btn-download-txt"
            onClick={handleDownloadTxt}
            disabled={!extractedText}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
            title="Download Plain Text"
          >
            <span>.TXT</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (Left Menu + Right Content) */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* LEFT MENU (Page list, Batch generation, Mode Switcher, Paper/Font settings) */}
        {!isLeftMenuCollapsed && (
          <aside className="w-full lg:w-80 shrink-0 space-y-3.5">
            {/* Primary Action Card: Batch Generate All Pages */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white shadow-sm border border-blue-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 bg-blue-800/60 px-2 py-0.5 rounded-md">
                  BATCH GENERATOR
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {generatedAiCount} / {totalPages} {isKm ? 'រួចរាល់' : 'ready'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-white leading-tight mb-1">
                {isKm ? 'Generate ម្ដងបានគ្រប់ Page' : 'Generate All Pages at Once'}
              </h3>
              <p className="text-[11px] text-blue-200 leading-relaxed mb-3">
                {isKm
                  ? 'ដំណើរការ Gemini AI OCR ស្រង់តារាង ជើងអក្សរ និងរូបភាពគ្រប់ទំព័រស្វ័យប្រវត្តិ។'
                  : 'Batch-extracts tables, Khmer subscripts, and styles across all pages simultaneously.'}
              </p>

              {/* Action Button & Status */}
              {isBatchGenerating ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>
                        {isKm
                          ? `ទំព័រ ${batchProgress.currentPage}/${totalPages}`
                          : `Page ${batchProgress.currentPage}/${totalPages}`}
                      </span>
                    </span>
                    <span className="font-mono font-bold text-amber-300">{batchProgress.percent}%</span>
                  </div>

                  <div className="w-full bg-blue-950/80 rounded-full h-2 overflow-hidden border border-blue-700/50">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${batchProgress.percent}%` }}
                    />
                  </div>

                  <button
                    onClick={handleCancelBatch}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>{isKm ? 'បញ្ឈប់ (Stop)' : 'Stop Batch'}</span>
                  </button>
                </div>
              ) : (
                <button
                  id="btn-generate-all-left"
                  onClick={() => handleGenerateAllPages(false)}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>
                    {generatedAiCount === totalPages
                      ? isKm ? `Generate ឡើងវិញគ្រប់ ${totalPages} ទំព័រ` : `Re-generate All ${totalPages} Pages`
                      : isKm ? `⚡ Generate ម្ដងគ្រប់ ${totalPages} ទំព័រ` : `⚡ Generate All ${totalPages} Pages`}
                  </span>
                </button>
              )}

              {/* Quick Batch Export Actions when pages are generated */}
              {generatedAiCount > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-blue-800/60 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadWord(true)}
                    disabled={isExportingWord}
                    className="py-1.5 px-2 bg-blue-800/80 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border border-blue-600/40"
                    title={isKm ? 'ទាញយកគ្រប់ទំព័រជា Word (.docx)' : 'Export all pages to Word'}
                  >
                    <Download className="w-3 h-3 text-blue-200" />
                    <span>Word (.docx)</span>
                  </button>
                  <button
                    onClick={() => handleDownloadExcel(true)}
                    disabled={isExportingExcel}
                    className="py-1.5 px-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border border-emerald-500/40 shadow-2xs"
                    title={isKm ? 'ទាញយកគ្រប់ទំព័រជា Excel (.xlsx)' : 'Export all pages to Excel'}
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-200" />
                    <span>Excel (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Extraction Mode Selector */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                {isKm ? 'វិធីសាស្ត្រស្រង់ទិន្នន័យ (Extraction Mode)' : 'Extraction Mode'}
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => {
                    setActiveMode('ai');
                    if (aiText) setExtractedText(aiText);
                    else runAiOcr(targetPage);
                  }}
                  className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeMode === 'ai'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isKm ? 'Gemini AI' : 'AI Vision'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMode('native');
                    setExtractedText(nativeText);
                  }}
                  className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeMode === 'native'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{isKm ? 'អត្ថបទដើម' : 'Native Text'}</span>
                </button>
              </div>
            </div>

            {/* Scope Selector: Single Page vs All Pages */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                {isKm ? 'វិសាលភាពបង្ហាញ (Display Scope)' : 'View Scope'}
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => handleScopeChange('single')}
                  className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    viewScope === 'single'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isKm ? `ទំព័រទី ${targetPage}` : `Page ${targetPage}`}</span>
                </button>

                <button
                  onClick={() => handleScopeChange('all')}
                  className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    viewScope === 'all'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isKm ? `គ្រប់ ${totalPages} ទំព័រ` : `All Pages`}</span>
                </button>
              </div>
            </div>

            {/* Page List Navigator with Thumbnails */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKm ? `បញ្ជីទំព័រ (${totalPages})` : `Page Navigator (${totalPages})`}</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  {generatedAiCount}/{totalPages} OCR
                </span>
              </div>

              {/* Scrollable list */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isCurrent = viewScope === 'single' && targetPage === p;
                  const hasAi = !!pageAiCache[p];
                  const status = pageStatus[p] || (hasAi ? 'done' : 'idle');
                  const thumb = thumbnails[p];

                  return (
                    <div
                      key={p}
                      onClick={() => {
                        if (viewScope === 'all') setViewScope('single');
                        setTargetPage(p);
                      }}
                      className={`flex items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-300 font-bold'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Thumbnail or mini box */}
                        <div className="w-8 h-10 rounded border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                          {thumb ? (
                            <img src={thumb} alt={`Page ${p}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400 font-bold">{p}</span>
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800 text-xs">
                            {isKm ? `ទំព័រទី ${p}` : `Page ${p}`}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {status === 'done' && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> {isKm ? 'រួចរាល់' : 'Done'}
                              </span>
                            )}
                            {status === 'generating' && (
                              <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1 rounded flex items-center gap-0.5 animate-pulse">
                                <Sparkles className="w-2.5 h-2.5 animate-spin" /> {isKm ? 'កំពុងរត់' : 'Running'}
                              </span>
                            )}
                            {status === 'error' && (
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 rounded">
                                {isKm ? 'បរាជ័យ' : 'Error'}
                              </span>
                            )}
                            {status === 'idle' && (
                              <span className="text-[9px] font-medium text-slate-500 bg-slate-200/60 px-1 rounded">
                                {isKm ? 'មិនទាន់ OCR' : 'Pending'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick action: Re-run AI OCR for this single page */}
                      {activeMode === 'ai' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (viewScope === 'all') setViewScope('single');
                            setTargetPage(p);
                            runAiOcr(p, true);
                          }}
                          disabled={isLoading || isBatchGenerating}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title={isKm ? `Generate ទំព័រទី ${p} ឡើងវិញ` : `Re-generate Page ${p}`}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Word Formatting Quick Presets Summary */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKm ? 'ទ្រង់ទ្រាយក្រដាស & អក្សរ' : 'Formatting & Paper'}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowPageSetupModal(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-0.5"
                    title={isKm ? 'បើកផ្ទាំង Page Setup' : 'Page Setup Dialog'}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Setup</span>
                  </button>
                  <button
                    onClick={() => setShowWordSettingsModal(true)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    ⚙️
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">{isKm ? 'ក្រដាស' : 'Paper'}</span>
                  <span className="font-bold text-slate-800">{wordOptions.paperSize || 'A4'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">{isKm ? 'រឹម' : 'Margins'}</span>
                  <span className="font-bold text-slate-800">
                    {wordOptions.customMargins
                      ? `T:${wordOptions.customMargins.top}" B/L/R:${wordOptions.customMargins.bottom}"`
                      : wordOptions.marginsPreset === 'page-setup'
                      ? '0.69" / 0.59"'
                      : wordOptions.marginsPreset === 'administrative'
                      ? (isKm ? 'រដ្ឋបាល (3/2cm)' : 'Admin')
                      : '1 inch'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">{isKm ? 'ទំហំអក្សរ' : 'Base Size'}</span>
                  <span className="font-bold text-slate-800">{wordOptions.fontSizePt || 12} pt</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">{isKm ? 'Bullet' : 'Bullets'}</span>
                  <span className="font-bold text-slate-800">
                    {wordOptions.bulletPreset === 'arrow' ? '➢ Arrow' : wordOptions.bulletPreset === 'square' ? '▪ Square' : '• Auto/Disc'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* RIGHT CONTENT AREA (Instant Word Preview & Editor with unobstructed vertical height!) */}
        <main className="flex-1 min-w-0 w-full space-y-3">
          {/* View Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              {/* Menu expand button when left menu collapsed */}
              {isLeftMenuCollapsed && (
                <button
                  onClick={() => setIsLeftMenuCollapsed(false)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  title={isKm ? 'បើកម៉ឺនុយឆ្វេង' : 'Open Left Menu'}
                >
                  <PanelLeftOpen className="w-4 h-4 text-blue-600" />
                  <span>{isKm ? 'ម៉ឺនុយ' : 'Menu'}</span>
                </button>
              )}

              {/* View Switcher: Word Preview vs Raw vs Split */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setActiveView('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    activeView === 'preview'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isKm ? 'គំរូទម្រង់ Word (Preview)' : 'Word Preview'}</span>
                </button>

                <button
                  onClick={() => setActiveView('raw')}
                  className={`flex items-center gap-1.5 px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    activeView === 'raw'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{isKm ? 'កូដអត្ថបទ (Raw)' : 'Raw Text'}</span>
                </button>

                <button
                  onClick={() => setActiveView('split')}
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    activeView === 'split'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>{isKm ? 'ទន្ទឹមគ្នា (Split)' : 'Split'}</span>
                </button>
              </div>

              {/* Display Scope Info */}
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                {viewScope === 'all'
                  ? isKm ? `(បង្ហាញឯកសារទាំង ${totalPages} ទំព័រ)` : `(Showing all ${totalPages} pages)`
                  : isKm ? `(ទំព័រទី ${targetPage} នៃ ${totalPages})` : `(Page ${targetPage} of ${totalPages})`}
              </span>
            </div>

            {/* Quick Export format buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadWord(false)}
                disabled={!extractedText || isExportingWord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.DOCX</span>
              </button>

              <button
                onClick={handleDownloadMd}
                disabled={!extractedText}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <span>.MD</span>
              </button>
            </div>
          </div>

          {/* Batch Generation Progress Card if running */}
          {isBatchGenerating && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200 shadow-2xs transition-all">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                      <span>{isKm ? `កំពុង Generate គ្រប់ទំព័រ...` : `Batch Generating All ${totalPages} Pages...`}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-200 text-indigo-900 font-mono font-bold">
                        {batchProgress.completedCount} / {totalPages}
                      </span>
                    </h4>
                    <p className="text-[11px] text-indigo-700 mt-0.2">
                      {batchProgress.statusText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-indigo-900 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-2xs">
                    {batchProgress.percent}%
                  </span>
                  <button
                    onClick={handleCancelBatch}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <StopCircle className="w-3 h-3" />
                    <span>{isKm ? 'បញ្ឈប់' : 'Stop'}</span>
                  </button>
                </div>
              </div>

              <div className="w-full bg-indigo-200/70 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(batchProgress.percent, 3)}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Banner */}
          {showSuccessBanner && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold">
                  {isKm
                    ? `🎉 បាន Generate គ្រប់ ${totalPages} ទំព័ររួចរាល់! អាចទាញយកជា Word បានភ្លាមៗ។`
                    : `🎉 Successfully generated all ${totalPages} pages into Word!`}
                </span>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-emerald-700 hover:text-emerald-900 p-1"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-amber-700 hover:text-amber-900 p-1"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Word Settings Modal */}
          {showWordSettingsModal && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 transition-all shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-blue-700" />
                  <h4 className="text-sm font-bold text-blue-950">
                    {isKm
                      ? 'ការកំណត់ទម្រង់ឯកសារ Word (ក្រដាស, រឹម, Bullet, អក្សរ)'
                      : 'Word Document Formatting Settings'}
                  </h4>
                </div>
                <button
                  onClick={() => setShowWordSettingsModal(false)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
                >
                  ✕ {isKm ? 'បិទ' : 'Close'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Paper Size */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isKm ? 'ទំហំក្រដាស (Paper Size):' : 'Paper Size:'}
                  </label>
                  <select
                    value={wordOptions.paperSize || 'A4'}
                    onChange={(e) =>
                      setWordOptions({ ...wordOptions, paperSize: e.target.value as any })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A4">A4 (210 x 297 mm - ស្តង់ដារកម្ពុជា)</option>
                    <option value="Letter">Letter (8.5 x 11 inch)</option>
                    <option value="Legal">Legal (8.5 x 14 inch)</option>
                    <option value="A3">A3 (297 x 420 mm)</option>
                  </select>
                </div>

                {/* Margins */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">
                      {isKm ? 'រឹមទំព័រ (Margins):' : 'Margins Preset:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowWordSettingsModal(false);
                        setShowPageSetupModal(true);
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                    >
                      {isKm ? 'កំណត់លម្អិត' : 'Custom'}
                    </button>
                  </div>
                  <select
                    value={wordOptions.marginsPreset}
                    onChange={(e) =>
                      setWordOptions({ ...wordOptions, marginsPreset: e.target.value as any })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="page-setup">
                      {isKm ? '⭐ ប្លង់តាមរូបភាព (Top 0.69", B/L/R 0.59")' : '⭐ Page Setup (Top 0.69", B/L/R 0.59")'}
                    </option>
                    <option value="administrative">
                      {isKm ? 'រដ្ឋបាលកម្ពុជា (ឆ្វេង 3cm, ស្តាំ 2cm)' : 'Administrative (L:3cm, R:2cm)'}
                    </option>
                    <option value="standard">
                      {isKm ? 'ស្តង់ដារ 1 អ៊ីញ (Standard 1")' : 'Standard 1 inch'}
                    </option>
                    <option value="narrow">
                      {isKm ? 'តូច 0.5 អ៊ីញ (Narrow 0.5")' : 'Narrow 0.5 inch'}
                    </option>
                    <option value="wide">{isKm ? 'ធំ 2 អ៊ីញ (Wide 2")' : 'Wide 2 inch'}</option>
                  </select>
                </div>

                {/* Bullet Preset */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isKm ? 'ទម្រង់ចំណុច (Bullet Style):' : 'Bullet List Style:'}
                  </label>
                  <select
                    value={wordOptions.bulletPreset || 'auto'}
                    onChange={(e) =>
                      setWordOptions({ ...wordOptions, bulletPreset: e.target.value as any })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">
                      {isKm ? 'ស្វ័យប្រវត្តិតាមឯកសារ (Auto/Detect)' : 'Auto / Detect'}
                    </option>
                    <option value="standard">
                      {isKm ? 'ចំណុចមូលស្តង់ដារ (• Disc)' : '• Standard Disc'}
                    </option>
                    <option value="arrow">{isKm ? 'សញ្ញាព្រួញ (➢ Arrow)' : '➢ Arrow Bullet'}</option>
                    <option value="square">{isKm ? 'ការ៉េតូច (▪ Square)' : '▪ Square Bullet'}</option>
                    <option value="diamond">{isKm ? 'ពេជ្រ (◆ Diamond)' : '◆ Diamond Bullet'}</option>
                  </select>
                </div>

                {/* Base Font Size */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isKm ? 'ទំហំអក្សរគោល (Base Font Size):' : 'Base Font Size:'}
                  </label>
                  <select
                    value={wordOptions.fontSizePt}
                    onChange={(e) =>
                      setWordOptions({ ...wordOptions, fontSizePt: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 pt (តូចល្មម)</option>
                    <option value={11}>11 pt (ស្តង់ដារ Word)</option>
                    <option value={12}>12 pt (រដ្ឋបាលកម្ពុជា - ណែនាំ)</option>
                    <option value={13}>13 pt</option>
                    <option value={14}>14 pt (ធំស្រួលអាន)</option>
                    <option value={16}>16 pt (ក្បាលលិខិតធំ)</option>
                  </select>
                </div>

                {/* Muol Font */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isKm ? 'ពុម្ពអក្សរមូល (Muol Font):' : 'Muol / Title Font:'}
                  </label>
                  <select
                    value={wordOptions.muolFont}
                    onChange={(e) => setWordOptions({ ...wordOptions, muolFont: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Khmer OS Muol Light">Khmer OS Muol Light (ស្តង់ដារ)</option>
                    <option value="Khmer OS Muol">Khmer OS Muol</option>
                    <option value="Moul">Moul (Google Font)</option>
                    <option value="Kantumruy Pro">Kantumruy Pro Bold</option>
                  </select>
                </div>

                {/* Body Font */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isKm ? 'ពុម្ពអក្សរខ្លឹមសារ (Body Font):' : 'Body Font Family:'}
                  </label>
                  <select
                    value={wordOptions.fontFamily}
                    onChange={(e) => setWordOptions({ ...wordOptions, fontFamily: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Kantumruy Pro">Kantumruy Pro (ណែនាំខ្មែរ)</option>
                    <option value="Khmer OS Siemreap">Khmer OS Siemreap (រដ្ឋបាល)</option>
                    <option value="Khmer OS Content">Khmer OS Content (បុរាណ)</option>
                    <option value="Calibri">Calibri / Arial (Office Standard)</option>
                  </select>
                </div>

                {/* Table Style */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isKm ? 'រចនាប័ទ្មតារាង (Table Style):' : 'Table Grid Style:'}
                  </label>
                  <select
                    value={wordOptions.tableStyle}
                    onChange={(e) =>
                      setWordOptions({ ...wordOptions, tableStyle: e.target.value as any })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bordered">{isKm ? 'ក្រឡាស៊ុមពេញ (Full Grid)' : 'Bordered Grid'}</option>
                    <option value="striped">{isKm ? 'ឆ្នូតឆ្លាស់ (Zebra Striped)' : 'Zebra Striped'}</option>
                    <option value="minimal">{isKm ? 'បន្ទាត់លើក្រោម (Minimal)' : 'Minimalist'}</option>
                  </select>
                </div>

                {/* Orientation */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isKm ? 'ទិសដៅទំព័រ (Orientation):' : 'Orientation:'}
                  </label>
                  <select
                    value={wordOptions.orientation}
                    onChange={(e) =>
                      setWordOptions({ ...wordOptions, orientation: e.target.value as any })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="portrait">{isKm ? 'បញ្ឈរ (Portrait)' : 'Portrait'}</option>
                    <option value="landscape">{isKm ? 'ផ្ដេក (Landscape)' : 'Landscape'}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowWordSettingsModal(false)}
                  className="py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isKm ? 'រក្សាទុក & អនុវត្ត' : 'Apply Settings'}</span>
                </button>
              </div>
            </div>
          )}

          {/* MAIN DOCUMENT VIEW CONTAINER */}
          <div className="relative min-h-[680px]">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-20 rounded-2xl">
                <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">
                      {isKm
                        ? 'បញ្ញាសិប្បនិម្មិត Gemini កំពុងវិភាគរចនាសម្ព័ន្ធតារាង និងអក្សរខ្មែរ...'
                        : 'Gemini AI is parsing table structures & subscript consonants...'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isKm ? 'ធានារក្សាទម្រង់ដើមមិនអោយខូចទ្រង់ទ្រាយពេលបម្លែងជា Word' : 'Preserving tables and typography for lossless Word conversion'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Split View */}
            {activeView === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isKm ? 'កូដអត្ថបទ / Markdown Editor' : 'Markdown & Text Editor'}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 font-mono">
                      {extractedText.length} chars
                    </span>
                  </div>
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    rows={22}
                    className="w-full p-3 font-mono text-xs text-slate-900 bg-slate-50/50 border-none focus:outline-none focus:bg-white leading-relaxed resize-none flex-1 min-h-[520px]"
                  />
                </div>

                <WordPreview
                  rawText={extractedText}
                  isKm={isKm}
                  options={wordOptions}
                  onOptionsChange={(newOpts) => setWordOptions({ ...wordOptions, ...newOpts })}
                  onDownloadDocx={() => handleDownloadWord(false)}
                  onDownloadExcel={() => handleDownloadExcel(false)}
                  isDownloading={isExportingWord}
                />
              </div>
            )}

            {/* Word Preview Only (Default - Clean, high readability, maximum space!) */}
            {activeView === 'preview' && (
              <WordPreview
                rawText={extractedText}
                isKm={isKm}
                options={wordOptions}
                onOptionsChange={(newOpts) => setWordOptions({ ...wordOptions, ...newOpts })}
                onDownloadDocx={() => handleDownloadWord(false)}
                onDownloadExcel={() => handleDownloadExcel(false)}
                isDownloading={isExportingWord}
              />
            )}

            {/* Raw Text View Only */}
            {activeView === 'raw' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    <span>
                      {isKm
                        ? viewScope === 'all'
                          ? `កូដអត្ថបទ និងតារាង — គ្រប់ ${totalPages} ទំព័រ (${extractedText.length} តួអក្សរ)`
                          : `កូដអត្ថបទ និងតារាង — ទំព័រទី ${targetPage} (${extractedText.length} តួអក្សរ)`
                        : viewScope === 'all'
                        ? `Text & Tables — All ${totalPages} Pages (${extractedText.length} chars)`
                        : `Text & Tables — Page ${targetPage} (${extractedText.length} chars)`}
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {copied ? (isKm ? 'បានចម្លងរួចរាល់' : 'Copied!') : isKm ? 'ចម្លងអត្ថបទ' : 'Copy Text'}
                  </button>
                </div>

                <div className="p-4">
                  <textarea
                    id="textarea-extracted-text"
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder={
                      isKm
                        ? 'អត្ថបទ និងទិន្នន័យតារាងនឹងបង្ហាញនៅទីនេះ...'
                        : 'Extracted text & tables will appear here...'
                    }
                    rows={20}
                    className="w-full p-4 font-mono text-xs sm:text-sm text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed resize-y"
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Subtle feature highlights footer */}
      <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">
              {isKm ? 'Generate ម្ដងគ្រប់ Page' : 'Batch All-Page OCR'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {isKm
                ? 'ដំណើរការ Gemini AI Vision OCR ស្រង់តារាង ជើងអក្សរ និងរូបភាពគ្រប់ទំព័រស្វ័យប្រវត្តិ។'
                : 'Runs AI Vision OCR across all pages with parallel workers and live progress streaming.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">
              {isKm ? 'រក្សាទំហំអក្សរ & ក្រដាស & Bullet' : 'Paper & Bullets Fidelity'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {isKm
                ? 'រក្សាទំហំអក្សរតាមកថាខណ្ឌ ទ្រង់ទ្រាយក្រដាស A4 រឹមរដ្ឋបាល និងចំណុច bullet (•, ➢, ▪) មិនខូចទម្រង់។'
                : 'Preserves dynamic font sizes, paper presets (A4/margins), and hierarchical bullet lists.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">
              {isKm ? 'អក្សរមិនខុសដៃជើង (Subscripts)' : 'Zero Broken Subscripts'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {isKm
                ? 'ធានាថាជើងព្យញ្ជនៈខ្មែរ ស្រៈ និងសញ្ញាពិសេស មិនខូចទ្រង់ទ្រាយ ពេលបើកក្នុងកម្មវិធី Word ឬ Google Docs។'
                : 'Khmer subscript consonants and vowels render cleanly in Word or Google Docs.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">
              {isKm ? 'ទាញយក .DOCX / .TXT / .MD' : 'Multi-format Export'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {isKm
                ? 'ជម្រើសទាញយកជា Word ឯកសារទោល ឬឯកសារទាំងមូល ព្រមទាំង Text និង Markdown តាមតម្រូវការ។'
                : 'Export single pages or the entire multi-page document into formatted .docx, .txt, or .md files.'}
            </p>
          </div>
        </div>
      </div>

      {/* Word Page Setup Dialog matching screenshot provided by user */}
      <WordPageSetupModal
        isOpen={showPageSetupModal}
        onClose={() => setShowPageSetupModal(false)}
        options={wordOptions}
        onOptionsChange={(newOpts) => setWordOptions((prev) => ({ ...prev, ...newOpts }))}
        isKm={isKm}
      />
    </div>
  );
};
