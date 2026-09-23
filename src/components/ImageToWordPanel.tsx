import React, { useState, useEffect, useRef } from 'react';
import {
  FileImage,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  FileCheck2,
  Copy,
  Check,
  Eye,
  Sliders,
  SlidersHorizontal,
  RefreshCw,
  Camera,
  Layers,
  FileText,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  Edit3,
  BookOpen,
  FileSpreadsheet,
  Key,
} from 'lucide-react';
import type { Language } from '../types';
import {
  createWordDocumentFromText,
  createWordDocumentFromImages,
  WordExportOptions,
  ImageDocxItem,
} from '../utils/docxExport';
import { exportToExcelFile } from '../utils/excelExport';
import { WordPreview } from './WordPreview';
import { WordPageSetupModal } from './WordPageSetupModal';
import { createSampleKhmerImage } from '../utils/sampleImage';
import { extractKhmerOcr, isStaticHost, getStoredGeminiApiKey } from '../utils/aiOcrService';
import { ApiKeyModal } from './ApiKeyModal';
import { triggerDownload } from '../utils/pdfHelper';

export interface UploadedImageItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  dataUrl: string;
  width: number;
  height: number;
  ocrText?: string;
  ocrStatus: 'idle' | 'loading' | 'success' | 'error';
  ocrError?: string;
  caption?: string;
}

interface ImageToWordPanelProps {
  lang: Language;
  initialFiles?: File[];
  onClearInitialFiles?: () => void;
}

export const ImageToWordPanel: React.FC<ImageToWordPanelProps> = ({
  lang,
  initialFiles,
  onClearInitialFiles,
}) => {
  const isKm = lang === 'km';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Conversion Mode: 'ocr' (AI OCR to Word text & layout) or 'embed' (Embed images directly as Word pages)
  const [conversionMode, setConversionMode] = useState<'ocr' | 'embed'>(() => {
    if (isStaticHost() && !getStoredGeminiApiKey()) {
      return 'embed';
    }
    return 'ocr';
  });
  const [activeView, setActiveView] = useState<'preview' | 'raw'>('preview');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // Images state
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Settings & Options
  const [wordOptions, setWordOptions] = useState<WordExportOptions>(() => {
    let savedDefaults: any = null;
    try {
      const stored = localStorage.getItem('word_page_setup_defaults');
      if (stored) savedDefaults = JSON.parse(stored);
    } catch {
      // ignore
    }

    return {
      title: 'ឯកសាររូបភាព_បម្លែងជាWord',
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
    };
  });

  const [showPageSetupModal, setShowPageSetupModal] = useState<boolean>(false);
  const [embedOriginalImage, setEmbedOriginalImage] = useState<boolean>(true);
  const [pageBreakBetweenImages, setPageBreakBetweenImages] = useState<boolean>(true);
  const [imagesPerPage, setImagesPerPage] = useState<1 | 2 | 'continuous'>(1);

  // Processing state
  const [isBatchOcrRunning, setIsBatchOcrRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [rawEditableText, setRawEditableText] = useState<string>('');

  // Handle incoming initial files from DragDrop or header
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      processFileList(initialFiles);
      if (onClearInitialFiles) onClearInitialFiles();
    }
  }, [initialFiles]);

  // Global paste listener (allows Ctrl+V of images/screenshots)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        processFileList(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Update rawEditableText whenever images' OCR text changes or options change
  useEffect(() => {
    const combined = buildCombinedText(images, embedOriginalImage, pageBreakBetweenImages, isKm);
    setRawEditableText(combined);
  }, [images, embedOriginalImage, pageBreakBetweenImages, isKm]);

  // Read File and extract image metadata
  const processFileList = async (files: File[]) => {
    const newItems: UploadedImageItem[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await readFileAsDataUrl(file);
      const dims = await getImageDimensions(dataUrl);

      newItems.push({
        id: 'img_' + Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        dataUrl,
        width: dims.width,
        height: dims.height,
        ocrStatus: 'idle',
        caption: file.name.replace(/\.[a-zA-Z0-9]+$/, ''),
      });
    }

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
      if (!selectedImageId) {
        setSelectedImageId(newItems[0].id);
      }
    }
  };

  // Run AI OCR on single image
  const runOcrOnImage = async (id: string) => {
    const target = images.find((img) => img.id === id);
    if (!target) return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, ocrStatus: 'loading', ocrError: undefined } : img
      )
    );

    try {
      const ocrRes = await extractKhmerOcr({
        imageBase64: target.dataUrl,
        mimeType: target.file?.type || 'image/png',
        pageNumber: 1,
        preserveLayout: true,
      });

      const extracted = ocrRes.text || '';
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, ocrStatus: 'success', ocrText: extracted, ocrError: undefined } : img
        )
      );
    } catch (err: any) {
      console.error('Image OCR error:', err);
      if (
        err?.code === 'NO_GEMINI_API_KEY' ||
        err?.message === 'NO_GEMINI_API_KEY' ||
        err?.code === 'RATE_LIMIT'
      ) {
        setIsApiKeyModalOpen(true);
      }
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? {
                ...img,
                ocrStatus: 'error',
                ocrError:
                  err?.code === 'RATE_LIMIT'
                    ? (isKm
                        ? `កម្រិត AI Free Tier បានពេញបណ្តោះអាសន្ន (${err.retrySeconds || 25}s)។ សូមរង់ចាំបន្តិច ឬបញ្ចូល Gemini API Key ឥតគិតថ្លៃ។`
                        : `AI Rate limit reached (${err.retrySeconds || 25}s). Please wait or enter your Gemini API Key.`)
                    : err?.code === 'NO_GEMINI_API_KEY'
                    ? (isKm
                        ? 'នៅលើ GitHub Pages៖ សូមបញ្ចូល Gemini API Key ឬប្តូរទៅរបៀប «បង្កប់រូបភាពដើមក្នុង Word»'
                        : 'On GitHub Pages: Please enter a Gemini API Key or switch to Embed Images mode')
                    : (err.message || 'Error running OCR'),
              }
            : img
        )
      );
    }
  };

  // Run AI OCR on pending images in sequence with gentle throttle
  const runBatchOcr = async () => {
    if (images.length === 0 || isBatchOcrRunning) return;

    // Prioritize idle or error images first
    const targetImages = images.filter((img) => img.ocrStatus !== 'success');
    const listToRun = targetImages.length > 0 ? targetImages : images;

    setIsBatchOcrRunning(true);
    setBatchProgress({ current: 0, total: listToRun.length });

    for (let i = 0; i < listToRun.length; i++) {
      setBatchProgress({ current: i + 1, total: listToRun.length });
      await runOcrOnImage(listToRun[i].id);
      // Gentle pause to stay well within free tier RPM limits
      if (i < listToRun.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    setIsBatchOcrRunning(false);
    setBatchProgress(null);
  };

  // Load sample image
  const handleLoadSample = async () => {
    try {
      const sample = await createSampleKhmerImage();
      const sampleItem: UploadedImageItem = {
        id: 'sample_' + Date.now(),
        file: sample.file,
        name: sample.file.name,
        size: sample.file.size,
        dataUrl: sample.dataUrl,
        width: sample.width,
        height: sample.height,
        ocrStatus: 'idle',
        caption: 'លិខិតរដ្ឋបាលគំរូ',
      };

      setImages((prev) => [...prev, sampleItem]);
      setSelectedImageId(sampleItem.id);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    }
  };

  // Move item in order
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setImages(copy);
  };

  // Remove image
  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImageId === id) {
      const remaining = images.filter((img) => img.id !== id);
      setSelectedImageId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Copy extracted text
  const handleCopyText = async () => {
    if (!rawEditableText) return;
    try {
      await navigator.clipboard.writeText(rawEditableText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  // Export to Word (.docx)
  const handleExportWord = async () => {
    if (images.length === 0) return;
    setIsExportingWord(true);

    try {
      let docxBlob: Blob;

      if (conversionMode === 'ocr') {
        // Generate from transcribed text with Page Setup layout
        const textToExport = rawEditableText.trim();
        if (!textToExport) {
          alert(
            isKm
              ? 'សូមចុច "ស្រង់អក្សររូបភាព" ជាមុនសិន ឬប្តូរទៅជា Mode "បង្កប់រូបភាពផ្ទាល់"!'
              : 'Please run AI OCR first or switch to "Embed Images" mode!'
          );
          setIsExportingWord(false);
          return;
        }

        docxBlob = await createWordDocumentFromText(textToExport, {
          ...wordOptions,
          title: wordOptions.title || 'ឯកសាររូបភាព_Word',
        });
      } else {
        // Direct image document compilation with exact Page Setup
        const docxImages: ImageDocxItem[] = images.map((img) => ({
          name: img.name,
          dataUrl: img.dataUrl,
          caption: img.caption,
          width: img.width,
          height: img.height,
        }));

        docxBlob = await createWordDocumentFromImages(docxImages, {
          ...wordOptions,
          title: wordOptions.title || 'រូបភាព_Word',
          imagesPerPage,
        });
      }

      const downloadName = `${wordOptions.title || 'ឯកសាររូបភាព_Word'}.docx`;
      triggerDownload(docxBlob, downloadName);
    } catch (err: any) {
      console.error('Word export error:', err);
      alert((isKm ? 'បរាជ័យក្នុងការបង្កើតឯកសារ Word: ' : 'Failed to export Word document: ') + err.message);
    } finally {
      setIsExportingWord(false);
    }
  };

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const textToExport = rawEditableText.trim();
    if (!textToExport) {
      alert(
        isKm
          ? 'សូមចុច "ស្រង់អក្សររូបភាព" ជាមុនសិនដើម្បីបង្កើតទិន្នន័យ Excel!'
          : 'Please extract text from images via OCR first before exporting to Excel!'
      );
      return;
    }

    setIsExportingExcel(true);
    try {
      const titleName = wordOptions.title || 'ឯកសាររូបភាព_ទិន្នន័យ';
      const excelResult = exportToExcelFile(textToExport, `${titleName}.xlsx`);
      triggerDownload(
        excelResult.blob,
        excelResult.fileName,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    } catch (err: any) {
      console.error('Excel export error:', err);
      alert((isKm ? 'បរាជ័យក្នុងការបង្កើតឯកសារ Excel: ' : 'Failed to export Excel spreadsheet: ') + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const hasTranscribedText = images.some((img) => !!img.ocrText);
  const selectedImage = images.find((img) => img.id === selectedImageId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner & Mode Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-2xs">
                <FileImage className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {isKm ? 'បម្លែងរូបភាពទៅជា Word (.docx)' : 'Convert Images to Word (.docx)'}
              </h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {isKm ? 'Page Setup 0.69"/0.59"' : 'Page Setup'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              {isKm
                ? 'ស្រង់អក្សរខ្មែរ រក្សាម៉ូដអក្សរមូល និងតារាងពីរូបភាព ឬបង្កប់រូបភាពជាទំព័រឯកសារ Word ជាមួយរឹម Top 0.69", Bottom/Left/Right 0.59"'
                : 'Extract Khmer text & tables via AI OCR or compile images cleanly into a Word document with Page Setup'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Page Setup Button (Opens Modal) */}
            <button
              id="btn-image-page-setup"
              onClick={() => setShowPageSetupModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title={isKm ? 'កំណត់ទំព័រ (Page Setup): រឹម Top 0.69", Bottom/Left/Right 0.59"' : 'Word Page Setup (Margins, Paper, Layout)'}
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>{isKm ? 'កំណត់ទំព័រ (Page Setup)' : 'Page Setup'}</span>
              <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1 py-0.2 rounded font-mono font-normal">
                {wordOptions.customMargins
                  ? `${wordOptions.customMargins.top}"/${wordOptions.customMargins.bottom}"`
                  : '0.69"/0.59"'}
              </span>
            </button>

            {/* Try Sample Image Button */}
            <button
              id="btn-load-sample-image"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isKm ? 'សាកល្បងរូបភាពគំរូ' : 'Try Sample Image'}</span>
            </button>
          </div>
        </div>

        {/* Mode Toggle Pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setConversionMode('ocr')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                conversionMode === 'ocr'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{isKm ? '១. ស្រង់អក្សររូបភាពជា Word (AI OCR)' : '1. AI OCR to Word'}</span>
            </button>

            <button
              onClick={() => setConversionMode('embed')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                conversionMode === 'embed'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isKm ? '២. បង្កប់រូបភាពជាឯកសារ Word' : '2. Embed Images in Word'}</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>
              {isKm ? `រូបភាពសរុប ៖ ${images.length} សន្លឹក` : `Total Images: ${images.length}`}
            </span>
            {conversionMode === 'ocr' && hasTranscribedText && (
              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {isKm ? '✓ បានស្រង់អក្សរ' : '✓ Transcribed'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Upload & List, Right Preview & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Images List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files) {
                processFileList(Array.from(e.dataTransfer.files));
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/80 ring-4 ring-blue-100'
                : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  processFileList(Array.from(e.target.files));
                }
              }}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                if (e.target.files) {
                  processFileList(Array.from(e.target.files));
                }
              }}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {isKm ? 'ចុច ឬទម្លាក់រូបភាពនៅទីនេះ' : 'Click or drop images here'}
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
              {isKm
                ? 'គាំទ្រ JPG, PNG, WebP ឬចុចបញ្ជា Ctrl+V ដើម្បីបិទភ្ជាប់ពីរូបថតអេក្រង់'
                : 'Supports JPG, PNG, WebP or press Ctrl+V to paste screenshot'}
            </p>

            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                <Plus className="w-3 h-3 text-blue-600" />
                {isKm ? 'ជ្រើសរើសរូប' : 'Add Files'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3 text-emerald-600" />
                {isKm ? 'ថតរូប (Camera)' : 'Camera'}
              </button>
            </div>
          </div>

          {/* Uploaded Images List */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                {isKm ? 'បញ្ជីរូបភាពដែលបានបញ្ចូល' : 'Image Queue'} ({images.length})
              </span>

              {images.length > 0 && (
                <button
                  onClick={() => setImages([])}
                  className="text-[11px] text-red-600 hover:text-red-700 font-medium cursor-pointer"
                >
                  {isKm ? 'លុបទាំងអស់' : 'Clear All'}
                </button>
              )}
            </div>

            {images.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">
                  {isKm ? 'មិនទាន់មានរូបភាពនៅឡើយទេ' : 'No images added yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {images.map((img, idx) => {
                  const isSelected = selectedImageId === img.id;

                  return (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImageId(img.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative">
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-slate-900/80 text-[9px] text-white px-1 font-mono rounded-tl">
                          {idx + 1}
                        </span>
                      </div>

                      {/* Info & OCR Status */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={img.name}>
                          {img.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {img.width}x{img.height} • {(img.size / 1024).toFixed(1)} KB
                        </p>

                        {/* Status Badge */}
                        <div className="mt-1 flex items-center gap-1 text-[10px]">
                          {img.ocrStatus === 'loading' && (
                            <span className="text-blue-600 flex items-center gap-1 font-medium">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              {isKm ? 'កំពុងស្រង់អក្សរ...' : 'Extracting OCR...'}
                            </span>
                          )}
                          {img.ocrStatus === 'success' && (
                            <span className="text-emerald-600 flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {isKm ? 'បានស្រង់អក្សររួច' : 'Transcribed'}
                            </span>
                          )}
                          {img.ocrStatus === 'error' && (
                            <div className="flex flex-col gap-1 mt-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-red-600 flex items-center gap-1 font-bold text-[10px]">
                                  <AlertCircle className="w-2.5 h-2.5 text-red-500 shrink-0" />
                                  {isKm ? 'បរាជ័យ' : 'Failed'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    runOcrOnImage(img.id);
                                  }}
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded cursor-pointer inline-flex items-center gap-1 transition-colors shadow-2xs"
                                  title={isKm ? 'សាកល្បងស្រង់អក្សរម្តងទៀត' : 'Retry OCR'}
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>{isKm ? 'សាកល្បងម្តងទៀត' : 'Retry'}</span>
                                </button>
                              </div>
                              {img.ocrError && (
                                <p className="text-[10px] text-red-700 bg-red-50/80 p-1.5 rounded-md border border-red-200/70 leading-relaxed font-normal">
                                  {img.ocrError}
                                </p>
                              )}
                            </div>
                          )}
                          {img.ocrStatus === 'idle' && conversionMode === 'ocr' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                runOcrOnImage(img.id);
                              }}
                              className="text-blue-600 hover:underline font-medium cursor-pointer"
                            >
                              {isKm ? '⚡ ស្រង់អក្សរ' : '⚡ Run OCR'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Actions: Reorder & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveImage(idx, 'up');
                          }}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveImage(idx, 'down');
                          }}
                          disabled={idx === images.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(img.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Helpful Banner on OCR Error */}
            {conversionMode === 'ocr' && images.some((img) => img.ocrStatus === 'error') && (
              <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2 shadow-2xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="font-bold text-[11px] text-amber-900">
                      {isKm ? 'ព័ត៌មានជំនួយ ៖ មិនអាចស្រង់អក្សរ AI បាន?' : 'Tip: OCR transcription issue?'}
                    </p>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      {isKm
                        ? 'ប្រសិនបើអ្នកកំពុងប្រើលើ GitHub Pages ឬ AI លើសកូតា សូមប្តូរទៅរបៀប «បង្កប់រូបភាពដើមក្នុង Word» ដើម្បីទាញយកឯកសារ Word (.docx) ដោយជោគជ័យ ១០០% ភ្លាមៗ!'
                        : 'If running on GitHub Pages or AI quota is limited, switch to "Embed Original Images" mode to compile into Word (.docx) with 100% success rate!'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConversionMode('embed')}
                  className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isKm ? '👉 ប្តូរទៅរបៀប «បង្កប់រូបភាពក្នុង Word» ភ្លាមៗ (១០០% ជោគជ័យ)' : '👉 Switch to Embed Mode (100% Success)'}</span>
                </button>
              </div>
            )}

            {/* Batch OCR Button for OCR mode */}
            {conversionMode === 'ocr' && images.length > 0 && (
              <button
                onClick={runBatchOcr}
                disabled={isBatchOcrRunning}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isBatchOcrRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {isKm
                        ? `កំពុងដំណើរការ OCR (${batchProgress?.current}/${batchProgress?.total})...`
                        : `Processing OCR (${batchProgress?.current}/${batchProgress?.total})...`}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isKm
                        ? `ស្រង់អក្សររូបភាពទាំងអស់ (${images.length} សន្លឹក)`
                        : `Extract Text from All Images (${images.length})`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Preview, Layout Config & Export (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Bar for Right Column: View switches & Export button */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {conversionMode === 'ocr' ? (
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveView('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'preview'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKm ? 'ផ្ទាំងមើល Word (Preview)' : 'Word Preview'}</span>
                </button>
                <button
                  onClick={() => setActiveView('raw')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'raw'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isKm ? 'កែសម្រួលអត្ថបទ (Raw Text)' : 'Raw Editor'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {isKm ? 'ប្លង់រូបភាពក្នុង Word ៖' : 'Images per page:'}
                </span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                  {[
                    { id: 1, label: isKm ? '១ សន្លឹក/ទំព័រ' : '1/Page' },
                    { id: 2, label: isKm ? '២ សន្លឹក/ទំព័រ' : '2/Page' },
                    { id: 'continuous', label: isKm ? 'បន្តបន្ទាប់' : 'Continuous' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setImagesPerPage(item.id as any)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        imagesPerPage === item.id
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Copy text button */}
              {conversionMode === 'ocr' && (
                <button
                  onClick={handleCopyText}
                  disabled={!rawEditableText}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                  title="Copy Text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isKm ? 'បានចម្លង!' : 'Copied!') : isKm ? 'ចម្លង' : 'Copy'}</span>
                </button>
              )}

              {/* Main Export Word Button */}
              <button
                id="btn-export-image-to-word"
                onClick={handleExportWord}
                disabled={isExportingWord || images.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isExportingWord ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isKm ? 'កំពុងបង្កើត Word...' : 'Exporting...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{isKm ? 'ទាញយកជា Word (.docx)' : 'Download Word (.docx)'}</span>
                  </>
                )}
              </button>

              {/* Main Export Excel Button */}
              {conversionMode === 'ocr' && (
                <button
                  id="btn-export-image-to-excel"
                  onClick={handleExportExcel}
                  disabled={isExportingExcel || !rawEditableText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title={isKm ? 'ទាញយកតារាង និងទិន្នន័យជាឯកសារ Excel (.xlsx)' : 'Export extracted tables & data to Excel (.xlsx)'}
                >
                  {isExportingExcel ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isKm ? 'កំពុងបង្កើត Excel...' : 'Creating Excel...'}</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isKm ? 'ទាញយកជា Excel (.xlsx)' : 'Download Excel (.xlsx)'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Additional Options Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-4 flex-wrap">
              {conversionMode === 'ocr' && (
                <>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={embedOriginalImage}
                      onChange={(e) => setEmbedOriginalImage(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>{isKm ? 'បង្កប់រូបភាពដើមក្នុង Word' : 'Embed original image in Word'}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pageBreakBetweenImages}
                      onChange={(e) => setPageBreakBetweenImages(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>{isKm ? 'កាត់ទំព័រថ្មីរវាងរូបភាពនីមួយៗ' : 'Page break per image'}</span>
                  </label>
                </>
              )}
            </div>

            {/* Document Title input */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">{isKm ? 'ឈ្មោះឯកសារ ៖' : 'Title:'}</span>
              <input
                type="text"
                value={wordOptions.title || ''}
                onChange={(e) => setWordOptions((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none w-48"
              />
            </div>
          </div>

          {/* Main Display Area (Preview or Raw Text) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden min-h-[520px]">
            {conversionMode === 'ocr' ? (
              activeView === 'preview' ? (
                <div className="p-4 sm:p-6 bg-slate-100/60 max-h-[640px] overflow-y-auto">
                  {rawEditableText.trim() ? (
                    <WordPreview
                      rawText={rawEditableText}
                      isKm={isKm}
                      options={wordOptions}
                      onOptionsChange={(newOpts) => setWordOptions((prev) => ({ ...prev, ...newOpts }))}
                      onDownloadDocx={handleExportWord}
                      onDownloadExcel={handleExportExcel}
                      isDownloading={isExportingWord}
                    />
                  ) : (
                    <div className="py-20 text-center text-slate-400">
                      <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40 text-blue-500" />
                      <h4 className="text-sm font-bold text-slate-700 mb-1">
                        {isKm ? 'មិនទាន់មានអត្ថបទស្រង់ចេញនៅឡើយទេ' : 'No OCR text extracted yet'}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                        {isKm
                          ? 'សូមចុចលើប៊ូតុង "ស្រង់អក្សររូបភាពទាំងអស់" នៅជួរខាងឆ្វេង ដើម្បីអោយ AI ស្គាល់អក្សរ និងតារាង'
                          : 'Click "Extract Text from All Images" on the left panel to run AI OCR on your uploaded images'}
                      </p>
                      {images.length > 0 && (
                        <button
                          onClick={runBatchOcr}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{isKm ? 'ដំណើរការ AI OCR ឥឡូវនេះ' : 'Run AI OCR Now'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      {isKm ? 'កែសម្រួលអត្ថបទ & ទ្រង់ទ្រាយដោយផ្ទាល់ ៖' : 'Direct Text & Tag Editor:'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isKm ? 'គាំទ្រ [muol], :::header-layout, Markdown tables' : 'Supports [muol], :::header-layout, Markdown'}
                    </span>
                  </div>
                  <textarea
                    value={rawEditableText}
                    onChange={(e) => setRawEditableText(e.target.value)}
                    rows={20}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={isKm ? 'អត្ថបទដែលបានស្រង់ចេញនឹងបង្ហាញនៅទីនេះ...' : 'Extracted text will appear here...'}
                  />
                </div>
              )
            ) : (
              /* Embed Mode Preview */
              <div className="p-6 bg-slate-100/60 max-h-[640px] overflow-y-auto space-y-6">
                {images.length === 0 ? (
                  <div className="py-24 text-center text-slate-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-600" />
                    <h4 className="text-sm font-bold text-slate-700 mb-1">
                      {isKm ? 'សូមបញ្ចូលរូបភាពដើម្បីបង្កើតជាទំព័រ Word' : 'Upload images to compile into Word'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isKm
                        ? 'រូបភាពនឹងត្រូវបានរៀបចំក្នុងទំព័រ Word ជាមួយរឹម Top 0.69", Bottom/Left/Right 0.59"'
                        : 'Images will be neatly framed in Word matching Page Setup: Top 0.69", Bottom/Left/Right 0.59"'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 text-slate-600">
                          <span className="font-bold">
                            {isKm ? `ទំព័រទី ${idx + 1} ៖ ${img.name}` : `Page ${idx + 1}: ${img.name}`}
                          </span>
                          <span>
                            {img.width} × {img.height} px
                          </span>
                        </div>

                        <div className="flex justify-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <img
                            src={img.dataUrl}
                            alt={img.name}
                            className="max-h-[380px] max-w-full object-contain rounded"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] font-bold text-slate-500">
                            {isKm ? 'ចំណងជើងរូបភាព ៖' : 'Caption:'}
                          </span>
                          <input
                            type="text"
                            value={img.caption || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setImages((prev) =>
                                prev.map((item) => (item.id === img.id ? { ...item, caption: val } : item))
                              );
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={isKm ? 'បញ្ចូលចំណងជើងក្រោមរូបភាព...' : 'Enter caption for image in Word...'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Word Page Setup Dialog */}
      <WordPageSetupModal
        isOpen={showPageSetupModal}
        onClose={() => setShowPageSetupModal(false)}
        options={wordOptions}
        onOptionsChange={(newOpts) => setWordOptions((prev) => ({ ...prev, ...newOpts }))}
        isKm={isKm}
      />

      {/* Gemini API Key Modal for GitHub Pages / Client Execution */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        lang={lang}
        onSwitchToNative={() => setConversionMode('embed')}
        onSaved={() => {
          if (selectedImageId) runOcrOnImage(selectedImageId);
        }}
      />
    </div>
  );
};

// Helper to construct combined markdown text from multiple images
function buildCombinedText(
  images: UploadedImageItem[],
  embedImage: boolean,
  pageBreak: boolean,
  isKm: boolean
): string {
  if (images.length === 0) return '';

  const chunks: string[] = [];

  images.forEach((img, idx) => {
    const parts: string[] = [];

    if (idx > 0 && pageBreak) {
      parts.push(`--- [ទំព័រទី ${idx + 1}] ---`);
    }

    // Embed original image if enabled
    if (embedImage && img.dataUrl) {
      parts.push(`:::image\n${img.dataUrl}\n:::`);
    }

    if (img.ocrText && img.ocrText.trim()) {
      parts.push(img.ocrText.trim());
    } else {
      parts.push(
        isKm
          ? `[center]**${img.name}**[/center]\n*(មិនទាន់បានស្រង់អក្សរទេ - សូមចុច "ស្រង់អក្សរ")*`
          : `[center]**${img.name}**[/center]\n*(No OCR text extracted yet - click "Run OCR")*`
      );
    }

    chunks.push(parts.join('\n\n'));
  });

  return chunks.join('\n\n');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 });
    };
    img.src = dataUrl;
  });
}
