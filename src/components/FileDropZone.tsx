import React, { useRef, useState } from 'react';
import { Upload, FileUp, Sparkles, Shield, Lock, FileImage, FileText, CheckCircle2 } from 'lucide-react';
import type { Language } from '../types';

interface FileDropZoneProps {
  lang: Language;
  onFileSelected: (file: File) => void;
  onImageSelected?: (file: File) => void;
  onOpenSample: () => void;
  onOpenImageToWord?: () => void;
  isLoading: boolean;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  lang,
  onFileSelected,
  onImageSelected,
  onOpenSample,
  onOpenImageToWord,
  isLoading,
}) => {
  const isKm = lang === 'km';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        onFileSelected(file);
      } else if (file.type.startsWith('image/')) {
        if (onImageSelected) {
          onImageSelected(file);
        } else {
          alert(isKm ? 'សូមប្រើប្រាស់ផ្ទាំង "រូបភាពទៅជា Word"!' : 'Please use the "Image to Word" panel!');
        }
      } else {
        alert(isKm ? 'សូមជ្រើសរើសឯកសារ PDF ឬរូបភាព!' : 'Please select a valid PDF or Image file!');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        onFileSelected(file);
      } else if (file.type.startsWith('image/') && onImageSelected) {
        onImageSelected(file);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Presentation */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-4">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>
            {isKm
              ? 'បច្ចេកវិទ្យាការពារទិន្នន័យឯកជនភាព និងរក្សាអក្សរសាស្ត្រខ្មែរ ១០០%'
              : '100% Private Document Processing & Khmer Typography Preservation'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
          {isKm
            ? 'គ្រប់គ្រង PDF បម្លែងជារូបភាព ឬអត្ថបទរហ័ស & សុវត្ថិភាព'
            : 'Fast, Lossless PDF Management & Security Suite'}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {isKm
            ? 'បម្លែងទៅជារូបភាពច្បាស់ក្រឡែត (Ultra HD) ឬស្រង់អត្ថបទដោយមិនខុសជើងអក្សរ និងចាក់សោការពារឯកសារដោយលេខសម្ងាត់ខ្លាំងក្លា។'
            : 'Convert to ultra-sharp images, extract text with zero broken subscripts, and lock documents with password encryption.'}
        </p>
      </div>

      {/* Drop Zone Box */}
      <div
        id="dropzone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/80 ring-4 ring-blue-100'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/70 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf,image/*"
          onChange={handleInputChange}
          className="hidden"
          id="file-input"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <FileUp className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {isKm ? 'អូសទម្លាក់ឯកសារ PDF ឬរូបភាពនៅទីនេះ' : 'Drag & Drop your PDF or Images here'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            {isKm ? 'គាំទ្រឯកសារ PDF ឬរូបភាព PNG, JPG, WebP ដើម្បីបម្លែងជា Word' : 'Supports PDF files or PNG, JPG, WebP images to convert to Word'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="btn-choose-file"
              type="button"
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isKm ? 'ជ្រើសរើសឯកសារ' : 'Select File'}</span>
            </button>

            {onOpenImageToWord && (
              <button
                id="btn-goto-image-to-word"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenImageToWord();
                }}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
              >
                <FileImage className="w-4 h-4 text-sky-600" />
                <span>{isKm ? 'បម្លែងរូបភាពទៅជា Word' : 'Images to Word'}</span>
              </button>
            )}

            <button
              id="btn-try-sample"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSample();
              }}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{isKm ? 'សាកល្បងឯកសារគំរូ' : 'Try Sample PDF'}</span>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-700">
                {isKm ? 'កំពុងដំណើរការឯកសារ...' : 'Loading document...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FileImage className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">
              {isKm ? 'បម្លែងជារូបភាពច្បាស់' : 'Lossless Images'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isKm
                ? 'នាំចេញជា PNG, JPG, WebP គុណភាពខ្ពស់ 300 DPI មិនបែក។'
                : 'Export to PNG, JPG, WebP at up to 300 DPI.'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">
              {isKm ? 'រូបភាពទៅជា Word' : 'Image to Word'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isKm
                ? 'AI OCR អក្សរខ្មែរ ឬបង្កប់រូបភាពក្នុង .docx ជាមួយ Page Setup។'
                : 'AI Khmer OCR or compile photo pages with Page Setup.'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">
              {isKm ? 'ស្រង់អក្សរ & តារាង' : 'Script & Layout OCR'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isKm
                ? 'ស្រង់អក្សរ និងតារាង ធានាមិនខុសជើងអក្សរឡើយ។'
                : 'Fast native extraction or Gemini AI preserving tables.'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">
              {isKm ? 'ចាក់សោការពារ' : 'Password & Security'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isKm
                ? 'ចាក់សោ PDF ដោយលេខសម្ងាត់ ដោះសោ និងបោះត្រាទឹក។'
                : 'Encrypt PDFs with user passwords and watermarks.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
