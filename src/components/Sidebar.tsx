import React from 'react';
import {
  Shield,
  FileText,
  Image as ImageIcon,
  Lock,
  Unlock,
  Wrench,
  Sparkles,
  Upload,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  FileCheck2,
  FileUp,
  FileImage,
} from 'lucide-react';
import type { Language, AppTab } from '../types';

interface SidebarProps {
  lang: Language;
  onToggleLang: () => void;
  onSelectLang?: (lang: Language) => void;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  hasDocument: boolean;
  fileName: string;
  totalPages: number;
  isEncrypted: boolean;
  onOpenSample: () => void;
  onUploadClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  lang,
  onToggleLang,
  onSelectLang,
  activeTab,
  onSelectTab,
  hasDocument,
  fileName,
  totalPages,
  isEncrypted,
  onOpenSample,
  onUploadClick,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const isKm = lang === 'km';

  const menuItems: {
    id: AppTab;
    number: string;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badge?: string;
  }[] = [
    {
      id: 'viewer',
      number: isKm ? '១' : '1',
      label: isKm ? 'មើល & រៀបចំទំព័រ' : 'View & Organize',
      sublabel: isKm ? 'បង្វិល ច្រឹប & លុបទំព័រ' : 'Viewer & page layout',
      icon: FileText,
      accentColor: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'convert-image',
      number: isKm ? '២' : '2',
      label: isKm ? 'បម្លែងជារូបភាព' : 'Convert to Images',
      sublabel: isKm ? 'PNG, JPG, WebP ច្បាស់' : 'PNG, JPG, WebP lossless',
      icon: ImageIcon,
      accentColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'convert-text',
      number: isKm ? '៣' : '3',
      label: isKm ? 'បម្លែងជា Word & អត្ថបទ' : 'Word (.docx) & OCR',
      sublabel: isKm ? 'AI OCR រក្សាជើងអក្សរ & តារាង' : 'Preserve Khmer font & tables',
      icon: FileCheck2,
      accentColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badge: 'Word .docx',
    },
    {
      id: 'image-to-word',
      number: isKm ? '៤' : '4',
      label: isKm ? 'រូបភាពទៅជា Word' : 'Image to Word',
      sublabel: isKm ? 'AI OCR & បង្កប់រូបភាពក្នុង .docx' : 'AI OCR & embed docx',
      icon: FileImage,
      accentColor: 'text-sky-600 bg-sky-50 border-sky-200',
      badge: 'Docx',
    },
    {
      id: 'security',
      number: isKm ? '៥' : '5',
      label: isKm ? 'ចាក់សោ & ត្រាទឹក' : 'Password & Watermark',
      sublabel: isKm ? 'ការពារលេខសម្ងាត់ & សិទ្ធិ' : 'Military-grade encryption',
      icon: Lock,
      accentColor: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'tools',
      number: isKm ? '៦' : '6',
      label: isKm ? 'ឧបករណ៍បន្ថែម' : 'Merge & PDF Tools',
      sublabel: isKm ? 'បញ្ចូល PDF / រូបភាពជា PDF' : 'Merge, split & image-to-PDF',
      icon: Wrench,
      accentColor: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white text-slate-800 select-none">
      {/* Top Brand & Header Section */}
      <div className="flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm ring-4 ring-blue-50 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                    {isKm ? 'ប្រព័ន្ធគ្រប់គ្រង PDF' : 'Secure PDF Studio'}
                  </h1>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {isKm ? 'បម្លែង Word & ការពារសុវត្ថិភាព' : 'Khmer OCR & Security'}
                </p>
              </div>
            )}
          </div>

          {/* Close button on mobile, Collapse button on desktop */}
          <div className="flex items-center">
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              title={isCollapsed ? (isKm ? 'ពង្រីក Menu' : 'Expand Sidebar') : (isKm ? 'បង្រួម Menu' : 'Collapse Sidebar')}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Active Document Card in Sidebar */}
        {hasDocument && !isCollapsed && (
          <div className="m-3 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate" title={fileName}>
                  {fileName}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {totalPages} {isKm ? 'ទំព័រ' : 'pages'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[10px]">
              {isEncrypted ? (
                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">
                  <Lock className="w-2.5 h-2.5" />
                  {isKm ? 'មានលេខសម្ងាត់' : 'Encrypted'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                  <Unlock className="w-2.5 h-2.5" />
                  {isKm ? 'គ្មានលេខសម្ងាត់' : 'Unlocked'}
                </span>
              )}

              <button
                onClick={onUploadClick}
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                title={isKm ? 'ប្ដូរឯកសារថ្មី' : 'Change Document'}
              >
                <FileUp className="w-3 h-3" />
                <span>{isKm ? 'ប្ដូរឯកសារ' : 'Change'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Menu List */}
        <div className="p-2 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {!isCollapsed ? (isKm ? 'ម៉ឺនុយមុខងារ (Menu)' : 'Features Menu') : '•••'}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                title={item.label}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer text-left ${
                  isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 gap-3'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold'
                }`}
              >
                <div
                  className={`relative flex items-center justify-center rounded-lg shrink-0 transition-colors ${
                    isCollapsed ? 'w-9 h-9' : 'w-8 h-8'
                  } ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.accentColor
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm tracking-tight truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-400 font-normal'
                      }`}
                    >
                      {item.sublabel}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Section */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
        {!isCollapsed ? (
          <>
            {/* Quick Upload Button */}
            <button
              id="sidebar-btn-upload"
              onClick={onUploadClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isKm ? 'ជ្រើសរើស PDF' : 'Upload PDF'}</span>
            </button>

            {/* Khmer Sample Document Button */}
            <button
              id="sidebar-btn-sample"
              onClick={onOpenSample}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{isKm ? 'ឯកសារគំរូខ្មែរ' : 'Sample Khmer PDF'}</span>
            </button>

            {/* Creator Card */}
            <div className="p-2.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-slate-50 border border-blue-200/80 rounded-xl flex items-center gap-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                LM
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {isKm ? 'អ្នកបង្កើត Website' : 'Website Creator'}
                </div>
                <div className="text-xs font-black text-slate-900 truncate">
                  ឡោម មនីវង្ស
                </div>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="pt-0.5 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] font-medium">{isKm ? 'ភាសា ៖' : 'Language:'}</span>
              <div className="flex bg-slate-200/70 p-0.5 rounded-lg border border-slate-200">
                <button
                  id="sidebar-lang-km"
                  onClick={() => {
                    if (onSelectLang) {
                      onSelectLang('km');
                    } else if (!isKm) {
                      onToggleLang();
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                    isKm
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="ប្តូរជាភាសាខ្មែរ"
                >
                  🇰🇭 ខ្មែរ
                </button>
                <button
                  id="sidebar-lang-en"
                  onClick={() => {
                    if (onSelectLang) {
                      onSelectLang('en');
                    } else if (isKm) {
                      onToggleLang();
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                    !isKm
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to English"
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onUploadClick}
              className="p-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs cursor-pointer"
              title={isKm ? 'ជ្រើសរើស PDF' : 'Upload PDF'}
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSample}
              className="p-2.5 text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl cursor-pointer"
              title={isKm ? 'ឯកសារគំរូខ្មែរ' : 'Sample Khmer PDF'}
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
            </button>
            <div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-[10px] cursor-default"
              title={isKm ? 'អ្នកបង្កើត ៖ ឡោម មនីវង្ស' : 'Creator: Lom Monyvong (ឡោម មនីវង្ស)'}
            >
              LM
            </div>
            <button
              onClick={onToggleLang}
              className="p-1.5 text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer"
              title={isKm ? 'Switch to English' : 'ប្តូរជាភាសាខ្មែរ'}
            >
              {isKm ? '🇰🇭' : '🇬🇧'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Sticky / Left Side) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-slate-200 transition-all duration-200 z-20 sticky top-0 h-screen ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-over */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
