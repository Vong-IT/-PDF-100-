import React, { useState } from 'react';
import {
  FileText,
  Download,
  Table as TableIcon,
  Type,
  Maximize2,
  CheckCircle2,
  Columns,
  Layers,
  Sparkles,
  Printer,
  ChevronDown,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToExcelFile } from '../utils/excelExport';
import { triggerDownload } from '../utils/pdfHelper';
import {
  parseDocumentContent,
  parseInlineRuns,
  ParsedBlock,
  ParsedRun,
  WordExportOptions,
  WordTableStyle,
  WordLayoutPreset,
  WordTableBorderColor,
  WordTableBgColor,
  WordHeaderBannerStyle,
  WordPaperSize,
  WordMarginsPreset,
  WordBulletPreset,
} from '../utils/docxExport';
import { WordPageSetupModal } from './WordPageSetupModal';

interface WordPreviewProps {
  rawText: string;
  isKm: boolean;
  options: WordExportOptions;
  onOptionsChange: (newOpts: Partial<WordExportOptions>) => void;
  onDownloadDocx: () => void;
  onDownloadExcel?: () => void;
  isDownloading?: boolean;
}

export const WordPreview: React.FC<WordPreviewProps> = ({
  rawText,
  isKm,
  options,
  onOptionsChange,
  onDownloadDocx,
  onDownloadExcel,
  isDownloading = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const blocks = parseDocumentContent(rawText);

  const fontFamily = options.fontFamily || 'Kantumruy Pro';
  const muolFont = options.muolFont || 'Khmer OS Muol Light';
  const tableStyle: WordTableStyle = options.tableStyle || 'bordered';
  const layoutPreset: WordLayoutPreset = options.layoutPreset || 'cambodian-official';
  const fontSizePt = options.fontSizePt || 12;

  const [showPageSetupModal, setShowPageSetupModal] = useState<boolean>(false);

  // Auto-detect paper settings if embedded in content
  const detectedPaper = blocks.find(
    (b): b is { type: 'paper-setting'; paperSize?: WordPaperSize; orientation?: 'portrait' | 'landscape'; marginsPreset?: WordMarginsPreset; customMargins?: any } =>
      b.type === 'paper-setting'
  );
  const paperSize: WordPaperSize = detectedPaper?.paperSize || options.paperSize || 'A4';
  const marginsPreset: WordMarginsPreset = detectedPaper?.marginsPreset || options.marginsPreset || 'page-setup';
  const orientation = detectedPaper?.orientation || options.orientation || 'portrait';
  const customM = detectedPaper?.customMargins || options.customMargins;
  const firstLineIndent = options.firstLineIndent ?? true;
  const justifyText = options.justifyText ?? true;

  // Visual margin styles for preview sheet matching exact Page Setup dialog
  const isLandscape = orientation === 'landscape';
  const paddingStyles =
    marginsPreset === 'page-setup' || customM
      ? {
          paddingTop: `${customM?.top ?? 0.69}in`,
          paddingBottom: `${customM?.bottom ?? 0.59}in`,
          paddingLeft: `${customM?.left ?? 0.59}in`,
          paddingRight: `${customM?.right ?? 0.59}in`,
        }
      : marginsPreset === 'administrative'
      ? {
          paddingTop: '2.5cm',
          paddingBottom: '2.5cm',
          paddingLeft: '3.0cm',
          paddingRight: '2.0cm',
        }
      : marginsPreset === 'narrow'
      ? {
          paddingTop: '1.27cm',
          paddingBottom: '1.27cm',
          paddingLeft: '1.27cm',
          paddingRight: '1.27cm',
        }
      : marginsPreset === 'wide'
      ? {
          paddingTop: '2.54cm',
          paddingBottom: '2.54cm',
          paddingLeft: '5.08cm',
          paddingRight: '5.08cm',
        }
      : {
          padding: '2.54cm', // 1 inch standard
        };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Word Toolbar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-white/20">
            W
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">
                {isKm ? 'គំរូទម្រង់ Microsoft Word (.docx) តាមឯកសារដើម' : 'Microsoft Word (.docx) Faithful Layout'}
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-400/30">
                A4 • WYSIWYG
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isKm
                ? 'រក្សាម៉ូដអក្សរ (អក្សរមូល, ដិត, ជ្រៀង) និងទម្រង់ប្លង់រដ្ឋបាល/តារាងដូច PDF ១០០%'
                : 'Preserves font styles (Muol, bold, italic) & administrative/table layouts'}
            </p>
          </div>
        </div>

        {/* Action & Primary Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg text-xs border border-slate-700">
            <Columns className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={layoutPreset}
              onChange={(e) => onOptionsChange({ layoutPreset: e.target.value as WordLayoutPreset })}
              className="bg-transparent text-white text-xs border-none focus:outline-none cursor-pointer pr-1"
              title={isKm ? 'ជ្រើសរើសទម្រង់ប្លង់ Layout' : 'Choose Layout Preset'}
            >
              <option value="cambodian-official" className="bg-slate-800 text-white">
                {isKm ? '🏛️ ប្លង់រដ្ឋបាលកម្ពុជា (Cambodian Official)' : '🏛️ Cambodian Administrative'}
              </option>
              <option value="clean-report" className="bg-slate-800 text-white">
                {isKm ? '📊 ប្លង់របាយការណ៍/តារាង (Report & Tables)' : '📊 Clean Report'}
              </option>
              <option value="standard" className="bg-slate-800 text-white">
                {isKm ? '📄 ប្លង់ស្តង់ដារ (Standard Word)' : '📄 Standard'}
              </option>
            </select>
          </div>

          {/* Font Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg text-xs border border-slate-700">
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={fontFamily}
              onChange={(e) => onOptionsChange({ fontFamily: e.target.value })}
              className="bg-transparent text-white text-xs border-none focus:outline-none cursor-pointer pr-1"
              title={isKm ? 'ពុម្ពអក្សរខ្លឹមសារទូទៅ' : 'Body Font Family'}
            >
              <option value="Kantumruy Pro" className="bg-slate-800 text-white">
                Kantumruy Pro (ស្តង់ដារថ្មី)
              </option>
              <option value="Khmer OS Siemreap" className="bg-slate-800 text-white">
                Khmer OS Siemreap (រដ្ឋបាល)
              </option>
              <option value="Khmer OS Content" className="bg-slate-800 text-white">
                Khmer OS Content (ផ្លូវការ)
              </option>
              <option value="Calibri" className="bg-slate-800 text-white">
                Calibri / Arial
              </option>
            </select>
          </div>

          {/* Page Setup Dialog Trigger (Word Page Setup) */}
          <button
            onClick={() => setShowPageSetupModal(true)}
            className="flex items-center gap-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            title={isKm ? 'កំណត់ទំព័រ (Page Setup) ដូចក្នុងរូប: Top 0.69", Bottom/Left/Right 0.59"' : 'Page Setup (0.69" / 0.59")'}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>{isKm ? 'Page Setup' : 'Page Setup'}</span>
            <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1 py-0.5 rounded font-mono">
              0.69" / 0.59"
            </span>
          </button>

          {/* Toggle More Settings */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
              showAdvanced
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isKm ? 'កំណត់ប្លង់' : 'Layout'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Download Word Button */}
          <button
            onClick={onDownloadDocx}
            disabled={isDownloading || !rawText}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            title={isKm ? 'ទាញយកជាឯកសារ Word (.docx)' : 'Download Microsoft Word document (.docx)'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? (isKm ? 'កំពុងបង្កើត...' : 'Generating...') : isKm ? 'ទាញយក .DOCX' : 'Download .DOCX'}</span>
          </button>

          {/* Download Excel Button */}
          {onDownloadExcel && (
            <button
              onClick={onDownloadExcel}
              disabled={!rawText}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              title={isKm ? 'ទាញយកតារាង និងទិន្នន័យជាឯកសារ Excel (.xlsx)' : 'Download Excel (.xlsx)'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isKm ? 'ទាញយក .XLSX' : 'Download .XLSX'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Layout Drawer */}
      {showAdvanced && (
        <div className="bg-slate-800 text-slate-200 px-4 py-2.5 border-b border-slate-700 flex flex-wrap items-center gap-4 text-xs">
          {/* Muol Font */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isKm ? 'ពុម្ពអក្សរមូល:' : 'Muol Font:'}</span>
            <select
              value={muolFont}
              onChange={(e) => onOptionsChange({ muolFont: e.target.value })}
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer"
            >
              <option value="Khmer OS Muol Light">Khmer OS Muol Light (ស្តង់ដារ)</option>
              <option value="Khmer OS Muol">Khmer OS Muol</option>
              <option value="Moul">Moul (Google Font)</option>
              <option value="Kantumruy Pro">Kantumruy Pro Bold</option>
            </select>
          </div>

          {/* Table Style */}
          <div className="flex items-center gap-1.5">
            <TableIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{isKm ? 'ម៉ូដតារាង:' : 'Table:'}</span>
            <select
              value={tableStyle}
              onChange={(e) => onOptionsChange({ tableStyle: e.target.value as WordTableStyle })}
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer"
            >
              <option value="bordered">{isKm ? 'ក្រឡាពេញ (Grid)' : 'Bordered Grid'}</option>
              <option value="striped">{isKm ? 'ឆ្នូតឆ្លាស់ (Striped)' : 'Zebra Striped'}</option>
              <option value="minimal">{isKm ? 'បន្ទាត់លើក្រោម (Minimal)' : 'Minimalist'}</option>
              <option value="double">{isKm ? 'បន្ទាត់ទ្វេ (Double Border)' : 'Double Border'}</option>
              <option value="dashed">{isKm ? 'បន្ទាត់ដាច់ៗ (Dashed)' : 'Dashed Border'}</option>
              <option value="dotted">{isKm ? 'បន្ទាត់ចុចៗ (Dotted)' : 'Dotted Border'}</option>
              <option value="thick">{isKm ? 'បន្ទាត់ក្រាស់ (Thick)' : 'Thick Border'}</option>
              <option value="borderless">{isKm ? 'គ្មានបន្ទាត់ (Borderless)' : 'Borderless'}</option>
            </select>
          </div>

          {/* Table Border Color */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isKm ? 'ពណ៌ស៊ុម:' : 'Border:'}</span>
            <select
              value={options.tableBorderColor || 'slate'}
              onChange={(e) =>
                onOptionsChange({ tableBorderColor: e.target.value as WordTableBorderColor })
              }
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer"
            >
              <option value="slate">Slate (ប្រផេះស្តង់ដារ)</option>
              <option value="blue">Blue (ខៀវរដ្ឋបាល)</option>
              <option value="amber">Amber (ទឹកក្រូចមាស)</option>
              <option value="emerald">Emerald (បៃតង)</option>
              <option value="crimson">Crimson (ក្រហម)</option>
              <option value="dark">Dark (ខ្មៅដិត)</option>
            </select>
          </div>

          {/* Table Header Background */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isKm ? 'ផ្ទៃតារាង:' : 'Header BG:'}</span>
            <select
              value={options.tableHeaderBg || 'slate-soft'}
              onChange={(e) =>
                onOptionsChange({ tableHeaderBg: e.target.value as WordTableBgColor })
              }
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer"
            >
              <option value="slate-soft">Soft Slate (ស្រាល)</option>
              <option value="blue-soft">Soft Blue (ផ្ទៃមេឃស្រាល)</option>
              <option value="amber-soft">Soft Amber (លឿងស្រាល)</option>
              <option value="emerald-soft">Soft Emerald (បៃតងស្រាល)</option>
              <option value="navy-royal">Navy Royal (ខៀវក្រម៉ៅ)</option>
              <option value="white">White (សសុទ្ធ)</option>
            </select>
          </div>

          {/* Administrative Header Banner Style */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isKm ? 'ក្បាលលិខិត:' : 'Letterhead:'}</span>
            <select
              value={options.headerBannerStyle || 'none'}
              onChange={(e) =>
                onOptionsChange({ headerBannerStyle: e.target.value as WordHeaderBannerStyle })
              }
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer"
            >
              <option value="none">{isKm ? 'ទទេ (គ្មានបន្ទាត់)' : 'Clean (No border)'}</option>
              <option value="tinted">{isKm ? 'ផ្ទៃពណ៌ស្រាល (Tinted BG)' : 'Tinted Background'}</option>
              <option value="bordered-single">{isKm ? 'បន្ទាត់ក្រោមទោល (Bottom Line)' : 'Single Bottom Line'}</option>
              <option value="bordered-double">{isKm ? 'បន្ទាត់ក្រោមទ្វេ (Double Line)' : 'Double Bottom Line'}</option>
            </select>
          </div>

          {/* Paper Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isKm ? 'ទំហំក្រដាស:' : 'Paper:'}</span>
            <select
              value={paperSize}
              onChange={(e) =>
                onOptionsChange({ paperSize: e.target.value as WordPaperSize })
              }
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
              <option value="A3">A3 (297 × 420 mm)</option>
            </select>
          </div>

          {/* Margins Preset */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isKm ? 'រឹមទំព័រ:' : 'Margins:'}</span>
            <select
              value={marginsPreset}
              onChange={(e) =>
                onOptionsChange({ marginsPreset: e.target.value as WordMarginsPreset })
              }
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer"
            >
              <option value="page-setup">
                {isKm ? '⭐ ប្លង់តាមរូបភាព (Top 0.69", B/L/R 0.59")' : '⭐ Page Setup (Top 0.69", B/L/R 0.59")'}
              </option>
              <option value="administrative">
                {isKm ? 'រដ្ឋបាលខ្មែរ (ឆ្វេង 3cm, ស្តាំ 2cm)' : 'Administrative (L:3cm, R:2cm)'}
              </option>
              <option value="standard">{isKm ? 'ស្តង់ដារ (1 អ៊ីញ ជុំវិញ)' : 'Standard (1 inch)'}</option>
              <option value="narrow">{isKm ? 'រឹមតូច (0.5 អ៊ីញ)' : 'Narrow (0.5 inch)'}</option>
              <option value="wide">{isKm ? 'រឹមធំ (2 អ៊ីញ)' : 'Wide (2 inch)'}</option>
            </select>
            <button
              type="button"
              onClick={() => setShowPageSetupModal(true)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-blue-300 border border-slate-600 rounded text-[11px] font-medium cursor-pointer"
              title={isKm ? 'កំណត់ទំហំរឹមទំព័រ និងទិសដៅលម្អិត' : 'Custom Page Setup'}
            >
              {isKm ? 'កែរឹម...' : 'Setup...'}
            </button>
          </div>

          {/* Orientation */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isKm ? 'ទិសដៅ:' : 'Orientation:'}</span>
            <select
              value={orientation}
              onChange={(e) =>
                onOptionsChange({ orientation: e.target.value as 'portrait' | 'landscape' })
              }
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer"
            >
              <option value="portrait">{isKm ? 'បញ្ឈរ (Portrait)' : 'Portrait'}</option>
              <option value="landscape">{isKm ? 'ផ្ដេក (Landscape)' : 'Landscape'}</option>
            </select>
          </div>

          {/* Bullet Preset */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isKm ? 'ក្បាលចំណុច:' : 'Bullet:'}</span>
            <select
              value={options.bulletPreset || 'auto'}
              onChange={(e) =>
                onOptionsChange({ bulletPreset: e.target.value as WordBulletPreset })
              }
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer"
            >
              <option value="auto">{isKm ? 'ស្វ័យប្រវត្ត (Auto/Detect)' : 'Auto / Detect'}</option>
              <option value="standard">{isKm ? '• រង្វង់មូល (Disc)' : '• Standard Disc'}</option>
              <option value="arrow">{isKm ? '➢ ព្រួញ (Arrow)' : '➢ Arrow'}</option>
              <option value="square">{isKm ? '▪ ការ៉េ (Square)' : '▪ Square'}</option>
              <option value="diamond">{isKm ? '◆ ពេជ្រ (Diamond)' : '◆ Diamond'}</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isKm ? 'ទំហំ:' : 'Size:'}</span>
            <select
              value={fontSizePt}
              onChange={(e) => onOptionsChange({ fontSizePt: parseInt(e.target.value, 10) })}
              className="bg-slate-700 text-white rounded px-2 py-1 text-xs border border-slate-600 cursor-pointer font-mono"
            >
              <option value={10}>10 pt</option>
              <option value={11}>11 pt</option>
              <option value={12}>12 pt (ស្តង់ដារ)</option>
              <option value={13}>13 pt</option>
              <option value={14}>14 pt</option>
            </select>
          </div>

          {/* Toggles */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={firstLineIndent}
              onChange={(e) => onOptionsChange({ firstLineIndent: e.target.checked })}
              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
            <span>{isKm ? 'ចូលបន្ទាត់កថាខណ្ឌ (Indent)' : 'First-line Indent'}</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={justifyText}
              onChange={(e) => onOptionsChange({ justifyText: e.target.checked })}
              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
            <span>{isKm ? 'តម្រឹមស្មើសងខាង (Justify)' : 'Justify Text'}</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300 hover:text-white font-medium">
            <input
              type="checkbox"
              checked={options.embedPdfImages !== false}
              onChange={(e) => onOptionsChange({ embedPdfImages: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <span>{isKm ? "🖼️ រក្សាទុករូបភាព & Shape ដើម" : "🖼️ Preserve Images & Shapes"}</span>
          </label>
        </div>
      )}

      {/* Word Document Sheet (A4 visual representation) */}
      <div className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto max-h-[750px] bg-slate-200/70">
        <div
          className={`mx-auto bg-white rounded shadow-lg border border-slate-300 text-slate-900 transition-all ${
            isLandscape ? 'max-w-[1050px]' : 'max-w-[850px]'
          }`}
          style={{
            ...paddingStyles,
            fontFamily:
              fontFamily === 'Calibri'
                ? 'Calibri, sans-serif'
                : `"${fontFamily}", "Kantumruy Pro", sans-serif`,
            fontSize: `${fontSizePt}pt`,
            lineHeight: 1.6,
          }}
        >
          {blocks.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              {isKm ? 'គ្មានទិន្នន័យអត្ថបទដើម្បីបង្ហាញ' : 'No document content available'}
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <RenderBlock
                  key={idx}
                  block={block}
                  tableStyle={tableStyle}
                  tableBorderColor={options.tableBorderColor || 'slate'}
                  tableBgColor={options.tableHeaderBg || 'slate-soft'}
                  headerBannerStyle={options.headerBannerStyle || 'none'}
                  headerBgColor={options.headerBgColor}
                  fontSizePt={fontSizePt}
                  firstLineIndent={firstLineIndent}
                  justifyText={justifyText}
                  muolFontName={muolFont}
                  isKm={isKm}
                />
              ))}
            </div>
          )}

          {/* Simulated Word Footer */}
          {options.includePageNumbers && (
            <div className="border-t border-slate-200 pt-4 mt-8 flex justify-center items-center text-[10px] text-slate-400 font-mono select-none">
              <span>— {isKm ? 'ទំព័រទី ១ / Page 1' : 'Page 1'} —</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="bg-slate-100 px-4 py-2 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">
            {isKm
              ? 'ម៉ូដអក្សរមូល, អក្សរដិត, តារាង និងប្លង់រដ្ឋបាលត្រូវបានកំណត់ស្វ័យប្រវត្តិតាម PDF ដើម'
              : 'Font styles, tables and administrative layouts auto-synchronized with original PDF'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
          {paperSize} {orientation === 'landscape' ? 'Landscape' : 'Portrait'} •{' '}
          {customM
            ? `T: ${customM.top}" / B: ${customM.bottom}" / L: ${customM.left}" / R: ${customM.right}"`
            : marginsPreset === 'page-setup'
            ? 'Top 0.69" • B/L/R 0.59"'
            : marginsPreset === 'administrative'
            ? 'Margin: L 3cm / R 2cm'
            : 'Margin: 1 inch'}{' '}
          • 1.5 Spacing
        </span>
      </div>

      {/* Word Page Setup Dialog matching screenshot */}
      <WordPageSetupModal
        isOpen={showPageSetupModal}
        onClose={() => setShowPageSetupModal(false)}
        options={options}
        onOptionsChange={onOptionsChange}
        isKm={isKm}
      />
    </div>
  );
};

/**
 * Component to render individual run with font styles, colors, weights, and detected sizes
 */
const RenderRun: React.FC<{ run: ParsedRun }> = ({ run }) => {
  const styleObj: React.CSSProperties = {};
  if (run.color) {
    styleObj.color = `#${run.color}`;
  }
  if (run.bgColor) {
    styleObj.backgroundColor = `#${run.bgColor}`;
    styleObj.padding = '1px 3px';
    styleObj.borderRadius = '2px';
  }
  if (run.size) {
    styleObj.fontSize = `${run.size / 2}pt`;
  }

  const classes = [
    run.muol ? 'font-moul' : '',
    run.bold ? 'font-bold' : '',
    run.italic ? 'italic' : '',
    run.underline ? 'underline' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes || undefined} style={Object.keys(styleObj).length > 0 ? styleObj : undefined}>
      {run.text}
    </span>
  );
};

interface RenderBoxOrShapeContentProps {
  content: string[];
  blockAlign?: 'left' | 'center' | 'right';
  textColor?: string;
}

const RenderBoxOrShapeContent: React.FC<RenderBoxOrShapeContentProps> = ({
  content,
  blockAlign = 'left',
  textColor,
}) => {
  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed" style={textColor ? { color: textColor } : undefined}>
      {content.map((rawLine, idx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Per-line alignment detection
        let lineAlign = blockAlign;
        let cleanLine = trimmed;
        if (cleanLine.startsWith('[center]') && cleanLine.endsWith('[/center]')) {
          lineAlign = 'center';
          cleanLine = cleanLine.slice(8, -9).trim();
        } else if (cleanLine.startsWith('[right]') && cleanLine.endsWith('[/right]')) {
          lineAlign = 'right';
          cleanLine = cleanLine.slice(7, -8).trim();
        } else if (cleanLine.startsWith('[left]') && cleanLine.endsWith('[/left]')) {
          lineAlign = 'left';
          cleanLine = cleanLine.slice(6, -7).trim();
        }

        // 1. Checklist item: - [ ] or - [x] or ☑
        const checkMatch = cleanLine.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
        if (checkMatch) {
          const isChecked = checkMatch[1].toLowerCase() === 'x';
          const runs = parseInlineRuns(checkMatch[2]);
          return (
            <div key={idx} className="flex items-start gap-2 text-left pl-1">
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center mt-0.5 shrink-0 text-[10px] ${
                  isChecked
                    ? 'bg-blue-600 border-blue-600 text-white font-bold'
                    : 'border-slate-400 bg-white text-transparent'
                }`}
              >
                {isChecked ? '✓' : ''}
              </span>
              <p className={isChecked ? 'line-through opacity-70' : ''}>
                {runs.map((r, ri) => (
                  <RenderRun key={ri} run={r} />
                ))}
              </p>
            </div>
          );
        }

        // 2. Khmer Alphabet list item: ក. or (ក)
        const khmerAlphaMatch = cleanLine.match(/^([ក-អ][\.\)]|\([ក-អ]\))\s+(.*)$/);
        if (khmerAlphaMatch) {
          const runs = parseInlineRuns(khmerAlphaMatch[2]);
          return (
            <div key={idx} className="flex items-start gap-2 text-left pl-1">
              <span className="font-bold text-blue-900 font-khmer shrink-0 min-w-[20px]">
                {khmerAlphaMatch[1]}
              </span>
              <p>
                {runs.map((r, ri) => (
                  <RenderRun key={ri} run={r} />
                ))}
              </p>
            </div>
          );
        }

        // 3. Numbered list item: 1. or 01. or ០១.
        const numMatch = cleanLine.match(/^([០-៩\d]+[\.\)]|\([០-៩\d]+\))\s+(.*)$/);
        if (numMatch) {
          const runs = parseInlineRuns(numMatch[2]);
          return (
            <div key={idx} className="flex items-start gap-2 text-left pl-1">
              <span className="font-bold text-blue-700 font-mono shrink-0 min-w-[18px]">
                {numMatch[1]}
              </span>
              <p>
                {runs.map((r, ri) => (
                  <RenderRun key={ri} run={r} />
                ))}
              </p>
            </div>
          );
        }

        // 4. Custom bullet markers: •, ➢, ▪, ◆, ❖, -, *, etc.
        const bulletMatch = cleanLine.match(/^([•◦∙⁃➢➔➤➜►▶▪▫■□◆◇❖※✽✦✓✔\*\-–—\+])\s+(.*)$/);
        if (bulletMatch) {
          const marker = bulletMatch[1];
          const runs = parseInlineRuns(bulletMatch[2]);
          return (
            <div key={idx} className="flex items-start gap-2 text-left pl-1">
              {marker !== '-' && marker !== '*' ? (
                <span className="font-bold text-blue-700 shrink-0 select-none min-w-[14px]">
                  {marker}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-700 mt-2 shrink-0 select-none" />
              )}
              <p>
                {runs.map((r, ri) => (
                  <RenderRun key={ri} run={r} />
                ))}
              </p>
            </div>
          );
        }

        // 5. Standard line: Parse inline runs (**bold**, *italic*, [color], etc.) and respect alignment
        const runs = parseInlineRuns(cleanLine);
        const alignClass =
          lineAlign === 'center'
            ? 'text-center'
            : lineAlign === 'right'
            ? 'text-right'
            : 'text-left';

        return (
          <p key={idx} className={alignClass}>
            {runs.map((r, ri) => (
              <RenderRun key={ri} run={r} />
            ))}
          </p>
        );
      })}
    </div>
  );
};

const RenderTableCellContent: React.FC<{ rawText: string; align: 'left' | 'center' | 'right' }> = ({
  rawText,
  align,
}) => {
  const lines = rawText
    .split(/(?:<br\s*\/?>|\r?\n)/gi)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return <span className="opacity-0">-</span>;
  }

  return (
    <div className={`space-y-1 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>
      {lines.map((line, lIdx) => {
        // 1. Bullet point item: •, ➢, ▪, ◆, ❖, -, *, +, 1., ០១., ក., (ក)
        const bulletMatch = line.match(/^([•➢➔➤➜►▶▪▫■□◆◇❖※✽✦✓✔\*\-–—\+]|(?:\d+|[០-៩]+|[ក-អ])[\.\)]|\([ក-អ]\))\s*(.*)$/);
        if (bulletMatch) {
          const marker = bulletMatch[1];
          const content = bulletMatch[2];
          const runs = parseInlineRuns(content);
          return (
            <div key={lIdx} className="flex items-start gap-1.5 text-left text-xs sm:text-sm">
              <span className="text-blue-600 font-bold shrink-0">{marker}</span>
              <span className="text-slate-800 leading-snug">
                {runs.map((r, ri) => (
                  <RenderRun key={ri} run={r} />
                ))}
              </span>
            </div>
          );
        }

        // 2. Embedded shape / badge / box: [box]...[/box], [badge]...[/badge], [shape]...[/shape]
        const boxMatch = line.match(/^\[(?:box|badge|shape)\](.*?)\[\/(?:box|badge|shape)\]$/i);
        if (boxMatch) {
          const runs = parseInlineRuns(boxMatch[1]);
          return (
            <div key={lIdx} className="inline-block bg-blue-50 border border-blue-200 text-blue-900 rounded px-2 py-0.5 text-xs font-medium my-0.5">
              {runs.map((r, ri) => (
                <RenderRun key={ri} run={r} />
              ))}
            </div>
          );
        }

        // 3. Embedded image: ![alt](url) or [image:...] or [រូបភាព:...]
        const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)|\[(?:image|រូបភាព)(?::(.*?))?\]/i);
        if (imgMatch) {
          const altOrTitle = imgMatch[1] || imgMatch[3] || 'រូបភាព';
          return (
            <div key={lIdx} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs">
              <span>🖼️</span>
              <span className="font-medium italic">{altOrTitle}</span>
            </div>
          );
        }

        // 4. Standard text line with inline formatting
        const runs = parseInlineRuns(line);
        return (
          <div key={lIdx} className="leading-snug text-xs sm:text-sm text-slate-800">
            {runs.map((r, ri) => (
              <RenderRun key={ri} run={r} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

interface RenderBlockProps {
  block: ParsedBlock;
  tableStyle: WordTableStyle;
  tableBorderColor?: WordTableBorderColor;
  tableBgColor?: WordTableBgColor;
  headerBannerStyle?: WordHeaderBannerStyle;
  headerBgColor?: string;
  fontSizePt: number;
  firstLineIndent: boolean;
  justifyText: boolean;
  muolFontName: string;
  isKm: boolean;
}

const RenderBlock: React.FC<RenderBlockProps> = ({
  block,
  tableStyle,
  tableBorderColor,
  tableBgColor,
  headerBannerStyle = 'none',
  headerBgColor,
  fontSizePt,
  firstLineIndent,
  justifyText,
  muolFontName,
  isKm,
}) => {
  // 1. Page Break
  if (block.type === 'page-break') {
    return (
      <div className="my-6 py-2 border-t-2 border-dashed border-blue-200 bg-blue-50/50 rounded flex items-center justify-center gap-2 text-xs font-semibold text-blue-700 select-none">
        <FileText className="w-3.5 h-3.5" />
        <span>{isKm ? `ទំព័រថ្មី (ទំព័រទី ${block.pageNumber})` : `Page Break (Page ${block.pageNumber})`}</span>
      </div>
    );
  }

  // 2. Divider
  if (block.type === 'divider') {
    return <hr className="my-4 border-t border-slate-300" />;
  }

  // 3. Administrative 2-Column Header
  if (block.type === 'header-layout') {
    const isDouble = block.borderBottom === 'double' || headerBannerStyle === 'bordered-double';
    const isSingle = block.borderBottom === 'single' || headerBannerStyle === 'bordered-single';
    const isDashed = block.borderBottom === 'dashed';
    const effectiveBg =
      block.bgColor
        ? `#${block.bgColor}`
        : headerBgColor
        ? `#${headerBgColor}`
        : headerBannerStyle === 'tinted'
        ? '#F8FAFC'
        : undefined;

    let borderBottomClass = 'border-b border-transparent';
    if (isDouble) borderBottomClass = 'border-b-4 border-double border-blue-600 pb-3';
    else if (isSingle) borderBottomClass = 'border-b-2 border-slate-300 pb-3';
    else if (isDashed) borderBottomClass = 'border-b-2 border-dashed border-slate-300 pb-3';

    return (
      <div
        className={`grid grid-cols-2 gap-4 my-3 items-start p-3 rounded-lg ${borderBottomClass}`}
        style={{ backgroundColor: effectiveBg }}
      >
        {/* Left column: Ministry / Department / Ref number */}
        <div className="space-y-1">
          {block.leftLines.map((line, idx) => (
            <p
              key={idx}
              className={`${
                idx === 0 ? 'font-bold font-moul text-slate-900 text-sm' : 'text-slate-800 text-xs sm:text-sm'
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Right column: Kingdom of Cambodia, Motto, Date */}
        <div className="text-center space-y-1">
          {block.rightLines.map((line, idx) => {
            const isMotto =
              line.includes('ព្រះរាជាណាចក្រកម្ពុជា') ||
              line.includes('ជាតិ  សាសនា  ព្រះមហាក្សត្រ') ||
              line.includes('ជាតិ សាសនា ព្រះមហាក្សត្រ');

            return (
              <p
                key={idx}
                className={`${
                  isMotto
                    ? 'font-moul font-bold text-slate-900 text-sm sm:text-base tracking-wide'
                    : 'text-slate-700 text-xs sm:text-sm'
                }`}
              >
                {line.replace(/\[\/?muol\]/g, '')}
              </p>
            );
          })}
          {block.hasFlourish && (
            <div className="flex justify-center py-1">
              <span className="text-blue-600 font-bold tracking-widest text-xs select-none">
                ~ ❖ ~
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. Muol Headings (Royal Motto or Official Title)
  if (block.type === 'muol-heading') {
    const isRoyal = block.level === 1;
    return (
      <div className="my-3 text-center">
        <h2
          className={`font-moul font-bold text-slate-900 tracking-wide ${
            isRoyal ? 'text-base sm:text-lg pt-1 pb-1' : 'text-sm sm:text-base pt-2 pb-1'
          }`}
          style={{ fontSize: isRoyal ? `${fontSizePt + 4}pt` : `${fontSizePt + 2}pt` }}
        >
          {block.text}
        </h2>
        {block.hasFlourish && (
          <div className="flex justify-center py-1">
            <span className="text-blue-600 font-bold tracking-widest text-xs select-none">
              ~ ❖ ~
            </span>
          </div>
        )}
      </div>
    );
  }

  // 5. Headings (H1, H2, H3)
  if (block.type === 'heading') {
    if (block.level === 1) {
      return (
        <h1
          className={`font-bold text-slate-900 pt-3 pb-1 border-b border-slate-100 ${
            block.isMuol ? 'font-moul text-center' : ''
          }`}
          style={{ fontSize: `${fontSizePt + 5}pt` }}
        >
          {block.text}
        </h1>
      );
    }
    if (block.level === 2) {
      return (
        <h2
          className={`font-bold text-slate-800 pt-2 pb-0.5 ${block.isMuol ? 'font-moul' : ''}`}
          style={{ fontSize: `${fontSizePt + 3}pt` }}
        >
          {block.text}
        </h2>
      );
    }
    return (
      <h3
        className="font-semibold text-slate-800 pt-1"
        style={{ fontSize: `${fontSizePt + 1}pt` }}
      >
        {block.text}
      </h3>
    );
  }

  // 6. Signature Layout Block
  if (block.type === 'signature-layout') {
    // If multi-column signature (e.g. 1, 2, or 3 columns matching original layout)
    if (block.columns && block.columns.length > 0) {
      const colCount = block.columns.length;
      const gridClass =
        colCount === 1
          ? 'grid-cols-1'
          : colCount === 2
          ? 'grid-cols-2'
          : colCount === 3
          ? 'grid-cols-3'
          : 'grid-cols-4';

      return (
        <div className={`grid ${gridClass} gap-4 my-8 items-start w-full`}>
          {block.columns.map((col, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-1">
              {col.date && (
                <div className="space-y-0.5 mb-1">
                  {col.date.split('\n').map((dl, dIdx) => (
                    <p key={dIdx} className="text-xs italic text-slate-600 leading-snug">
                      {dl.trim()}
                    </p>
                  ))}
                </div>
              )}
              {col.title && (
                <p className="font-semibold text-xs sm:text-sm text-slate-900 font-moul leading-snug">
                  {col.title.replace(/^\*\*|\*\*$/g, '').replace(/\[\/?(?:muol|bold)\]/g, '').trim()}
                </p>
              )}
              {col.role && (
                <div className="space-y-0.5">
                  {col.role.split('\n').map((rl, rIdx) => (
                    <p key={rIdx} className="font-bold text-xs sm:text-sm text-slate-900 font-moul leading-snug">
                      {rl.replace(/\[\/?(?:muol|bold)\]/g, '').trim()}
                    </p>
                  ))}
                </div>
              )}

              {/* Natural clean space for physical signature and stamp - matches original document without artificial dashed boxes */}
              <div className="h-20 sm:h-24 w-full" aria-hidden="true" />

              {col.name && (
                <p className="font-bold text-sm text-slate-900 font-moul leading-snug">
                  {col.name.replace(/\[\/?name\]/g, '').replace(/^\*\*|\*\*$/g, '').trim()}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Default 2-column fallback (Left: CC, Right: Single Authority)
    return (
      <div className="grid grid-cols-2 gap-4 my-8 items-start w-full">
        {/* Left: CC list if present */}
        <div>
          {block.ccList && block.ccList.length > 0 && (
            <div className="text-xs text-slate-600 space-y-0.5">
              <p className="font-bold underline text-slate-800">កន្លែងទទួល៖</p>
              {block.ccList.map((cc, i) => (
                <p key={i}>- {cc}</p>
              ))}
            </div>
          )}
        </div>

        {/* Right: Date, Role, Signature clearance, Signer Name */}
        <div className="text-center space-y-1">
          {block.date && <p className="text-xs sm:text-sm italic text-slate-700">{block.date}</p>}
          {block.role && <p className="font-bold font-moul text-xs sm:text-sm text-slate-900">{block.role}</p>}

          {/* Clean clearance for signature and stamp */}
          <div className="h-20 sm:h-24 w-full" aria-hidden="true" />

          {block.name && <p className="font-bold text-sm text-slate-900">{block.name}</p>}
        </div>
      </div>
    );
  }

  // 6b. Document Footer Block (Double top border, Left info, Right page number)
  if (block.type === 'doc-footer') {
    return (
      <div className="my-6 pt-3 border-t-2 border-double border-slate-700 flex justify-between items-end text-xs text-slate-700 w-full">
        <div className="space-y-0.5 text-left">
          {block.leftLines.map((line, idx) => (
            <p key={idx} className={idx === 0 ? 'font-medium text-slate-900' : 'text-slate-600'}>
              {line}
            </p>
          ))}
        </div>
        <div className="text-right font-semibold text-slate-900">
          {block.rightLines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      </div>
    );
  }


  // Image Block
  if (block.type === "image") {
    const alignClass =
      block.align === 'left' ? 'items-start text-left' : block.align === 'right' ? 'items-end text-right' : 'items-center text-center';
    return (
      <div className={`my-5 flex flex-col ${alignClass}`}>
        <div className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white max-w-full p-1.5">
          {block.dataUrl ? (
            <img
              src={block.dataUrl}
              alt={block.alt || "Document Image"}
              className="max-h-96 w-auto object-contain rounded"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-64 h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
              [រូបភាព PDF / PDF Image]
            </div>
          )}
        </div>
        {block.caption && (
          <p className="text-xs text-slate-500 italic mt-1.5 text-center">{block.caption}</p>
        )}
      </div>
    );
  }

  // Decorated Shape Block (Seal, Badge, Ribbon, Rounded Callout)
  if (block.type === "shape") {
    const borderColor = block.borderColor ? "#" + block.borderColor : "#1D4ED8";
    const bgColor = block.bgColor ? "#" + block.bgColor : "#EFF6FF";
    const textColor = block.textColor ? "#" + block.textColor : "#1E3A8A";
    const style = block.borderStyle || "double";

    let borderClass = "border-2 border-solid";
    if (style === "double") borderClass = "border-4 border-double";
    if (style === "dashed") borderClass = "border-2 border-dashed";
    if (style === "dotted") borderClass = "border-2 border-dotted";

    if (block.shapeType === "ribbon") {
      borderClass = "border-y-4 border-double border-x-0";
    } else if (block.shapeType === "header-accent") {
      borderClass = "border-l-4 border-b border-t-0 border-r-0";
    } else if (block.shapeType === "divider-shape") {
      borderClass = "border-b-4 border-double border-t-0 border-x-0";
    }

    const alignStyle =
      block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left';
    const alignJustify =
      block.align === 'center' ? 'justify-center text-center' : block.align === 'right' ? 'justify-end text-right' : 'justify-start text-left';

    return (
      <div
        className={"my-5 p-4 rounded-lg " + borderClass}
        style={{ borderColor, backgroundColor: bgColor, color: textColor }}
      >
        {block.title && (
          <div className={`flex items-center gap-2 mb-2 ${alignJustify}`}>
            {block.icon && <span className="text-base">{block.icon}</span>}
            <h3 className="font-moul font-bold text-sm sm:text-base">{block.title}</h3>
          </div>
        )}
        {block.subtitle && (
          <p className={`text-xs italic mb-2 opacity-90 ${alignStyle}`}>{block.subtitle}</p>
        )}
        {block.content && block.content.length > 0 && (
          <RenderBoxOrShapeContent
            content={block.content}
            blockAlign={block.align || 'left'}
            textColor={textColor}
          />
        )}
      </div>
    );
  }

  // 7. Callout Box / Announcement
  if (block.type === 'box') {
    const borderColor = block.borderColor ? `#${block.borderColor}` : '#2563EB';
    const bgColor = block.bgColor ? `#${block.bgColor}` : '#EFF6FF';
    const style = block.borderStyle || 'accent-left';

    let borderStyleClass = 'border-l-4';
    let inlineBorderStyle: React.CSSProperties = {
      backgroundColor: bgColor,
      borderLeftColor: borderColor,
    };

    if (style === 'double') {
      borderStyleClass = 'border-4 border-double';
      inlineBorderStyle = { backgroundColor: bgColor, borderColor };
    } else if (style === 'dashed') {
      borderStyleClass = 'border-2 border-dashed';
      inlineBorderStyle = { backgroundColor: bgColor, borderColor };
    } else if (style === 'dotted') {
      borderStyleClass = 'border-2 border-dotted';
      inlineBorderStyle = { backgroundColor: bgColor, borderColor };
    } else if (style === 'single') {
      borderStyleClass = 'border-2 border-solid';
      inlineBorderStyle = { backgroundColor: bgColor, borderColor };
    } else if (style === 'none') {
      borderStyleClass = 'border-none';
      inlineBorderStyle = { backgroundColor: bgColor };
    }

    const boxTitleAlign =
      block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left';

    return (
      <div
        className={`my-4 p-4 rounded-lg ${borderStyleClass}`}
        style={inlineBorderStyle}
      >
        {block.title && (
          <h4 className={`font-moul font-bold text-slate-900 text-sm mb-2 ${boxTitleAlign}`}>
            {block.title}
          </h4>
        )}
        {block.content && block.content.length > 0 && (
          <RenderBoxOrShapeContent
            content={block.content}
            blockAlign={block.align || 'left'}
          />
        )}
      </div>
    );
  }

  // 8. Table Block
  if (block.type === 'table') {
    const isMinimal = tableStyle === 'minimal' || block.borderStyle === 'minimal';
    const isStriped = tableStyle === 'striped' || block.borderStyle === 'striped';
    const isDouble = block.borderStyle === 'double';
    const isDashed = block.borderStyle === 'dashed';
    const isDotted = block.borderStyle === 'dotted';
    const isThick = block.borderStyle === 'thick';
    const isBorderless = block.borderStyle === 'borderless';

    const borderColorsMap: Record<string, string> = {
      slate: '#CBD5E1',
      blue: '#93C5FD',
      amber: '#FCD34D',
      emerald: '#86EFAC',
      crimson: '#FCA5A5',
      dark: '#475569',
    };

    const headerBgsMap: Record<string, string> = {
      'slate-soft': '#F1F5F9',
      'blue-soft': '#EFF6FF',
      'amber-soft': '#FEF3C7',
      'emerald-soft': '#ECFDF5',
      'navy-royal': '#1E293B',
      white: '#FFFFFF',
    };

    const headerBg = block.headerBgColor
      ? `#${block.headerBgColor}`
      : headerBgsMap[tableBgColor || 'slate-soft'] || '#F1F5F9';

    const borderColor = block.borderColor
      ? `#${block.borderColor}`
      : borderColorsMap[tableBorderColor || 'slate'] || '#CBD5E1';

    let tableBorderClass = 'border border-slate-200';
    if (isDouble) tableBorderClass = 'border-4 border-double';
    else if (isDashed) tableBorderClass = 'border-2 border-dashed';
    else if (isDotted) tableBorderClass = 'border-2 border-dotted';
    else if (isThick) tableBorderClass = 'border-2';
    else if (isBorderless) tableBorderClass = 'border-none';

    return (
      <div className={`my-4 overflow-x-auto rounded-lg shadow-2xs ${tableBorderClass}`} style={{ borderColor }}>
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/90 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <TableIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>{isKm ? 'តារាងទិន្នន័យ' : 'Data Table'}</span>
            <span className="text-[10px] font-normal text-slate-500 font-mono">
              ({block.rows.length} {isKm ? 'ជួរដេក' : 'rows'} × {block.headers.length} {isKm ? 'ជួរឈរ' : 'cols'})
            </span>
          </div>
          <button
            onClick={() => {
              const tsvMarkdown = `| ${block.headers.join(' | ')} |\n| ${block.headers.map(() => '---').join(' | ')} |\n` + block.rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
              const res = exportToExcelFile(tsvMarkdown, 'តារាងទិន្នន័យ.xlsx');
              triggerDownload(res.blob, res.fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            }}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md cursor-pointer transition-colors shadow-2xs"
            title={isKm ? 'ទាញយកតារាងនេះជាឯកសារ Excel (.xlsx)' : 'Export this table to Excel (.xlsx)'}
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
            <span>{isKm ? 'ទាញយកជា Excel (.xlsx)' : 'Export Table to Excel'}</span>
          </button>
        </div>
        <table className="w-full border-collapse text-left" style={{ fontSize: `${fontSizePt}pt` }}>
          <thead>
            <tr
              className="border-b"
              style={{
                backgroundColor: headerBg,
                borderColor,
                color: headerBg === '#1E293B' ? '#FFFFFF' : '#0F172A',
              }}
            >
              {block.headers.map((h, i) => {
                const align = block.alignments[i] || 'left';
                return (
                  <th
                    key={i}
                    className={`py-2.5 px-3 font-bold border-r last:border-r-0 ${
                      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                    }`}
                    style={{ borderColor }}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIdx) => {
              return (
                <tr
                  key={rowIdx}
                  className={`${
                    isMinimal ? 'border-b last:border-b-0' : 'border-b'
                  }`}
                  style={{ borderColor }}
                >
                  {row.map((cellText, colIdx) => {
                    const align = block.alignments[colIdx] || 'left';
                    const bgMatch = cellText.match(/\[bg:([#a-zA-Z0-9]+)\](.*?)\[\/bg\]/i);
                    let cellBg = isStriped && rowIdx % 2 === 1 ? '#F8FAFC' : undefined;
                    let displayContent = cellText;

                    if (bgMatch) {
                      cellBg = '#' + bgMatch[1].replace(/^#/, '');
                      displayContent = cellText.replace(/\[bg:[#a-zA-Z0-9]+\]/gi, '').replace(/\[\/bg\]/gi, '');
                    }

                    const isSuccess =
                      displayContent.includes('រួចរាល់') || displayContent.includes('ល្អ') || displayContent.includes('សកម្ម') || displayContent.includes('Done');

                    return (
                      <td
                        key={colIdx}
                        className={`py-2 px-3 ${
                          isSuccess ? 'text-emerald-700 font-semibold' : 'text-slate-800'
                        } ${!isMinimal && !isBorderless ? 'border-r last:border-r-0' : ''} ${
                          align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                        }`}
                        style={{ backgroundColor: cellBg, borderColor }}
                      >
                        <RenderTableCellContent rawText={displayContent} align={align} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // 9. Standard Bullet List
  if (block.type === 'bullet') {
    const indentLevel = block.level || 0;
    const paddingLeftClass = indentLevel === 2 ? 'pl-10' : indentLevel === 1 ? 'pl-7' : 'pl-4';
    return (
      <div className={`flex items-start gap-2.5 my-1 ${paddingLeftClass}`}>
        {block.marker && block.marker !== '-' && block.marker !== '*' ? (
          <span className="font-bold text-blue-700 shrink-0 text-sm select-none min-w-[16px]">
            {block.marker}
          </span>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-2 shrink-0 select-none" />
        )}
        <p className="text-slate-800">
          {block.runs.map((r, i) => (
            <RenderRun key={i} run={r} />
          ))}
        </p>
      </div>
    );
  }

  // 10. Khmer Letter Bullet List (e.g. ក., ខ., គ.)
  if (block.type === 'khmer-bullet') {
    const indentLevel = block.level || 0;
    const paddingLeftClass = indentLevel === 2 ? 'pl-10' : indentLevel === 1 ? 'pl-7' : 'pl-4';
    return (
      <div className={`flex items-start gap-2 my-1 ${paddingLeftClass}`}>
        <span className="font-bold text-slate-900 shrink-0 font-khmer text-sm min-w-[24px]">
          {block.marker}
        </span>
        <p className="text-slate-800">
          {block.runs.map((r, i) => (
            <RenderRun key={i} run={r} />
          ))}
        </p>
      </div>
    );
  }

  // 11. Checklist item (e.g. [ ] or [x])
  if (block.type === 'checklist') {
    const indentLevel = block.level || 0;
    const paddingLeftClass = indentLevel === 2 ? 'pl-10' : indentLevel === 1 ? 'pl-7' : 'pl-4';
    return (
      <div className={`flex items-start gap-2.5 my-1 ${paddingLeftClass}`}>
        <span
          className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 shrink-0 text-xs ${
            block.checked
              ? 'bg-blue-600 border-blue-600 text-white font-bold'
              : 'border-slate-400 bg-white text-transparent'
          }`}
        >
          {block.checked ? '✓' : ''}
        </span>
        <p className={`text-slate-800 ${block.checked ? 'line-through text-slate-500' : ''}`}>
          {block.runs.map((r, i) => (
            <RenderRun key={i} run={r} />
          ))}
        </p>
      </div>
    );
  }

  // 12. Numbered List
  if (block.type === 'numbered') {
    const indentLevel = block.level || 0;
    const paddingLeftClass = indentLevel === 2 ? 'pl-10' : indentLevel === 1 ? 'pl-7' : 'pl-4';
    return (
      <div className={`flex items-start gap-2 my-1 ${paddingLeftClass}`}>
        <span className="font-bold text-blue-700 shrink-0 font-mono text-sm">
          {block.marker}
        </span>
        <p className="text-slate-800">
          {block.runs.map((r, i) => (
            <RenderRun key={i} run={r} />
          ))}
        </p>
      </div>
    );
  }

  // 13. Paragraph with Justification and First-Line Indent
  if (block.type === 'paragraph') {
    const isCentered = block.alignment === 'center';
    const isRight = block.alignment === 'right';
    const isJustified = (block.alignment === 'both' || justifyText) && !isCentered && !isRight;
    const isContinuation = block.isBulletContinuation;
    const indentLevel = block.indentLevel || 0;
    const shouldIndent = block.isFirstLineIndent && firstLineIndent && !isCentered && !isRight && !isContinuation;
    const continuationPaddingClass = isContinuation
      ? indentLevel === 2 ? 'pl-10' : indentLevel === 1 ? 'pl-7' : 'pl-6'
      : '';

    return (
      <p
        className={`my-1 text-slate-800 ${
          isCentered
            ? 'text-center font-medium'
            : isRight
            ? 'text-right'
            : isJustified
            ? 'text-justify'
            : 'text-left'
        } ${shouldIndent ? 'indent-8' : ''} ${continuationPaddingClass}`}
      >
        {block.runs.map((r, i) => (
          <RenderRun key={i} run={r} />
        ))}
      </p>
    );
  }

  if (block.type === 'paper-setting') {
    return null;
  }

  return null;
};
