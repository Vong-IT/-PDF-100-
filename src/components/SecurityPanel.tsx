import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Stamp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileLock,
  Layers,
} from 'lucide-react';
import type { Language, SecurityOptions, WatermarkOptions } from '../types';
import { applyWatermarkToPdf, triggerDownload } from '../utils/pdfHelper';

interface SecurityPanelProps {
  lang: Language;
  pdfBytes: Uint8Array;
  fileName: string;
  isEncrypted: boolean;
  activePassword?: string;
  onPdfBytesUpdated: (newBytes: Uint8Array) => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({
  lang,
  pdfBytes,
  fileName,
  isEncrypted,
  activePassword = '',
  onPdfBytesUpdated,
}) => {
  const isKm = lang === 'km';

  // Sub-tabs: 'encrypt' | 'watermark' | 'decrypt'
  const [subTab, setSubTab] = useState<'encrypt' | 'watermark' | 'decrypt'>(
    isEncrypted ? 'decrypt' : 'encrypt'
  );

  // Encryption State
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [canPrint, setCanPrint] = useState(true);
  const [canCopy, setCanCopy] = useState(false);
  const [canModify, setCanModify] = useState(false);
  const [canAnnotate, setCanAnnotate] = useState(true);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptSuccessMsg, setEncryptSuccessMsg] = useState<string | null>(null);

  // Decryption State
  const [decryptPassword, setDecryptPassword] = useState(activePassword);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptSuccessMsg, setDecryptSuccessMsg] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Watermark State
  const [watermarkText, setWatermarkText] = useState('សម្ងាត់ / CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkRotation, setWatermarkRotation] = useState(-35);
  const [watermarkFontSize, setWatermarkFontSize] = useState(42);
  const [watermarkColor, setWatermarkColor] = useState('#dc2626'); // Red
  const [repeatWatermark, setRepeatWatermark] = useState(false);
  const [isWatermarking, setIsWatermarking] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 4);
  };

  const passwordScore = getPasswordStrength(userPassword);

  // 1. Handle Encrypt PDF
  const handleEncryptPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPassword) {
      alert(isKm ? 'សូមបញ្ចូលលេខសម្ងាត់!' : 'Please enter a password!');
      return;
    }
    if (userPassword !== confirmPassword) {
      alert(isKm ? 'លេខសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ!' : 'Passwords do not match!');
      return;
    }

    try {
      setIsEncrypting(true);
      setEncryptSuccessMsg(null);

      // Convert pdfBytes to base64
      let binary = '';
      const len = pdfBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(pdfBytes[i]);
      }
      const pdfBase64 = btoa(binary);

      const resp = await fetch('/api/pdf/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          userPassword,
          ownerPassword: ownerPassword || undefined,
          permissions: {
            canPrint,
            canCopy,
            canModify,
            canAnnotate,
          },
        }),
      });

      let data: any = null;
      try {
        data = await resp.json();
      } catch (_e) {
        throw new Error(
          isKm
            ? 'មិនអាចតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ (Backend API) បានទេ។ ប្រសិនបើអ្នកកំពុងដំណើរការលើ GitHub Pages សូមដំណើរការតាមរយៈ Node.js (npm run dev ឬ server)។'
            : 'Cannot connect to backend API. If hosting on static GitHub Pages, run via Node.js server (npm run dev/start).'
        );
      }
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to encrypt document');
      }

      // Convert back to Uint8Array
      const encryptedBase64 = data.encryptedPdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const raw = atob(encryptedBase64);
      const encArray = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        encArray[i] = raw.charCodeAt(i);
      }

      const cleanName = fileName.replace(/\.pdf$/i, '');
      triggerDownload(encArray, `${cleanName}_protected.pdf`);

      setEncryptSuccessMsg(
        isKm
          ? 'ឯកសារត្រូវបានចាក់សោដោយលេខសម្ងាត់ជោគជ័យ និងបានទាញយក!'
          : 'Document successfully encrypted and downloaded!'
      );
    } catch (err: any) {
      alert(err.message || 'Encryption failed');
    } finally {
      setIsEncrypting(false);
    }
  };

  // 2. Handle Decrypt / Remove Password
  const handleDecryptPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decryptPassword) {
      alert(isKm ? 'សូមបញ្ចូលលេខសម្ងាត់ចាស់!' : 'Please enter the current password!');
      return;
    }

    try {
      setIsDecrypting(true);
      setDecryptError(null);
      setDecryptSuccessMsg(null);

      let binary = '';
      const len = pdfBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(pdfBytes[i]);
      }
      const pdfBase64 = btoa(binary);

      const resp = await fetch('/api/pdf/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          password: decryptPassword,
        }),
      });

      let data: any = null;
      try {
        data = await resp.json();
      } catch (_e) {
        throw new Error(
          isKm
            ? 'មិនអាចតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ (Backend API) បានទេ។ ប្រសិនបើអ្នកកំពុងដំណើរការលើ GitHub Pages សូមដំណើរការតាមរយៈ Node.js (npm run dev ឬ server)។'
            : 'Cannot connect to backend API. If hosting on static GitHub Pages, run via Node.js server (npm run dev/start).'
        );
      }
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Incorrect password');
      }

      const cleanBase64 = data.decryptedPdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const raw = atob(cleanBase64);
      const decArray = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        decArray[i] = raw.charCodeAt(i);
      }

      onPdfBytesUpdated(decArray);
      const cleanName = fileName.replace(/\.pdf$/i, '');
      triggerDownload(decArray, `${cleanName}_unlocked.pdf`);

      setDecryptSuccessMsg(
        isKm
          ? 'បានដោះសោលេខសម្ងាត់ជាស្ថាពរ! ឥឡូវនេះឯកសារអាចបើកបានដោយសេរី។'
          : 'Password successfully removed! The document can now be opened without restrictions.'
      );
    } catch (err: any) {
      setDecryptError(err.message || 'Failed to decrypt document');
    } finally {
      setIsDecrypting(false);
    }
  };

  // 3. Handle Apply Watermark
  const handleApplyWatermark = async () => {
    try {
      setIsWatermarking(true);
      const watermarkedBytes = await applyWatermarkToPdf(pdfBytes, {
        text: watermarkText,
        fontSize: watermarkFontSize,
        opacity: watermarkOpacity,
        rotation: watermarkRotation,
        color: watermarkColor,
        repeat: repeatWatermark,
      });

      onPdfBytesUpdated(watermarkedBytes);
      const cleanName = fileName.replace(/\.pdf$/i, '');
      triggerDownload(watermarkedBytes, `${cleanName}_watermarked.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to apply watermark');
    } finally {
      setIsWatermarking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <span>{isKm ? 'ប្រព័ន្ធការពារឯកសារ និងសុវត្ថិភាព' : 'Document Security & Encryption Suite'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {isKm
            ? 'ការពារឯកសារដោយកូដនីយកម្មលេខសម្ងាត់ (AES) ដោះសោ និងបោះត្រាទឹកសម្ងាត់'
            : 'Protect files with standard password encryption, unlock secured PDFs, and stamp watermarks'}
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 max-w-lg">
        <button
          onClick={() => setSubTab('encrypt')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'encrypt'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span>{isKm ? '១. ចាក់សោដោយលេខសម្ងាត់' : '1. Lock with Password'}</span>
        </button>

        <button
          onClick={() => setSubTab('decrypt')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'decrypt'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Unlock className="w-3.5 h-3.5 text-blue-600" />
          <span>{isKm ? '២. ដោះសោលេខសម្ងាត់' : '2. Unlock PDF'}</span>
        </button>

        <button
          onClick={() => setSubTab('watermark')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'watermark'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stamp className="w-3.5 h-3.5 text-rose-600" />
          <span>{isKm ? '៣. ត្រាទឹកសម្ងាត់' : '3. Watermark'}</span>
        </button>
      </div>

      {/* 1. ENCRYPT TAB */}
      {subTab === 'encrypt' && (
        <form onSubmit={handleEncryptPdf} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password inputs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span>{isKm ? 'កំណត់លេខសម្ងាត់បើកឯកសារ' : 'Set Document User Password'}</span>
              </h3>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {isKm ? 'លេខសម្ងាត់អ្នកប្រើប្រាស់ (User Password) *' : 'User Password (Required to Open) *'}
                </label>
                <div className="relative">
                  <input
                    id="input-user-password"
                    type={showPassword ? 'text' : 'password'}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder={isKm ? 'បញ្ចូលលេខសម្ងាត់...' : 'Enter password...'}
                    required
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {userPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1.5 mb-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 rounded-full transition-all ${
                            step <= passwordScore
                              ? passwordScore <= 1
                                ? 'bg-rose-500'
                                : passwordScore <= 2
                                ? 'bg-amber-500'
                                : passwordScore <= 3
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {passwordScore <= 1
                        ? isKm ? 'ខ្សោយ' : 'Weak'
                        : passwordScore <= 2
                        ? isKm ? 'មធ្យម' : 'Medium'
                        : passwordScore <= 3
                        ? isKm ? 'ល្អ' : 'Strong'
                        : isKm ? 'ខ្លាំងក្លាបំផុត' : 'Very Strong'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {isKm ? 'បញ្ជាក់លេខសម្ងាត់ម្តងទៀត (Confirm Password) *' : 'Confirm Password *'}
                </label>
                <input
                  id="input-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isKm ? 'បញ្ចូលលេខសម្ងាត់ម្តងទៀត...' : 'Re-enter password...'}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  {isKm ? 'លេខសម្ងាត់ម្ចាស់ឯកសារ (Owner Password - ស្រេចចិត្ត)' : 'Owner/Master Password (Optional)'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder={isKm ? 'សម្រាប់គ្រប់គ្រងសិទ្ធិ...' : 'For managing permissions...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Permission Control Flags */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>{isKm ? 'កំណត់សិទ្ធិឯកសារ (User Permissions)' : 'Permission Restrictions'}</span>
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {isKm ? 'អនុញ្ញាតឱ្យបោះពុម្ព (Allow Printing)' : 'Allow Printing'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isKm ? 'អ្នកអានអាចបោះពុម្ពឯកសារចេញក្រដាសបាន' : 'Allow high-res printing of document'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={canPrint}
                    onChange={(e) => setCanPrint(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {isKm ? 'អនុញ្ញាតឱ្យចម្លងខ្លឹមសារ (Allow Copying)' : 'Allow Copying Content'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isKm ? 'អ្នកអានអាច Select & Copy អត្ថបទបាន' : 'Allow copy-pasting text & graphics'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={canCopy}
                    onChange={(e) => setCanCopy(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {isKm ? 'អនុញ្ញាតឱ្យកែសម្រួល (Allow Modifying)' : 'Allow Modifying'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isKm ? 'អនុញ្ញាតឱ្យបន្ថែម ឬកែប្រែទំព័រ' : 'Allow modifying page contents'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={canModify}
                    onChange={(e) => setCanModify(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {isKm ? 'អនុញ្ញាតឱ្យបំពេញទម្រង់ (Allow Form Fill)' : 'Allow Form Filling'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isKm ? 'អនុញ្ញាតឱ្យចុះហត្ថលេខា ឬបំពេញប្រអប់ទិន្នន័យ' : 'Allow filling form fields and signing'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={canAnnotate}
                    onChange={(e) => setCanAnnotate(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {encryptSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{encryptSuccessMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              id="btn-encrypt-download"
              type="submit"
              disabled={isEncrypting}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {isEncrypting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isKm ? 'កំពុងចាក់សោកូដនីយកម្ម...' : 'Encrypting Document...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{isKm ? 'ចាក់សោ និងទាញយក PDF (Lock & Download)' : 'Lock & Download Encrypted PDF'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 2. DECRYPT TAB */}
      {subTab === 'decrypt' && (
        <form onSubmit={handleDecryptPdf} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs max-w-xl space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Unlock className="w-5 h-5 text-blue-600" />
            <span>{isKm ? 'ដោះសោ និងលុបលេខសម្ងាត់ជាស្ថាពរ' : 'Remove Password Protection Permanently'}</span>
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isKm
              ? 'ប្រសិនបើអ្នកចង់លុបលេខសម្ងាត់ចោល ដើម្បីឱ្យឯកសារអាចបើកបានដោយសេរីដោយមិនបាច់សួរលេខសម្ងាត់តទៅទៀត សូមបញ្ចូលលេខសម្ងាត់បច្ចុប្បន្ន រួចចុច "ដោះសោ"។'
              : 'Enter the existing document password to strip encryption permanently so it opens without prompts.'}
          </p>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              {isKm ? 'លេខសម្ងាត់បច្ចុប្បន្ន (Current Password)' : 'Current Password'}
            </label>
            <input
              type="password"
              value={decryptPassword}
              onChange={(e) => setDecryptPassword(e.target.value)}
              placeholder={isKm ? 'បញ្ចូលលេខសម្ងាត់...' : 'Enter password...'}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {decryptError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{decryptError}</span>
            </div>
          )}

          {decryptSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{decryptSuccessMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              id="btn-decrypt-download"
              type="submit"
              disabled={isDecrypting}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isDecrypting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isKm ? 'កំពុងដោះសោ...' : 'Removing Password...'}</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>{isKm ? 'ដោះសោ និងទាញយក PDF ដោយសេរី' : 'Remove Password & Download'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 3. WATERMARK TAB */}
      {subTab === 'watermark' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Watermark Configuration */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Stamp className="w-4 h-4 text-rose-600" />
                <span>{isKm ? 'កំណត់អត្ថបទត្រាទឹក (Watermark Text)' : 'Watermark Settings'}</span>
              </h3>

              {/* Quick Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {isKm ? 'ពាក្យគំរូទូទៅ (Presets)' : 'Common Presets'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'សម្ងាត់ / CONFIDENTIAL',
                    'ឯកសារផ្ទៃក្នុង',
                    'ច្បាប់ចម្លង (COPY)',
                    'TOP SECRET',
                    'DRAFT / សេចក្តីព្រាង',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWatermarkText(preset)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        watermarkText === preset
                          ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {isKm ? 'អត្ថបទត្រាទឹកផ្ទាល់ខ្លួន (Custom Text)' : 'Custom Watermark Text'}
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder={isKm ? 'ឧ. សម្ងាត់ ឬឈ្មោះស្ថាប័ន...' : 'e.g. CONFIDENTIAL...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {isKm ? 'ពណ៌ត្រាទឹក (Color)' : 'Watermark Color'}
                </label>
                <div className="flex gap-2">
                  {[
                    { color: '#dc2626', name: 'ក្រហម (Red)' },
                    { color: '#1e3a8a', name: 'ខៀវ (Navy)' },
                    { color: '#475569', name: 'ប្រផេះ (Slate)' },
                    { color: '#d97706', name: 'លឿងទុំ (Amber)' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setWatermarkColor(c.color)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        watermarkColor === c.color
                          ? 'border-slate-900 bg-slate-100 ring-2 ring-slate-300'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{isKm ? 'ភាពស្រអាប់ (Opacity)' : 'Opacity'}</span>
                    <span>{Math.round(watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{isKm ? 'ទំហំអក្សរ (Font Size)' : 'Font Size'}</span>
                    <span>{watermarkFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    step="2"
                    value={watermarkFontSize}
                    onChange={(e) => setWatermarkFontSize(parseInt(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{isKm ? 'មុំបង្វិល (Rotation Angle)' : 'Rotation'}</span>
                    <span>{watermarkRotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={watermarkRotation}
                    onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repeatWatermark}
                    onChange={(e) => setRepeatWatermark(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {isKm ? 'បោះត្រាពេញផ្ទៃទំព័រ (Repeat Grid Watermark)' : 'Repeat diagonally across page'}
                  </span>
                </label>
              </div>
            </div>

            {/* Live Watermark Preview Mockup */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
              <h3 className="font-bold text-slate-900 text-sm mb-3">
                {isKm ? 'ទិដ្ឋភាពគំរូត្រាទឹក (Live Visual Preview)' : 'Watermark Preview'}
              </h3>

              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center p-8 min-h-[300px]">
                {/* Mock document lines */}
                <div className="w-full max-w-[280px] space-y-2 opacity-25 pointer-events-none">
                  <div className="h-3 bg-slate-400 rounded w-3/4 mx-auto mb-4" />
                  <div className="h-2 bg-slate-300 rounded w-full" />
                  <div className="h-2 bg-slate-300 rounded w-5/6" />
                  <div className="h-2 bg-slate-300 rounded w-full" />
                  <div className="h-2 bg-slate-300 rounded w-4/5" />
                  <div className="h-2 bg-slate-300 rounded w-full" />
                </div>

                {/* Simulated Watermark Text */}
                <div
                  className="absolute pointer-events-none font-bold uppercase select-none tracking-wider text-center"
                  style={{
                    color: watermarkColor,
                    opacity: watermarkOpacity,
                    transform: `rotate(${watermarkRotation}deg)`,
                    fontSize: `${watermarkFontSize * 0.6}px`,
                  }}
                >
                  {watermarkText || 'SAMPLE WATERMARK'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  id="btn-apply-watermark"
                  onClick={handleApplyWatermark}
                  disabled={isWatermarking}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isWatermarking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isKm ? 'កំពុងបោះត្រាទឹក...' : 'Stamping Watermark...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{isKm ? 'បោះត្រាទឹក និងទាញយក PDF' : 'Apply Watermark & Download'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
