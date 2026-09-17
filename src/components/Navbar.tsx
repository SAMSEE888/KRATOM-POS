import {
  Activity,
  BarChart3,
  Calculator,
  CircleDollarSign,
  CloudCheck,
  CloudOff,
  Flame,
  History,
  Lightbulb,
  Package,
  RotateCw,
  Settings,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { GasSettings } from '../types';

export type ActiveTab =
  | 'POS'
  | 'BOILING'
  | 'MIXING'
  | 'INVENTORY'
  | 'MANUAL_EXPENSE'
  | 'BI_ANALYTICS'
  | 'LOGS';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  gasSettings: GasSettings;
  isSyncing: boolean;
  onManualSync: () => void;
  onOpenConfig: () => void;
  onOpenHistory: () => void;
  todaySalesCount: number;
  todayRevenue: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  gasSettings,
  isSyncing,
  onManualSync,
  onOpenConfig,
  onOpenHistory,
  todaySalesCount,
  todayRevenue,
}: NavbarProps) {
  const isGasConnected = !!gasSettings.webAppUrl && gasSettings.webAppUrl.startsWith('http');

  const navItems: { id: ActiveTab; label: string; icon: typeof ShoppingBag; badge?: string }[] = [
    { id: 'POS', label: 'ขายหน้าร้าน (POS)', icon: ShoppingBag },
    { id: 'BOILING', label: 'คำนวณต้มน้ำดิบ', icon: Flame },
    { id: 'MIXING', label: 'ผสมสูตร & ย้อนกลับ', icon: Calculator },
    { id: 'INVENTORY', label: 'จัดการสต๊อก', icon: Package },
    { id: 'MANUAL_EXPENSE', label: 'บันทึกขาย/รายจ่าย', icon: CircleDollarSign },
    { id: 'BI_ANALYTICS', label: 'BI Analytics ขั้นสูง', icon: BarChart3, badge: '5 Charts' },
    { id: 'LOGS', label: 'ประวัติธุรกรรม (Logs)', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: Brand, Status, Quick Actions */}
        <div className="flex items-center justify-between py-3 border-b border-white/5 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-300/40 text-black font-extrabold text-lg">
              3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wide text-lg text-white font-['Plus_Jakarta_Sans']">
                  KRATOM POS
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SAMSEE BI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                ระบบจัดการหน้าร้าน สต๊อก และวิเคราะห์ข้อมูลระดับอุตสาหกรรม
              </p>
            </div>
          </div>

          {/* Quick Metrics & GAS Connection Status */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Today KPI Pill */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>วันนี้:</span>
              </div>
              <span className="font-bold text-white font-mono">{todaySalesCount} บิล</span>
              <span className="text-slate-600">|</span>
              <span className="font-bold text-emerald-400 font-mono">฿{todayRevenue.toLocaleString()}</span>
            </div>

            {/* Cloud Status Pill */}
            <button
              onClick={onOpenConfig}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                isGasConnected
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:bg-slate-800/60'
              }`}
              title={isGasConnected ? 'เชื่อมต่อ Google Apps Script เรียบร้อย' : 'ใช้งานโหมดออฟไลน์ (คลิกเพื่อตั้งค่า Sheets)'}
            >
              {isGasConnected ? (
                <>
                  <CloudCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline font-medium">Google Sheets Live</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Local Mode</span>
                </>
              )}
            </button>

            {/* Sync Action */}
            {isGasConnected && (
              <button
                id="btn-sync-gas"
                onClick={onManualSync}
                disabled={isSyncing}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                title="ซิงค์ข้อมูลกับ Google Sheets ทันที"
              >
                <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            )}

            {/* Transaction Log History Button */}
            <button
              id="btn-nav-history"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-medium transition-all"
            >
              <History className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">ประวัติรายการ</span>
            </button>

            {/* Settings Button */}
            <button
              id="btn-nav-settings"
              onClick={onOpenConfig}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              title="ตั้งค่าต้นทุน สินค้า และ Google Apps Script"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Scrollable Strip */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? 'bg-black/20 text-black font-bold'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
