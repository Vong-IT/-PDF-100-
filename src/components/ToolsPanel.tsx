import React, { useState } from 'react';
import {
  Layers,
  FileImage,
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  FileText,
  CheckCircle,
  FileCheck2,
} from 'lucide-react';
import type { Language } from '../types';
import { mergePdfDocuments, convertImagesToPdf, triggerDownload } from '../utils/pdfHelper';
import { ImageToWordPanel } from './ImageToWordPanel';

interface ToolsPanelProps {
  lang: Language;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ lang }) => {
  const isKm = lang === 'km';
  const [toolMode, setToolMode] = useState<'merge' | 'img2pdf' | 'img2word'>('merge');

  // Merge state
  const [pdfFiles, setPdfFiles] = useState<{ name: string; data: Uint8Array; size: number }[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  // Image to PDF state
  const [images, setImages] = useState<{ name: string; data: Uint8Array; mimeType: string; previewUrl: string }[]>([]);
  const [isConvertingImg, setIsConvertingImg] = useState(false);

  // Handle PDF additions for Merge
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: { name: string; data: Uint8Array; size: number }[] = [];
    for (const file of Array.from(e.target.files)) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        newFiles.push({
          name: file.name,
          data: new Uint8Array(buffer),
          size: file.size,
        });
      }
    }
    setPdfFiles((prev) => [...prev, ...newFiles]);
  };

  // Move PDF item in list
  const movePdf = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pdfFiles.length) return;
    const copy = [...pdfFiles];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setPdfFiles(copy);
  };

  // Remove PDF
  const removePdf = (index: number) => {
    setPdfFiles(pdfFiles.filter((_, i) => i !== index));
  };

  // Run Merge
  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      alert(isKm ? 'សូមជ្រើសរើសយ៉ាងហោចណាស់ ២ ឯកសារ PDF!' : 'Please select at least 2 PDF files to merge!');
      return;
    }
    try {
      setIsMerging(true);
      const mergedBytes = await mergePdfDocuments(pdfFiles);
      triggerDownload(mergedBytes, 'merged_document.pdf');
    } catch (e: any) {
      alert(e.message || 'Failed to merge documents');
    } finally {
      setIsMerging(false);
    }
  };

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newImgs: { name: string; data: Uint8Array; mimeType: string; previewUrl: string }[] = [];
    for (const file of Array.from(e.target.files)) {
      if (file.type.startsWith('image/')) {
        const buffer = await file.arrayBuffer();
        const previewUrl = URL.createObjectURL(file);
        newImgs.push({
          name: file.name,
          data: new Uint8Array(buffer),
          mimeType: file.type,
          previewUrl,
        });
      }
    }
    setImages((prev) => [...prev, ...newImgs]);
  };

  // Move Image item
  const moveImg = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setImages(copy);
  };

  // Remove Image
  const removeImg = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Run Image to PDF
  const handleConvertImagesToPdf = async () => {
    if (images.length === 0) {
      alert(isKm ? 'សូមបញ្ចូលរូបភាពយ៉ាងហោចណាស់ ១ សន្លឹក!' : 'Please select at least 1 image!');
      return;
    }
    try {
      setIsConvertingImg(true);
      const pdfBytes = await convertImagesToPdf(images);
      triggerDownload(pdfBytes, 'images_compiled.pdf');
    } catch (e: any) {
      alert(e.message || 'Failed to compile images to PDF');
    } finally {
      setIsConvertingImg(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Tool Navigation */}
      <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl mb-6 max-w-xl">
        <button
          onClick={() => setToolMode('merge')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            toolMode === 'merge' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>{isKm ? 'បញ្ចូល PDF (Merge)' : 'Merge PDFs'}</span>
        </button>

        <button
          onClick={() => setToolMode('img2pdf')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            toolMode === 'img2pdf' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileImage className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isKm ? 'រូបភាពទៅជា PDF' : 'Images to PDF'}</span>
        </button>

        <button
          onClick={() => setToolMode('img2word')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            toolMode === 'img2word' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-sky-600" />
          <span>{isKm ? 'រូបភាពទៅជា Word' : 'Images to Word'}</span>
        </button>
      </div>

      {/* 0. IMAGE TO WORD */}
      {toolMode === 'img2word' && <ImageToWordPanel lang={lang} />}

      {/* 1. MERGE PDFS */}
      {toolMode === 'merge' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isKm ? 'បញ្ចូលឯកសារ PDF ច្រើនចូលគ្នាតែមួយ' : 'Combine Multiple PDFs'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isKm
                    ? 'ជ្រើសរើសឯកសារ PDF ២ ឬច្រើន រៀបចំលំដាប់លំដោយទំព័រ រួចបញ្ចូលគ្នា'
                    : 'Select 2 or more PDFs, arrange them in order, and merge into one single file.'}
                </p>
              </div>

              <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0">
                <Plus className="w-4 h-4" />
                <span>{isKm ? 'បន្ថែមឯកសារ PDF' : 'Add PDF Files'}</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* List of files */}
            {pdfFiles.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {isKm ? 'មិនទាន់មានឯកសារនៅឡើយទេ។ សូមចុច "បន្ថែមឯកសារ PDF"' : 'No files added yet. Click "Add PDF Files" to start.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {pdfFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block truncate max-w-[280px]">
                          {file.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => movePdf(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => movePdf(idx, 'down')}
                        disabled={idx === pdfFiles.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removePdf(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer ml-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pdfFiles.length >= 2 && (
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  id="btn-merge-download"
                  onClick={handleMerge}
                  disabled={isMerging}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isKm
                      ? `បញ្ចូលឯកសារទាំង ${pdfFiles.length} និងទាញយក`
                      : `Merge & Download (${pdfFiles.length} files)`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. IMAGES TO PDF */}
      {toolMode === 'img2pdf' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isKm ? 'បម្លែងរូបភាពទៅជាឯកសារ PDF' : 'Convert Images to PDF'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isKm
                    ? 'ជ្រើសរើសរូបភាព (PNG, JPG) ដើម្បីចងក្រងជាសៀវភៅ ឬឯកសារ PDF តែមួយ'
                    : 'Select images (PNG, JPG) and compile them into a unified PDF document.'}
                </p>
              </div>

              <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0">
                <Plus className="w-4 h-4" />
                <span>{isKm ? 'ជ្រើសរើសរូបភាព' : 'Add Images'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* List of images */}
            {images.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <FileImage className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {isKm ? 'មិនទាន់មានរូបភាពនៅឡើយទេ។ សូមចុច "ជ្រើសរើសរូបភាព"' : 'No images added yet. Click "Add Images" to start.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-col items-center relative group"
                  >
                    <div className="w-full aspect-[1/1] rounded-lg overflow-hidden bg-white mb-2 flex items-center justify-center">
                      <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 truncate w-full text-center">
                      {idx + 1}. {img.name}
                    </span>

                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() => moveImg(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveImg(idx, 'down')}
                        disabled={idx === images.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeImg(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  id="btn-img2pdf-download"
                  onClick={handleConvertImagesToPdf}
                  disabled={isConvertingImg}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isKm
                      ? `បម្លែងរូបទាំង ${images.length} ទៅជា PDF & ទាញយក`
                      : `Compile to PDF & Download (${images.length} images)`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
