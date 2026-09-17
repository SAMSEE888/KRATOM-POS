import { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Database,
  ExternalLink,
  HelpCircle,
  Key,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  X,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  onTestGasConnection: () => Promise<{ success: boolean; message: string }>;
  onResetSeedData: () => void;
  isOnline: boolean;
}

export function SettingsModal({
  isOpen,
  onClose,
  gasUrl,
  onSaveGasUrl,
  onTestGasConnection,
  onResetSeedData,
  isOnline,
}: SettingsModalProps) {
  const [urlInput, setUrlInput] = useState(gasUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'CONNECTION' | 'GUIDE'>('CONNECTION');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveGasUrl(urlInput.trim());
    setTestResult(null);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await onTestGasConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full border border-white/10 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                การตั้งค่าระบบ & การเชื่อมต่อ Google Sheets (GAS)
              </h3>
              <p className="text-xs text-slate-400">
                ระบบทำงานแบบ Hybrid: Local Storage ออฟไลน์ 100% พร้อมเชื่อมต่อไปยัง Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/10 mt-3 shrink-0">
          <button
            onClick={() => setActiveTab('CONNECTION')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'CONNECTION'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            การเชื่อมต่อ Web App URL
          </button>
          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'GUIDE'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            คู่มือติดตั้ง Google Sheets 4 แท็บ (Code.gs)
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 overflow-y-auto space-y-4 text-xs flex-1 pr-1">
          {activeTab === 'CONNECTION' ? (
            <>
              {/* Status indicator */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block font-medium">สถานะการเชื่อมต่อปัจจุบัน</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        gasUrl && isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span className="font-semibold text-white">
                      {gasUrl
                        ? isOnline
                          ? 'ออนไลน์ เชื่อมต่อ Google Sheets Web App'
                          : 'กำลังเชื่อมต่อ...'
                        : 'โหมดออฟไลน์ (Local Storage เท่านั้น)'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleTest}
                  disabled={isTesting || !urlInput}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>ทดสอบเชื่อมต่อ</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* GAS URL Input */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Google Apps Script Web App URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/XXXXX/exec"
                    className="flex-1 px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึก</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  วาง Web App URL ที่ได้จากการกด Deploy ใน Google Apps Script
                </p>
              </div>

              {/* Reset to initial seed */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">รีเซ็ตข้อมูลตัวอย่าง (Reset Seed Data)</h4>
                    <p className="text-[11px] text-slate-400">
                      ล้าง Local Storage และเติมข้อมูลเริ่มต้นของระบบ Kratom POS · SAMSEE
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('คุณต้องการรีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นตัวอย่างใช่หรือไม่?')) {
                        onResetSeedData();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>รีเซ็ตค่าเริ่มต้น</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* GUIDE TAB */
            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <h4 className="font-bold text-emerald-300 text-sm mb-1">
                  ขั้นตอนการติดตั้ง Google Sheets Database ฟรี 100%:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-xs">
                  <li>เปิด Google Sheets ใหม่เปล่าๆ ขึ้นมา 1 ไฟล์</li>
                  <li>
                    ไปที่เมนู <strong className="text-white">ส่วนขยาย (Extensions)</strong> &gt;{' '}
                    <strong className="text-white">Apps Script</strong>
                  </li>
                  <li>
                    คัดลอกโค้ดจากไฟล์ <code className="text-emerald-300 font-mono">Code.gs</code> ในโปรเจกต์นี้ ไปวางทับใน Apps Script ทั้งหมด
                  </li>
                  <li>
                    เลือกฟังก์ชัน <code className="text-emerald-300 font-mono">setupSystem</code> แล้วกด{' '}
                    <strong className="text-white">เรียกใช้ (Run)</strong> เพื่อสร้าง 4 แท็บฐานข้อมูลอัตโนมัติ:
                    <ul className="list-disc list-inside pl-4 text-slate-400 text-[11px] mt-0.5">
                      <li>StockLogs (บันทึกสต๊อกและการขาย)</li>
                      <li>Expenses (บันทึกรายจ่าย)</li>
                      <li>Products (รายการสินค้าและราคา)</li>
                      <li>Config (การตั้งค่าต้นทุนและสัดส่วน)</li>
                    </ul>
                  </li>
                  <li>
                    กดปุ่ม <strong className="text-white">ทำให้ใช้งานได้ (Deploy)</strong> &gt;{' '}
                    <strong className="text-white">การทำให้ใช้งานได้ใหม่ (New deployment)</strong>
                  </li>
                  <li>
                    เลือกประเภท <strong className="text-white">เว็บแอป (Web app)</strong>, ตั้งค่าสิทธิ์{' '}
                    <strong className="text-white">&quot;ทุกคน (Anyone)&quot;</strong>
                  </li>
                  <li>คัดลอก Web App URL นำมาวางในช่อง URL การเชื่อมต่อของระบบนี้!</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="font-semibold text-white block">
                  คุณสมบัติด้านความปลอดภัยและการทำงานพร้อมกัน (Concurrency Lock):
                </span>
                <p className="text-[11px] text-slate-400">
                  ไฟล์ <code className="text-emerald-400">Code.gs</code> มีการใช้{' '}
                  <code className="text-white font-mono">LockService.getScriptLock()</code>{' '}
                  เพื่อป้องกันข้อมูลสต๊อกชนกันเมื่อมีพนักงานหรือแคชเชียร์บันทึกการขายพร้อมกันหลายเครื่อง!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
