import React, { useState } from 'react';
import { Lock, Key, AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import type { Language } from '../types';

interface PasswordPromptModalProps {
  isOpen: boolean;
  lang: Language;
  fileName: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  error?: string | null;
  isLoading: boolean;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  isOpen,
  lang,
  fileName,
  onSubmit,
  onCancel,
  error,
  isLoading,
}) => {
  const isKm = lang === 'km';
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isKm ? 'ឯកសារនេះត្រូវបានការពារដោយលេខសម្ងាត់' : 'Password Protected Document'}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[220px]" title={fileName}>
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
          {isKm
            ? 'ឯកសារ PDF នេះមានការការពារកូដនីយកម្ម។ សូមបញ្ចូលលេខសម្ងាត់ត្រឹមត្រូវដើម្បីបើកមើល និងដំណើរការបន្ត។'
            : 'This PDF file is encrypted. Please enter the correct password to unlock and process it.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Key className="w-4 h-4" />
            </div>
            <input
              id="input-doc-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isKm ? 'បញ្ចូលលេខសម្ងាត់...' : 'Enter document password...'}
              autoFocus
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {isKm ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              id="btn-submit-password"
              type="submit"
              disabled={!password.trim() || isLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isKm ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isKm ? 'បើកឯកសារ' : 'Unlock Document'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
