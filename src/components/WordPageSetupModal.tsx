import React, { useState } from 'react';
import { WordExportOptions, WordMarginsPreset, WordPaperSize } from '../utils/docxExport';
import { HelpCircle, X, Check } from 'lucide-react';

interface WordPageSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: WordExportOptions;
  onOptionsChange: (newOptions: Partial<WordExportOptions>) => void;
  isKm?: boolean;
}

export const WordPageSetupModal: React.FC<WordPageSetupModalProps> = ({
  isOpen,
  onClose,
  options,
  onOptionsChange,
  isKm = true,
}) => {
  if (!isOpen) return null;

  // Active Tab: 'margins' | 'paper' | 'layout'
  const [activeTab, setActiveTab] = useState<'margins' | 'paper' | 'layout'>('margins');

  // Exact values as requested in user's Page Setup screenshot:
  // Top: 0.69", Bottom: 0.59", Left: 0.59", Right: 0.59", Gutter: 0", Gutter pos: Left, Orientation: Portrait
  const [top, setTop] = useState<number>(options.customMargins?.top ?? 0.69);
  const [bottom, setBottom] = useState<number>(options.customMargins?.bottom ?? 0.59);
  const [left, setLeft] = useState<number>(options.customMargins?.left ?? 0.59);
  const [right, setRight] = useState<number>(options.customMargins?.right ?? 0.59);
  const [gutter, setGutter] = useState<number>(options.customMargins?.gutter ?? 0);
  const [gutterPos, setGutterPos] = useState<'left' | 'top'>('left');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    options.orientation || 'portrait'
  );
  const [paperSize, setPaperSize] = useState<WordPaperSize>(options.paperSize || 'A4');
  const [multiplePages, setMultiplePages] = useState<string>('Normal');
  const [applyTo, setApplyTo] = useState<string>('Whole document');
  const [savedAsDefault, setSavedAsDefault] = useState<boolean>(false);

  const handleApply = () => {
    onOptionsChange({
      orientation,
      paperSize,
      marginsPreset: 'page-setup',
      customMargins: {
        top,
        bottom,
        left,
        right,
        gutter,
      },
    });
    onClose();
  };

  const handleSetAsDefault = () => {
    try {
      const defaultSetup = {
        top,
        bottom,
        left,
        right,
        gutter,
        orientation,
        paperSize,
      };
      localStorage.setItem('docx_page_setup_default', JSON.stringify(defaultSetup));
      setSavedAsDefault(true);
      setTimeout(() => setSavedAsDefault(false), 2000);
    } catch (_) {
      // LocalStorage fallback
    }
  };

  const handleResetToPhotoPreset = () => {
    setTop(0.69);
    setBottom(0.59);
    setLeft(0.59);
    setRight(0.59);
    setGutter(0);
    setGutterPos('left');
    setOrientation('portrait');
    setPaperSize('A4');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Dialog container mimicking Word's clean native dialog */}
      <div className="w-full max-w-md bg-[#F0F0F0] text-slate-900 rounded-lg shadow-2xl border border-slate-300 overflow-hidden font-sans text-xs sm:text-sm select-none">
        {/* Title Bar */}
        <div className="bg-white px-3 py-2 flex items-center justify-between border-b border-slate-200">
          <span className="font-semibold text-slate-800 text-sm">
            {isKm ? 'Page Setup (ការកំណត់ទំព័រ Word)' : 'Page Setup'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleResetToPhotoPreset}
              className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
              title={isKm ? 'កំណត់តម្លៃដូចក្នុងរូប (Top: 0.69", Bottom/Left/Right: 0.59")' : 'Reset to Screenshot values'}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="px-3 pt-2 bg-[#F0F0F0] flex gap-1 border-b border-slate-300">
          <button
            onClick={() => setActiveTab('margins')}
            className={`px-3 py-1.5 font-medium rounded-t-md border-t border-x text-xs cursor-pointer transition-colors ${
              activeTab === 'margins'
                ? 'bg-white border-slate-300 text-slate-900 -mb-[1px] font-semibold'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {isKm ? 'Margins (រឹមទំព័រ)' : 'Margins'}
          </button>
          <button
            onClick={() => setActiveTab('paper')}
            className={`px-3 py-1.5 font-medium rounded-t-md border-t border-x text-xs cursor-pointer transition-colors ${
              activeTab === 'paper'
                ? 'bg-white border-slate-300 text-slate-900 -mb-[1px] font-semibold'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {isKm ? 'Paper (ក្រដាស)' : 'Paper'}
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-3 py-1.5 font-medium rounded-t-md border-t border-x text-xs cursor-pointer transition-colors ${
              activeTab === 'layout'
                ? 'bg-white border-slate-300 text-slate-900 -mb-[1px] font-semibold'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {isKm ? 'Layout (ប្លង់)' : 'Layout'}
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="p-4 bg-white border-b border-slate-300 space-y-4">
          {activeTab === 'margins' && (
            <div className="space-y-4">
              {/* Margins Inputs (Top, Bottom, Left, Right, Gutter) */}
              <div>
                <span className="font-semibold text-slate-700 block mb-2 text-xs">
                  {isKm ? 'Margins (ទំហំរឹមគែម)' : 'Margins'}
                </span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-medium">
                      {isKm ? 'Top (លើ):' : 'Top:'}
                    </label>
                    <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 w-24 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={top}
                        onChange={(e) => setTop(parseFloat(e.target.value) || 0)}
                        className="w-full text-right outline-none font-mono text-xs pr-1"
                      />
                      <span className="text-slate-400 text-xs">"</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-medium">
                      {isKm ? 'Bottom (ក្រោម):' : 'Bottom:'}
                    </label>
                    <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 w-24 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={bottom}
                        onChange={(e) => setBottom(parseFloat(e.target.value) || 0)}
                        className="w-full text-right outline-none font-mono text-xs pr-1"
                      />
                      <span className="text-slate-400 text-xs">"</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-medium">
                      {isKm ? 'Left (ឆ្វេង):' : 'Left:'}
                    </label>
                    <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 w-24 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={left}
                        onChange={(e) => setLeft(parseFloat(e.target.value) || 0)}
                        className="w-full text-right outline-none font-mono text-xs pr-1"
                      />
                      <span className="text-slate-400 text-xs">"</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-medium">
                      {isKm ? 'Right (ស្តាំ):' : 'Right:'}
                    </label>
                    <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 w-24 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={right}
                        onChange={(e) => setRight(parseFloat(e.target.value) || 0)}
                        className="w-full text-right outline-none font-mono text-xs pr-1"
                      />
                      <span className="text-slate-400 text-xs">"</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-medium">
                      {isKm ? 'Gutter:' : 'Gutter:'}
                    </label>
                    <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 w-24 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={gutter}
                        onChange={(e) => setGutter(parseFloat(e.target.value) || 0)}
                        className="w-full text-right outline-none font-mono text-xs pr-1"
                      />
                      <span className="text-slate-400 text-xs">"</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-medium">
                      {isKm ? 'Gutter position:' : 'Gutter pos:'}
                    </label>
                    <select
                      value={gutterPos}
                      onChange={(e) => setGutterPos(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded px-1.5 py-0.5 w-24 text-xs"
                    >
                      <option value="left">Left</option>
                      <option value="top">Top</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-slate-200" />

              {/* Orientation (Portrait / Landscape) */}
              <div>
                <span className="font-semibold text-slate-700 block mb-2 text-xs">
                  {isKm ? 'Orientation (ទិសដៅក្រដាស)' : 'Orientation'}
                </span>
                <div className="flex items-center gap-4">
                  {/* Portrait Button */}
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded border transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  >
                    <div className="w-7 h-9 border border-slate-700 bg-white flex flex-col justify-start p-1 gap-0.5 shadow-2xs">
                      <div className="w-full h-[2px] bg-slate-400" />
                      <div className="w-3/4 h-[2px] bg-slate-400" />
                      <div className="w-full h-[2px] bg-slate-400" />
                      <div className="w-2/3 h-[2px] bg-slate-400" />
                    </div>
                    <span className="text-[11px] font-medium mt-1 text-slate-800">
                      {isKm ? 'Portrait (បញ្ឈរ)' : 'Portrait'}
                    </span>
                  </button>

                  {/* Landscape Button */}
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded border transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  >
                    <div className="w-9 h-7 border border-slate-700 bg-white flex flex-col justify-start p-1 gap-0.5 shadow-2xs">
                      <div className="w-full h-[2px] bg-slate-400" />
                      <div className="w-3/4 h-[2px] bg-slate-400" />
                      <div className="w-full h-[2px] bg-slate-400" />
                    </div>
                    <span className="text-[11px] font-medium mt-1 text-slate-800">
                      {isKm ? 'Landscape (ផ្ដេក)' : 'Landscape'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="h-[1px] bg-slate-200" />

              {/* Pages */}
              <div>
                <span className="font-semibold text-slate-700 block mb-2 text-xs">
                  {isKm ? 'Pages (ទំព័រ)' : 'Pages'}
                </span>
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-medium">Multiple pages:</label>
                  <select
                    value={multiplePages}
                    onChange={(e) => setMultiplePages(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 w-44 text-xs"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Mirror margins">Mirror margins</option>
                    <option value="2 pages per sheet">2 pages per sheet</option>
                  </select>
                </div>
              </div>

              <div className="h-[1px] bg-slate-200" />

              {/* Preview Box */}
              <div>
                <span className="font-semibold text-slate-700 block mb-2 text-xs">
                  {isKm ? 'Preview (ទិដ្ឋភាពគំរូ)' : 'Preview'}
                </span>
                <div className="flex items-center gap-6">
                  {/* Sheet graphic with margins */}
                  <div
                    className={`bg-white border border-slate-400 shadow-sm flex flex-col justify-between p-1 transition-all ${
                      orientation === 'portrait' ? 'w-24 h-32' : 'w-32 h-24'
                    }`}
                    style={{
                      paddingTop: `${Math.max(top * 10, 4)}px`,
                      paddingBottom: `${Math.max(bottom * 10, 4)}px`,
                      paddingLeft: `${Math.max(left * 10, 4)}px`,
                      paddingRight: `${Math.max(right * 10, 4)}px`,
                    }}
                  >
                    <div className="w-full h-full border border-dashed border-blue-400 bg-blue-50/20 flex flex-col gap-1 p-1 overflow-hidden">
                      <div className="w-full h-[1.5px] bg-slate-600" />
                      <div className="w-4/5 h-[1.5px] bg-slate-400" />
                      <div className="w-full h-[1.5px] bg-slate-400" />
                      <div className="w-2/3 h-[1.5px] bg-slate-400" />
                      <div className="w-full h-[1.5px] bg-slate-600" />
                      <div className="w-3/4 h-[1.5px] bg-slate-400" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-700 font-medium">Apply to:</label>
                      <select
                        value={applyTo}
                        onChange={(e) => setApplyTo(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="Whole document">Whole document</option>
                        <option value="This point forward">This point forward</option>
                      </select>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                      <div>
                        {isKm ? 'រឹមគែមបច្ចុប្បន្ន:' : 'Active Margins:'}
                      </div>
                      <div className="font-mono font-medium text-slate-800 mt-0.5">
                        Top {top}" • Bottom {bottom}" • Left {left}" • Right {right}"
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paper' && (
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-slate-700 block mb-2 text-xs">
                  {isKm ? 'Paper Size (ទំហំក្រដាស)' : 'Paper size'}
                </span>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as WordPaperSize)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="A4">A4 (210 × 297 mm - ស្តង់ដារកម្ពុជា)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                  <option value="Legal">Legal (8.5 × 14 in)</option>
                  <option value="A3">A3 (297 × 420 mm)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="text-slate-500 font-medium">
                  {isKm ? 'វិមាត្រក្រដាស (Dimensions):' : 'Dimensions:'}
                </div>
                <div className="font-mono text-slate-800 font-bold">
                  {paperSize === 'A4' && '21.0 cm × 29.7 cm (8.27" × 11.69")'}
                  {paperSize === 'Letter' && '21.59 cm × 27.94 cm (8.5" × 11.0")'}
                  {paperSize === 'Legal' && '21.59 cm × 35.56 cm (8.5" × 14.0")'}
                  {paperSize === 'A3' && '29.7 cm × 42.0 cm (11.69" × 16.54")'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-slate-700 block mb-2 text-xs">
                  {isKm ? 'Section (ផ្នែកឯកសារ)' : 'Section'}
                </span>
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-medium">Section start:</label>
                  <select className="bg-white border border-slate-300 rounded px-2 py-1 text-xs">
                    <option>New page</option>
                    <option>Continuous</option>
                  </select>
                </div>
              </div>

              <div className="h-[1px] bg-slate-200" />

              <div>
                <span className="font-semibold text-slate-700 block mb-2 text-xs">
                  {isKm ? 'Headers and footers' : 'Headers and footers'}
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span>Different odd and even</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span>Different first page</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Set As Default, OK, Cancel) */}
        <div className="px-4 py-2.5 bg-[#F0F0F0] flex items-center justify-between gap-2 border-t border-slate-300">
          <button
            type="button"
            onClick={handleSetAsDefault}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded text-slate-800 text-xs font-medium cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
          >
            {savedAsDefault ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">{isKm ? 'បានរក្សាទុក' : 'Saved'}</span>
              </>
            ) : (
              <span>{isKm ? 'Set As Default (ជាលំនាំដើម)' : 'Set As Default'}</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors min-w-[70px]"
            >
              OK
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 rounded text-xs font-medium cursor-pointer transition-colors min-w-[70px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
