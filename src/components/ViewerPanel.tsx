import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileCheck,
  RotateCcw as ResetIcon,
} from 'lucide-react';
import type { Language, PageInfo } from '../types';
import { renderPageToCanvas, rotatePdfPages, rearrangePdfPages, triggerDownload } from '../utils/pdfHelper';

interface ViewerPanelProps {
  lang: Language;
  pdfDoc: any;
  pdfBytes: Uint8Array;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPdfBytesUpdated: (newBytes: Uint8Array) => void;
  fileName: string;
}

export const ViewerPanel: React.FC<ViewerPanelProps> = ({
  lang,
  pdfDoc,
  pdfBytes,
  totalPages,
  currentPage,
  onPageChange,
  onPdfBytesUpdated,
  fileName,
}) => {
  const isKm = lang === 'km';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState<number>(1.2);
  const [pageRotations, setPageRotations] = useState<{ [pageIndex: number]: number }>({});
  const [isRendering, setIsRendering] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ [page: number]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Render current page when page, scale, or rotation changes
  useEffect(() => {
    let isCancelled = false;
    async function render() {
      if (!pdfDoc || !canvasRef.current) return;
      setIsRendering(true);
      try {
        const customRot = pageRotations[currentPage - 1] || 0;
        const page = await pdfDoc.getPage(currentPage);
        const totalRot = (page.rotate + customRot) % 360;
        const viewport = page.getViewport({ scale, rotation: totalRot });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx || isCancelled) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    }

    render();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale, pageRotations]);

  // Generate lightweight thumbnails for sidebar
  useEffect(() => {
    let isCancelled = false;
    async function generateThumbnails() {
      if (!pdfDoc) return;
      const thumbs: { [page: number]: string } = {};

      for (let i = 1; i <= Math.min(totalPages, 20); i++) {
        if (isCancelled) break;
        try {
          const res = await renderPageToCanvas(pdfDoc, i, 0.25);
          thumbs[i] = res.dataUrl;
        } catch (e) {
          console.warn('Error rendering thumb', i, e);
        }
      }
      if (!isCancelled) setThumbnails(thumbs);
    }

    generateThumbnails();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, totalPages]);

  // Page Rotate
  const handleRotatePage = (delta: number) => {
    const pageIdx = currentPage - 1;
    const current = pageRotations[pageIdx] || 0;
    const newRot = (current + delta + 360) % 360;
    setPageRotations({ ...pageRotations, [pageIdx]: newRot });
  };

  // Delete Current Page
  const handleDeleteCurrentPage = async () => {
    if (totalPages <= 1) {
      alert(isKm ? 'មិនអាចលុបទំព័រចុងក្រោយនៃឯកសារបានទេ!' : 'Cannot delete the only page in document!');
      return;
    }
    const confirmed = confirm(
      isKm
        ? `តើអ្នកប្រាកដជាចង់លុបទំព័រទី ${currentPage} នេះមែនទេ?`
        : `Are you sure you want to delete page ${currentPage}?`
    );
    if (!confirmed) return;

    try {
      setIsSaving(true);
      const keepIndices: number[] = [];
      for (let i = 0; i < totalPages; i++) {
        if (i !== currentPage - 1) keepIndices.push(i);
      }
      const newPdfBytes = await rearrangePdfPages(pdfBytes, keepIndices);
      onPdfBytesUpdated(newPdfBytes);
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete page');
    } finally {
      setIsSaving(false);
    }
  };

  // Move page position
  const handleMovePage = async (direction: 'up' | 'down') => {
    const currentIdx = currentPage - 1;
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= totalPages) return;

    try {
      setIsSaving(true);
      const newOrder = Array.from({ length: totalPages }, (_, i) => i);
      const temp = newOrder[currentIdx];
      newOrder[currentIdx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;

      const newPdfBytes = await rearrangePdfPages(pdfBytes, newOrder);
      onPdfBytesUpdated(newPdfBytes);
      onPageChange(targetIdx + 1);
    } catch (e: any) {
      alert(e.message || 'Failed to reorder page');
    } finally {
      setIsSaving(false);
    }
  };

  // Save changes to PDF
  const handleSaveModifiedPdf = async () => {
    try {
      setIsSaving(true);
      let updatedBytes = pdfBytes;
      if (Object.keys(pageRotations).length > 0) {
        updatedBytes = await rotatePdfPages(pdfBytes, pageRotations);
      }
      triggerDownload(updatedBytes, `managed_${fileName}`);
    } catch (e: any) {
      alert(e.message || 'Failed to export PDF');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 flex flex-col h-[calc(100vh-135px)]">
      {/* Viewer Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        {/* Page Nav */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-prev-page"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 px-2">
            <span>{isKm ? 'ទំព័រ' : 'Page'}</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= totalPages) onPageChange(val);
              }}
              className="w-12 py-1 px-1.5 text-center bg-slate-50 border border-slate-300 rounded font-bold text-slate-900"
            />
            <span className="text-slate-400">/ {totalPages}</span>
          </div>

          <button
            id="btn-next-page"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-x border-slate-200 px-2">
          <button
            id="btn-zoom-out"
            onClick={() => setScale(Math.max(0.6, scale - 0.2))}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-700 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            onClick={() => setScale(Math.min(2.5, scale + 0.2))}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(1.0)}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
            title="Reset Zoom"
          >
            100%
          </button>
        </div>

        {/* Page Management (Rotate, Move, Delete) */}
        <div className="flex items-center gap-1">
          <button
            id="btn-rotate-ccw"
            onClick={() => handleRotatePage(-90)}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={isKm ? 'បង្វិលឆ្វេង ៩០°' : 'Rotate 90° Left'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="btn-rotate-cw"
            onClick={() => handleRotatePage(90)}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={isKm ? 'បង្វិលស្តាំ ៩០°' : 'Rotate 90° Right'}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-slate-200 mx-1" />

          <button
            id="btn-move-page-up"
            disabled={currentPage <= 1}
            onClick={() => handleMovePage('up')}
            className="p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
            title={isKm ? 'រំកិលទំព័រឡើងលើ' : 'Move Page Up'}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            id="btn-move-page-down"
            disabled={currentPage >= totalPages}
            onClick={() => handleMovePage('down')}
            className="p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
            title={isKm ? 'រំកិលទំព័រចុះក្រោម' : 'Move Page Down'}
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          <button
            id="btn-delete-page"
            onClick={handleDeleteCurrentPage}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title={isKm ? 'លុបទំព័រនេះចេញ' : 'Delete Page'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Download / Export current PDF */}
        <button
          id="btn-save-pdf"
          disabled={isSaving}
          onClick={handleSaveModifiedPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isKm ? 'ទាញយក PDF បានកែសម្រួល' : 'Download PDF'}</span>
        </button>
      </div>

      {/* Main Content: Thumbnail Strip + Canvas Viewer */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Left Thumbnail Bar */}
        <div className="w-24 sm:w-36 bg-white border border-slate-200 rounded-xl p-2 overflow-y-auto flex flex-col gap-2 shrink-0">
          <div className="text-[11px] font-bold text-slate-500 uppercase px-1 pb-1 border-b border-slate-100">
            {isKm ? 'ទំព័រទាំងអស់' : 'Pages'}
          </div>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
            <button
              key={pNum}
              onClick={() => onPageChange(pNum)}
              className={`flex flex-col items-center p-1 rounded-lg transition-all cursor-pointer text-left border ${
                currentPage === pNum
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="w-full aspect-[1/1.4] bg-slate-100 rounded flex items-center justify-center overflow-hidden mb-1">
                {thumbnails[pNum] ? (
                  <img
                    src={thumbnails[pNum]}
                    alt={`Page ${pNum}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-400">{pNum}</span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-700">{pNum}</span>
            </button>
          ))}
        </div>

        {/* Center Canvas View Area */}
        <div
          ref={containerRef}
          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl overflow-auto p-4 sm:p-8 flex items-center justify-center relative"
        >
          {isRendering && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 flex items-center gap-2 z-10">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>{isKm ? 'កំពុងបង្ហាញ...' : 'Rendering...'}</span>
            </div>
          )}

          <div className="shadow-lg border border-slate-300 bg-white transition-all rounded-xs overflow-hidden">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>
      </div>
    </div>
  );
};
