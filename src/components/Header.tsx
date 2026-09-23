import React from 'react';
import {
  Menu,
  FileText,
  Lock,
  Unlock,
  Upload,
  Sparkles,
  Globe,
  User,
  Image as ImageIcon,
  FileCheck2,
  FileImage,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Key,
} from 'lucide-react';
import type { Language, AppTab } from '../types';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  onSelectLang?: (lang: Language) => void;
  activeTab: AppTab;
  hasDocument: boolean;
  fileName: string;
  totalPages: number;
  isEncrypted: boolean;
  onOpenSample: () => void;
  onUploadClick: () => void;
  onToggleMobileMenu: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenApiKeyModal?: () => void;
  hasApiKey?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  onSelectLang,
  activeTab,
  hasDocument,
  fileName,
  totalPages,
  isEncrypted,
  onOpenSample,
  onUploadClick,
  onToggleMobileMenu,
  isCollapsed,
  onToggleCollapse,
  onOpenApiKeyModal,
  hasApiKey,
}) => {
  const isKm = lang === 'km';

  // Active section metadata
  const tabTitles: Record<AppTab, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    viewer: {
      label: isKm ? '១. មើល & រៀបចំទំព័រ (Viewer)' : '1. View & Organize',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    'convert-image': {
      label: isKm ? '២. បម្លែងជារូបភាព (PNG/JPG)' : '2. Convert to Images',
      icon: ImageIcon,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    'convert-text': {
      label: isKm ? '៣. បម្លែងជា Word (.docx) & អត្ថបទ' : '3. Convert to Word (.docx) & OCR',
      icon: FileCheck2,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    'image-to-word': {
      label: isKm ? '៤. បម្លែងរូបភាពទៅជា Word (.docx)' : '4. Convert Images to Word (.docx)',
      icon: FileImage,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
    },
    security: {
      label: isKm ? '៥. ចាក់សោលេខសម្ងាត់ & ត្រាទឹក' : '5. Password Lock & Security',
      icon: Lock,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    tools: {
      label: isKm ? '៦. បញ្ចូល PDF & ឧបករណ៍បន្ថែម' : '6. Merge & PDF Tools',
      icon: Wrench,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  };

  const currentTab = tabTitles[activeTab];
  const TabIcon = currentTab?.icon || FileText;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Sidebar Toggle & Active Section Breadcrumb */}
        <div className="flex items-center gap-2.5">
          {/* Mobile hamburger menu button */}
          <button
            id="btn-mobile-menu"
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer transition-colors"
            title={isKm ? 'បើកម៉ឺនុយ' : 'Open Menu'}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Collapse/Expand quick toggle */}
          <button
            id="btn-desktop-toggle-sidebar"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center gap-1 p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
            title={isCollapsed ? (isKm ? 'ពង្រីក Menu ឆ្វេង' : 'Expand Sidebar') : (isKm ? 'បង្រួម Menu ឆ្វេង' : 'Collapse Sidebar')}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span className="text-[11px] font-bold text-slate-500">
              {isKm ? 'ម៉ឺនុយ' : 'Menu'}
            </span>
          </button>

          <span className="hidden lg:inline text-slate-300">|</span>

          {/* Active Feature Breadcrumb */}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${currentTab?.color}`}>
              <TabIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
              {currentTab?.label}
            </h2>
          </div>
        </div>

        {/* Right: Document info badge and quick actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
          {/* Current Document Badge */}
          {hasDocument ? (
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-800 max-w-[160px] md:max-w-[220px] truncate" title={fileName}>
                {fileName}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-bold">
                {totalPages} {isKm ? 'ទំព័រ' : 'pages'}
              </span>
              {isEncrypted ? (
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                  <Lock className="w-2.5 h-2.5" />
                  {isKm ? 'ចាក់សោ' : 'Locked'}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                  <Unlock className="w-2.5 h-2.5" />
                  {isKm ? 'សុវត្ថិភាព' : 'Open'}
                </span>
              )}
            </div>
          ) : null}

          {/* Quick Upload Button */}
          <button
            id="btn-quick-upload"
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isKm ? 'ជ្រើសរើស PDF' : 'Upload PDF'}</span>
          </button>

          {/* Sample PDF Button */}
          <button
            id="btn-sample-pdf"
            onClick={onOpenSample}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
            title={isKm ? 'សាកល្បងឯកសារគំរូភាសាខ្មែរផ្លូវការ' : 'Load sample Khmer official document'}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{isKm ? 'គំរូខ្មែរ' : 'Sample Khmer'}</span>
          </button>

          {/* Creator Credit Badge */}
          <div
            className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-gradient-to-r from-blue-50/80 via-indigo-50/70 to-slate-50 border border-blue-200/70 rounded-xl text-xs shadow-2xs"
            title={isKm ? 'អ្នកបង្កើតគេហទំព័រនេះ ៖ ឡោម មនីវង្ស' : 'Website Creator: Lom Monyvong'}
          >
            <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
              LM
            </div>
            <div className="flex items-center gap-1 leading-tight">
              <span className="text-slate-500 text-[11px] font-medium">
                {isKm ? 'បង្កើតដោយ ៖' : 'By:'}
              </span>
              <span className="font-bold text-slate-800 tracking-tight">
                ឡោម មនីវង្ស
              </span>
            </div>
          </div>

          {/* Gemini API Key Button (Crucial for GitHub Pages / Static Hosting) */}
          {onOpenApiKeyModal && (
            <button
              id="btn-gemini-key"
              onClick={onOpenApiKeyModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                hasApiKey
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title={
                hasApiKey
                  ? (isKm ? 'Gemini API Key ត្រូវបានភ្ជាប់រួចរាល់' : 'Gemini API Key is active')
                  : (isKm ? 'កំណត់ Gemini API Key (សម្រាប់ដំណើរការលើ GitHub)' : 'Set Gemini API Key (For GitHub Pages)')
              }
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {hasApiKey
                  ? (isKm ? 'API Key: បានភ្ជាប់' : 'Key: Active')
                  : (isKm ? 'ភ្ជាប់ API Key' : 'Connect Key')}
              </span>
            </button>
          )}

          {/* Language Switcher (Khmer / English) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
            <button
              id="btn-lang-km"
              onClick={() => {
                if (onSelectLang) {
                  onSelectLang('km');
                } else if (!isKm) {
                  onToggleLang();
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isKm
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="ប្តូរជាភាសាខ្មែរ (Khmer)"
            >
              <span className="text-[12px] leading-none">🇰🇭</span>
              <span>ខ្មែរ</span>
            </button>
            <button
              id="btn-lang-en"
              onClick={() => {
                if (onSelectLang) {
                  onSelectLang('en');
                } else if (isKm) {
                  onToggleLang();
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isKm
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Switch to English"
            >
              <span className="text-[12px] leading-none">🇬🇧</span>
              <span>EN</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

