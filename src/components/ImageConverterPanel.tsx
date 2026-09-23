import React, { useState, useEffect, useRef } from 'react';
import {
  FileImage,
  Download,
  Archive,
  Layers,
  Sparkles,
  CheckCircle,
  Eye,
  Sliders,
  ZoomIn,
} from 'lucide-react';
import JSZip from 'jszip';
import type { Language, ImageFormat, ImageConvertOptions } from '../types';
import { renderPageToCanvas, canvasToBlob, triggerDownload } from '../utils/pdfHelper';

interface ImageConverterPanelProps {
  lang: Language;
  pdfDoc: any;
  totalPages: number;
  currentPage: number;
  fileName: string;
}

export const ImageConverterPanel: React.FC<ImageConverterPanelProps> = ({
  lang,
  pdfDoc,
  totalPages,
  currentPage,
  fileName,
}) => {
  const isKm = lang === 'km';

  const [format, setFormat] = useState<ImageFormat>('png');
  const [scale, setScale] = useState<number>(2); // 2x = 150-200 DPI, 3x = 300 DPI
  const [quality, setQuality] = useState<number>(0.92);
  const [targetPage, setTargetPage] = useState<number>(currentPage);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewDims, setPreviewDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Synchronize targetPage with parent currentPage initially
  useEffect(() => {
    setTargetPage(currentPage);
  }, [currentPage]);

  // Generate preview of selected page with current settings
  useEffect(() => {
    let isCancelled = false;
    async function updatePreview() {
      if (!pdfDoc) return;
      setIsGenerating(true);
      try {
        const { canvas, width, height } = await renderPageToCanvas(pdfDoc, targetPage, scale);
        if (isCancelled) return;
        setPreviewDims({ width, height });

        const blob = await canvasToBlob(canvas, format, quality);
        if (isCancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (e) {
        console.error('Error generating preview:', e);
      } finally {
        if (!isCancelled) setIsGenerating(false);
      }
    }

    updatePreview();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, targetPage, scale, format, quality]);

  // Download Single Page Image
  const handleDownloadSingle = async () => {
    if (!pdfDoc) return;
    try {
      setIsGenerating(true);
      const { canvas } = await renderPageToCanvas(pdfDoc, targetPage, scale);
      const blob = await canvasToBlob(canvas, format, quality);
      const cleanName = fileName.replace(/\.pdf$/i, '');
      const ext = format === 'jpeg' ? 'jpg' : format;
      triggerDownload(blob, `${cleanName}_page_${targetPage}_${scale}x.${ext}`, blob.type);
    } catch (e: any) {
      alert(e.message || 'Failed to export image');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download All Pages as ZIP
  const handleDownloadAllZip = async () => {
    if (!pdfDoc) return;
    try {
      setIsGenerating(true);
      setBatchProgress({ current: 0, total: totalPages });
      const zip = new JSZip();
      const cleanName = fileName.replace(/\.pdf$/i, '');
      const ext = format === 'jpeg' ? 'jpg' : format;

      for (let i = 1; i <= totalPages; i++) {
        setBatchProgress({ current: i, total: totalPages });
        const { canvas } = await renderPageToCanvas(pdfDoc, i, scale);
        const blob = await canvasToBlob(canvas, format, quality);
        const padIndex = String(i).padStart(3, '0');
        zip.file(`${cleanName}_page_${padIndex}.${ext}`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, `${cleanName}_images_${scale}x.zip`, 'application/zip');
    } catch (e: any) {
      alert(e.message || 'Failed to export ZIP archive');
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileImage className="w-5 h-5 text-emerald-600" />
            <span>{isKm ? 'បម្លែង PDF ទៅជារូបភាពគុណភាពខ្ពស់' : 'Convert PDF to High-Resolution Images'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {isKm
              ? 'បម្លែងរហ័ស ធានាមិនខុសជើងអក្សរខ្មែរ រក្សាគម្លាត និងទ្រង់ទ្រាយដើម ១០០%'
              : 'Lossless multi-DPI export preserving Khmer ligatures, subscripts, and layouts'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-download-single-image"
            disabled={isGenerating}
            onClick={handleDownloadSingle}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {isKm
                ? `ទាញយករូបភាពទំព័រទី ${targetPage}`
                : `Download Page ${targetPage} (${format.toUpperCase()})`}
            </span>
          </button>

          <button
            id="btn-download-all-zip"
            disabled={isGenerating}
            onClick={handleDownloadAllZip}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4 text-emerald-400" />
            <span>
              {isKm
                ? `ទាញយកទាំងអស់ជា ZIP (${totalPages} ទំព័រ)`
                : `Download All as ZIP (${totalPages} Pages)`}
            </span>
          </button>
        </div>
      </div>

      {/* Progress Bar for Batch */}
      {batchProgress && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
          <div className="flex justify-between text-xs font-semibold text-emerald-900 mb-2">
            <span>
              {isKm
                ? `កំពុងបម្លែងទំព័រ ${batchProgress.current} នៃ ${batchProgress.total}...`
                : `Converting page ${batchProgress.current} of ${batchProgress.total}...`}
            </span>
            <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-200"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Layout Grid: Settings Sidebar + Live Image Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-5">
          {/* Format Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
              {isKm ? 'ទម្រង់រូបភាព (Image Format)' : 'Image Format'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['png', 'jpeg', 'webp'] as ImageFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    format === fmt
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {fmt === 'png' ? 'PNG (Lossless)' : fmt === 'jpeg' ? 'JPEG (Photo)' : 'WebP (Modern)'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {format === 'png'
                ? isKm
                  ? '✓ PNG ផ្តល់ភាពច្បាស់បំផុតសម្រាប់អក្សរខ្មែរ និងជើងព្យញ្ជនៈ មិនបែកព្រាលឡើយ'
                  : '✓ PNG is recommended for razor-sharp typography and crisp Khmer scripts'
                : format === 'jpeg'
                ? isKm
                  ? 'ទំហំឯកសារស្រាល ស័ក្តិសមសម្រាប់ឯកសារមានរូបភាពច្រើន'
                  : 'Smaller file size, ideal for picture-heavy documents'
                : isKm
                ? 'ទម្រង់សម័យទំនើប មានទំហំស្រាល និងគុណភាពខ្ពស់'
                : 'Modern Web format offering optimal compression'}
            </p>
          </div>

          {/* Resolution / DPI Scaling */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
              {isKm ? 'កម្រិតគុណភាពច្បាស់ (Resolution & DPI)' : 'Resolution & Sharpness'}
            </label>
            <div className="space-y-2">
              {[
                { val: 1, label: isKm ? '1x (72-96 DPI — ទំហំធម្មតា)' : '1x (Standard 72-96 DPI)' },
                { val: 2, label: isKm ? '2x (150-200 DPI — ច្បាស់ខ្លាំង)' : '2x (High Sharpness 150-200 DPI)' },
                { val: 3, label: isKm ? '3x (300 DPI — Ultra HD ច្បាស់ឥតខ្ចោះ)' : '3x (Ultra HD 300 DPI — Lossless)' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setScale(opt.val)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                    scale === opt.val
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{opt.label}</span>
                  {scale === opt.val && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider for JPEG / WebP */}
          {format !== 'png' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {isKm ? 'គុណភាពរូបភាព (Quality)' : 'Compression Quality'}
                </label>
                <span className="text-xs font-bold text-emerald-700">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.02"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          )}

          {/* Page Picker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
              {isKm ? 'ជ្រើសរើសទំព័រដើម្បីមើលគំរូ' : 'Preview Page'}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={totalPages}
                value={targetPage}
                onChange={(e) => setTargetPage(parseInt(e.target.value))}
                className="flex-1 accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                {targetPage} / {totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {isKm
                  ? `ទិដ្ឋភាពជាក់ស្តែងទំព័រទី ${targetPage} (${previewDims.width} × ${previewDims.height} ភីកសែល)`
                  : `Live Preview — Page ${targetPage} (${previewDims.width} × ${previewDims.height}px)`}
              </span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {format.toUpperCase()} @ {scale}x
            </span>
          </div>

          <div className="flex-1 min-h-[420px] bg-slate-50 border border-slate-200 rounded-xl overflow-auto p-4 flex items-center justify-center relative">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-slate-600">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">
                  {isKm ? 'កំពុងបង្កើតរូបភាពច្បាស់ក្រឡែត...' : 'Rendering sharp image...'}
                </span>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={`Preview page ${targetPage}`}
                className="max-h-[600px] w-auto shadow-md rounded border border-slate-300 object-contain"
              />
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              {isKm
                ? '★ គន្លឹះ៖ កម្រិត 3x ត្រូវបានណែនាំសម្រាប់ការបោះពុម្ព ឬដាក់បញ្ចូលក្នុងបទបង្ហាញផ្លូវការ។'
                : '★ Tip: 3x resolution ensures 100% vector-level clarity on high-DPI displays & print.'}
            </span>
            <button
              onClick={handleDownloadSingle}
              className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isKm ? 'ទាញយករូបនេះ' : 'Download this image'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
