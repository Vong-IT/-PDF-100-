/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Language, AppTab, DocumentState } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FileDropZone } from './components/FileDropZone';
import { ViewerPanel } from './components/ViewerPanel';
import { ImageConverterPanel } from './components/ImageConverterPanel';
import { TextExtractionPanel } from './components/TextExtractionPanel';
import { SecurityPanel } from './components/SecurityPanel';
import { ToolsPanel } from './components/ToolsPanel';
import { ImageToWordPanel } from './components/ImageToWordPanel';
import { PasswordPromptModal } from './components/PasswordPromptModal';
import { loadPdfJsDoc } from './utils/pdfHelper';
import { createKhmerSamplePdf } from './utils/samplePdf';
import { getStoredGeminiApiKey } from './utils/aiOcrService';
import { ApiKeyModal } from './components/ApiKeyModal';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_lang_pref');
      if (saved === 'km' || saved === 'en') return saved;
    } catch (_e) {}
    return 'km';
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('app_lang_pref', newLang);
      document.documentElement.lang = newLang;
    } catch (_e) {}
  };

  const handleToggleLang = () => {
    handleSetLang(lang === 'km' ? 'en' : 'km');
  };

  const [activeTab, setActiveTab] = useState<AppTab>('viewer');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [isGlobalApiKeyModalOpen, setIsGlobalApiKeyModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!getStoredGeminiApiKey());

  // Sidebar navigation state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [initialImageFiles, setInitialImageFiles] = useState<File[]>([]);

  // Document state
  const [docState, setDocState] = useState<DocumentState>({
    file: null,
    fileName: '',
    fileSize: 0,
    pdfData: null,
    totalPages: 0,
    currentPage: 1,
    isPasswordProtected: false,
    isEncrypted: false,
    activePassword: '',
  });

  const [pdfJsDoc, setPdfJsDoc] = useState<any>(null);

  // Hidden file input for header upload button
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  // Password Modal state
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    error: string | null;
    isLoading: boolean;
    pendingData: Uint8Array | null;
    pendingName: string;
  }>({
    isOpen: false,
    error: null,
    isLoading: false,
    pendingData: null,
    pendingName: '',
  });

  // Load document from Uint8Array
  const processPdfBytes = async (data: Uint8Array, fileName: string, password?: string) => {
    setIsLoading(true);
    setLoadingText(lang === 'km' ? 'កំពុងបើក និងផ្ទៀងផ្ទាត់ឯកសារ...' : 'Loading and verifying PDF...');

    try {
      const doc = await loadPdfJsDoc(data, password);
      setPdfJsDoc(doc);
      setDocState({
        file: null,
        fileName,
        fileSize: data.byteLength,
        pdfData: data,
        totalPages: doc.numPages,
        currentPage: 1,
        isPasswordProtected: !!password,
        isEncrypted: !!password,
        activePassword: password || '',
      });

      // Close password modal if open
      setPasswordModal((prev) => ({ ...prev, isOpen: false, isLoading: false, error: null }));
    } catch (err: any) {
      console.warn('PDF Loading error:', err);
      // Check if password required
      if (err.name === 'PasswordException') {
        setPasswordModal({
          isOpen: true,
          error: password
            ? lang === 'km'
              ? 'លេខសម្ងាត់មិនត្រឹមត្រូវទេ! សូមសាកល្បងម្តងទៀត។'
              : 'Incorrect password! Please try again.'
            : null,
          isLoading: false,
          pendingData: data,
          pendingName: fileName,
        });
      } else {
        alert(err.message || (lang === 'km' ? 'មិនអាចបើកឯកសារ PDF នេះបានទេ' : 'Failed to load PDF file'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle uploaded file
  const handleFileSelected = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    await processPdfBytes(bytes, file.name);
  };

  // Handle sample document load
  const handleOpenSample = async () => {
    setIsLoading(true);
    setLoadingText(
      lang === 'km'
        ? 'កំពុងបង្កើតឯកសារគំរូភាសាខ្មែរ (អក្សរមិនខុសដៃជើង)...'
        : 'Generating authentic Khmer sample PDF...'
    );

    try {
      const sampleBytes = await createKhmerSamplePdf();
      await processPdfBytes(sampleBytes, 'ឯកសាររដ្ឋបាល_គំរូអក្សរសាស្ត្រខ្មែរ.pdf');
    } catch (e: any) {
      console.error('Error creating sample PDF:', e);
      alert('Failed to generate sample PDF: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password submit in modal
  const handlePasswordSubmit = async (password: string) => {
    if (!passwordModal.pendingData) return;
    setPasswordModal((prev) => ({ ...prev, isLoading: true, error: null }));
    await processPdfBytes(passwordModal.pendingData, passwordModal.pendingName, password);
  };

  // Handle PDF bytes updated from Viewer or Security panel
  const handlePdfBytesUpdated = async (newBytes: Uint8Array) => {
    await processPdfBytes(newBytes, docState.fileName, docState.activePassword);
  };

  const hasDocument = !!docState.pdfData && docState.totalPages > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-khmer">
      {/* Hidden File Input */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelected(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Left Sidebar Menu */}
      <Sidebar
        lang={lang}
        onToggleLang={handleToggleLang}
        onSelectLang={handleSetLang}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasDocument={hasDocument}
        fileName={docState.fileName}
        totalPages={docState.totalPages}
        isEncrypted={docState.isEncrypted}
        onOpenSample={handleOpenSample}
        onUploadClick={() => hiddenFileInputRef.current?.click()}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Right Column) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Streamlined Top Header */}
        <Header
          lang={lang}
          onToggleLang={handleToggleLang}
          onSelectLang={handleSetLang}
          activeTab={activeTab}
          hasDocument={hasDocument}
          fileName={docState.fileName}
          totalPages={docState.totalPages}
          isEncrypted={docState.isEncrypted}
          onOpenSample={handleOpenSample}
          onUploadClick={() => hiddenFileInputRef.current?.click()}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenApiKeyModal={() => setIsGlobalApiKeyModalOpen(true)}
          hasApiKey={hasApiKey}
        />

        {/* Dynamic Panel Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {!hasDocument && activeTab !== 'tools' && activeTab !== 'image-to-word' ? (
            <FileDropZone
              lang={lang}
              onFileSelected={handleFileSelected}
              onImageSelected={(file) => {
                setInitialImageFiles([file]);
                setActiveTab('image-to-word');
              }}
              onOpenImageToWord={() => setActiveTab('image-to-word')}
              onOpenSample={handleOpenSample}
              isLoading={isLoading}
            />
          ) : (
            <div className="flex-1 min-w-0">
              {activeTab === 'viewer' && (
                <ViewerPanel
                  lang={lang}
                  pdfDoc={pdfJsDoc}
                  pdfBytes={docState.pdfData!}
                  totalPages={docState.totalPages}
                  currentPage={docState.currentPage}
                  onPageChange={(p) => setDocState((prev) => ({ ...prev, currentPage: p }))}
                  onPdfBytesUpdated={handlePdfBytesUpdated}
                  fileName={docState.fileName}
                />
              )}

              {activeTab === 'convert-image' && (
                <ImageConverterPanel
                  lang={lang}
                  pdfDoc={pdfJsDoc}
                  totalPages={docState.totalPages}
                  currentPage={docState.currentPage}
                  fileName={docState.fileName}
                />
              )}

              {activeTab === 'convert-text' && (
                <TextExtractionPanel
                  lang={lang}
                  pdfDoc={pdfJsDoc}
                  totalPages={docState.totalPages}
                  currentPage={docState.currentPage}
                  fileName={docState.fileName}
                />
              )}

              {activeTab === 'image-to-word' && (
                <ImageToWordPanel
                  lang={lang}
                  initialFiles={initialImageFiles}
                  onClearInitialFiles={() => setInitialImageFiles([])}
                />
              )}

              {activeTab === 'security' && (
                <SecurityPanel
                  lang={lang}
                  pdfBytes={docState.pdfData!}
                  fileName={docState.fileName}
                  isEncrypted={docState.isEncrypted}
                  activePassword={docState.activePassword}
                  onPdfBytesUpdated={handlePdfBytesUpdated}
                />
              )}

              {activeTab === 'tools' && <ToolsPanel lang={lang} />}
            </div>
          )}
        </main>

        {/* Sleek App Footer with Creator Attribution & Language Selector */}
        <footer className="border-t border-slate-200 bg-white/90 backdrop-blur-xs px-4 sm:px-6 py-3.5 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-semibold text-slate-800">
                {lang === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រង PDF & បម្លែង Word' : 'Secure PDF Studio & Word Converter'}
              </span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span>{lang === 'km' ? 'អ្នកបង្កើត ៖' : 'Created by:'}</span>
                <strong className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                  ឡោម មនីវង្ស
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-slate-400">
                {lang === 'km' ? 'សុវត្ថិភាពខ្ពស់ & រក្សាអក្សរខ្មែរ' : '100% Client-Side Privacy'}
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  onClick={() => handleSetLang('km')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    lang === 'km' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="ប្តូរជាភាសាខ្មែរ"
                >
                  🇰🇭 ខ្មែរ
                </button>
                <button
                  onClick={() => handleSetLang('en')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    lang === 'en' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to English"
                >
                  🇬🇧 English
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 flex flex-col items-center gap-3 max-w-sm w-full text-center">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <h4 className="font-bold text-slate-900 text-sm">{loadingText}</h4>
            <p className="text-xs text-slate-500">
              {lang === 'km'
                ? 'សូមរង់ចាំបន្តិច ប្រព័ន្ធកំពុងរក្សាទ្រង់ទ្រាយ និងអក្សរខ្មែរ...'
                : 'Please wait, processing document with layout fidelity...'}
            </p>
          </div>
        </div>
      )}

      {/* Password Prompt Modal for Encrypted PDFs */}
      <PasswordPromptModal
        isOpen={passwordModal.isOpen}
        lang={lang}
        fileName={passwordModal.pendingName}
        onSubmit={handlePasswordSubmit}
        onCancel={() => setPasswordModal((prev) => ({ ...prev, isOpen: false }))}
        error={passwordModal.error}
        isLoading={passwordModal.isLoading}
      />

      {/* Global Gemini API Key Modal (Crucial for GitHub Pages / Static Hosting) */}
      <ApiKeyModal
        isOpen={isGlobalApiKeyModalOpen}
        onClose={() => {
          setIsGlobalApiKeyModalOpen(false);
          setHasApiKey(!!getStoredGeminiApiKey());
        }}
        lang={lang}
        onSaved={() => {
          setHasApiKey(true);
        }}
      />
    </div>
  );
}

