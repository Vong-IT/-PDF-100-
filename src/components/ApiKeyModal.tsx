import React, { useState } from 'react';
import { Key, ExternalLink, Check, Eye, EyeOff, X, Sparkles, ShieldCheck } from 'lucide-react';
import { getStoredGeminiApiKey, setStoredGeminiApiKey } from '../utils/aiOcrService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (key: string) => void;
  lang?: 'km' | 'en';
  onSwitchToNative?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  lang = 'km',
  onSwitchToNative,
}) => {
  const isKm = lang === 'km';
  const [apiKey, setApiKey] = useState<string>(() => getStoredGeminiApiKey());
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredGeminiApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onSaved?.(apiKey);
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setApiKey('');
    setStoredGeminiApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isKm ? 'ការកំណត់ Gemini API Key (សម្រាប់ GitHub Pages)' : 'Gemini API Key Settings'}
              </h3>
              <p className="text-xs text-slate-500">
                {isKm ? 'បើកដំណើរការ AI OCR ដោយផ្ទាល់លើ Browser' : 'Enable client-side AI OCR on static hosting'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {isKm ? 'ហេតុអ្វីត្រូវការ API Key នៅលើ GitHub?' : 'Why is an API Key needed on GitHub?'}
              </span>
              <p className="mt-0.5 text-blue-800">
                {isKm
                  ? 'ដោយសារ GitHub Pages គឺជា Static Host (គ្មាន Server Backend) ការបញ្ចូល API Key ឥតគិតថ្លៃ នឹងអនុញ្ញាតឱ្យ Browser របស់អ្នកស្រង់អក្សរខ្មែរតាមរយៈ Google Gemini AI បានដោយផ្ទាល់ និងរហ័ស!'
                  : 'Because GitHub Pages is static without a backend server, providing a free Gemini API Key enables your browser to transcribe Khmer text directly.'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isKm ? 'Gemini API Key របស់អ្នក' : 'Your Gemini API Key'}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl text-xs sm:text-sm font-mono text-slate-800 outline-none transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                  title={showKey ? 'Hide' : 'Show'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isKm ? 'រក្សាទុកតែលើ Browser របស់អ្នកប៉ុណ្ណោះ' : 'Stored securely in your local browser'}
              </span>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                >
                  {isKm ? 'លុបចេញ' : 'Clear Key'}
                </button>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-slate-800">
                {isKm ? 'មិនទាន់មាន Key មែនទេ?' : "Don't have an API key?"}
              </p>
              <p className="text-[11px] text-slate-500">
                {isKm ? 'ទទួលបាន Free API Key ពី Google' : 'Get a free key from Google AI Studio'}
              </p>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-medium rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>{isKm ? 'យក Key ឥតគិតថ្លៃ' : 'Get Free Key'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {onSwitchToNative && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onSwitchToNative();
                  onClose();
                }}
                className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>
                  {isKm
                    ? '👉 ប្រើប្រាស់ការស្រង់អក្សរផ្ទាល់ (Native Extraction - ឥតគិតថ្លៃ មិនបាច់ប្រើ Key)'
                    : '👉 Switch to Native Extraction (100% Free, No Key Required)'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            {isKm ? 'បោះបង់' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Key className="w-4 h-4" />}
            <span>{isSaved ? (isKm ? 'បានរក្សាទុក!' : 'Saved!') : (isKm ? 'រក្សាទុក Key' : 'Save Key')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
